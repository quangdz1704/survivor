import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Coins,
  Compass,
  Download,
  Leaf,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  X,
} from "lucide-react";
import { createGame } from "../game/createGame";
import { bridge } from "../game/bridge";
import { Joystick } from "./Joystick";
import { useUI } from "./store";
import { EvolutionRecipes } from "./components/EvolutionRecipes";
import { Treasure, RelicInventory } from "./components/Treasure";
import { profileRepository } from "../core/profile";
import { settleResult, HEROES } from "../core/game";
import { audioManager } from "../audio/AudioManager";
import { GameHUD, formatTime } from "./components/GameHUD";
import { LevelUp, Records, Shop } from "./components/Progression";
import { SettingsPanel } from "./components/SettingsPanel";
import { HeroChooser } from "./components/HeroChooser";
import { CampaignChooser } from "./components/CampaignChooser";
import { RageControl } from "./components/RageControl";
import { MAPS, DIFFICULTIES } from "../core/campaign";
import { GEAR } from "../core/equipment";
import { Armory } from "./components/Armory";
import { observeUpdate, applyUpdate } from "../pwa";
interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export function App() {
  const mount = useRef<HTMLDivElement>(null),
    shell = useRef<HTMLDivElement>(null);
  const mode = useUI((s) => s.mode),
    ready = useUI((s) => s.ready),
    profileReady = useUI((s) => s.profileReady),
    profile = useUI((s) => s.profile),
    settings = useUI((s) => s.settings),
    result = useUI((s) => s.result),
    rewardSaved = useUI((s) => s.rewardSaved),
    storageAvailable = useUI((s) => s.storageAvailable);
  const [settingsOpen, setSettingsOpen] = useState(false),
    [heroesOpen, setHeroesOpen] = useState(false),
    [armoryOpen, setArmoryOpen] = useState(false),
    [campaignOpen, setCampaignOpen] = useState(false),
    [shop, setShop] = useState(false),
    [guide, setGuide] = useState(false),
    [records, setRecords] = useState(false),
    [updateAvailable, setUpdateAvailable] = useState(false),
    [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const hero = HEROES[profile.hero];
  useEffect(() => {
    let mounted = true;
    const state = useUI.getState();
    const offReady = bridge.whenReady(state.setReady),
      offStats = bridge.subscribe(state.setStats),
      offChoices = bridge.event("choices", state.setChoices),
      offTreasure = bridge.event("treasure", state.setRelicChoices);
    const offResult = bridge.event("result", (runResult) => {
      state.setResult(runResult);
      void profileRepository
        .update((profile) => settleResult(profile, runResult))
        .then((saved) => {
          if (mounted) {
            state.setProfile(saved);
            state.markRewardSaved();
            useUI.setState({ storageAvailable: profileRepository.available });
          }
        });
    });
    const game = createGame(mount.current!);
    void profileRepository.load().then((saved) => {
      if (mounted) state.initializeProfile(saved, profileRepository.available);
    });
    const offUpdate = observeUpdate(() => setUpdateAvailable(true));
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    const unlock = () => audioManager.unlock(),
      click = () => audioManager.play("click");
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("click", click);
    return () => {
      mounted = false;
      offReady();
      offStats();
      offChoices();
      offTreasure();
      offResult();
      offUpdate();
      game.destroy(true);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("click", click);
    };
  }, []);
  useEffect(() => {
    audioManager.configure(settings);
    bridge.send("settings", settings);
    if (!profileReady) return;
    const timer = setTimeout(() => {
      void profileRepository
        .update((profile) => ({ ...profile, settings }))
        .then((saved) => {
          useUI.getState().setProfile(saved);
          useUI.setState({ storageAvailable: profileRepository.available });
        });
    }, 250);
    return () => clearTimeout(timer);
  }, [settings, profileReady]);
  useEffect(() => {
    const pauseGame = () => {
      if (useUI.getState().mode === "playing") {
        bridge.send("pause", true);
        useUI.getState().setMode("paused");
      }
    };
    const visibility = () => {
      if (document.hidden) {
        pauseGame();
        audioManager.suspend();
      }
    };
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const current = useUI.getState().mode;
      if (current === "playing") pauseGame();
      else if (current === "paused") {
        audioManager.unlock();
        bridge.send("pause", false);
        useUI.getState().setMode("playing");
      }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", pauseGame);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", pauseGame);
      window.removeEventListener("keydown", key);
    };
  }, []);
  function start() {
    if (!ready || !profileReady || heroesOpen) return;
    audioManager.unlock();
    setGuide(false);
    bridge.send("start", {
      ...useUI.getState().profile,
      settings: useUI.getState().settings,
    });
    useUI.getState().setMode("playing");
  }
  function home() {
    bridge.send("home", undefined);
    useUI.getState().setMode("menu");
  }
  function pause() {
    bridge.send("pause", true);
    useUI.getState().setMode("paused");
  }
  function resume() {
    audioManager.unlock();
    bridge.send("pause", false);
    useUI.getState().setMode("playing");
  }
  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }
  return (
    <main className="desktop-world">
      <div className="desktop-grain" />
      <header className="desktop-brand">
        <span className="brand-symbol">
          <Leaf size={19} />
        </span>
        <strong>
          survivor<span>mini</span>
        </strong>
        <span className="desktop-tag">MỘT CUỘC PHIÊU LƯU NHỎ.</span>
      </header>
      <section className="game-shell" ref={shell} aria-label="Survivor Mini">
        <div className="game-canvas" ref={mount} />
        {mode === "menu" && (
          <div
            className="menu-screen"
            inert={
              heroesOpen ||
              armoryOpen ||
              campaignOpen ||
              shop ||
              settingsOpen ||
              records ||
              guide
            }
          >
            <div className="menu-vignette" />
            <div className="menu-top">
              <span className="edition">
                <span /> <Coins size={12} />{" "}
                {profile.gold.toLocaleString("vi-VN")} VÀNG
              </span>
              <button
                className="icon-button"
                aria-label="Cài đặt"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings size={20} />
              </button>
            </div>
            <div className="menu-title">
              <div className="eyebrow">
                <span /> CHUYẾN PHIÊU LƯU BẮT ĐẦU <span />
              </div>
              <h1>
                SURVIVOR
                <span>
                  MINI<i>✦</i>
                </span>
              </h1>
              <p>Nhỏ bé thôi. Phiêu lưu thật lớn.</p>
            </div>
            <div className="hero-stage">
              <div className="hero-rays" />
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="hero-ground" />
              <img
                className="hero-art"
                src={hero.portrait}
                alt={`${hero.name} — ${hero.title}`}
                draggable={false}
              />
              <span className="hero-spark s-one">✦</span>
              <span className="hero-spark s-two">✧</span>
              <span className="hero-spark s-three">✦</span>
              <button
                className="hero-label hero-switch"
                onClick={() => setHeroesOpen(true)}
                disabled={!profileReady}
                aria-label="Chọn nhân vật"
              >
                <span>
                  {hero.name.toUpperCase()} <ChevronRight size={12} />
                </span>
                <small>{hero.title.toUpperCase()} · ĐỔI NHÂN VẬT</small>
              </button>
            </div>
            <div className="menu-bottom">
              <button
                className="chapter-card"
                onClick={() => setCampaignOpen(true)}
                aria-label="Chọn vùng đất và độ khó"
              >
                <div className="chapter-icon">
                  <Leaf size={23} />
                </div>
                <div>
                  <span>
                    {DIFFICULTIES[
                      profile.campaign.difficulty
                    ].name.toUpperCase()}{" "}
                    · CHỌN VÙNG ĐẤT
                  </span>
                  <h2>{MAPS[profile.campaign.map].name}</h2>
                </div>
                <ChevronRight className="chapter-number" size={22} />
              </button>
              <button
                className="play-button"
                onClick={start}
                disabled={!ready || !profileReady}
              >
                <Swords size={23} />
                <span>
                  {ready && profileReady ? "XUẤT PHÁT" : "ĐANG CHUẨN BỊ…"}
                </span>
                <ArrowRight size={23} />
              </button>
              <div className="camp-actions">
                <button onClick={() => setArmoryOpen(true)}>
                  <Sparkles size={16} />
                  Hành trang
                </button>
                <button onClick={() => setShop(true)}>
                  <Shield size={16} /> Nâng cấp
                </button>
                <button onClick={() => setRecords(true)}>
                  <Trophy size={16} /> Thành tích
                </button>
              </div>
              <div className="menu-actions">
                <button onClick={() => setGuide(true)}>
                  <Compass size={16} /> Cách chơi <ChevronRight size={15} />
                </button>
                <span>
                  <Shield size={14} /> Chuyến đi 5 phút
                </span>
              </div>
              {installPrompt && (
                <button
                  className="install-button"
                  onClick={() => void install()}
                >
                  <Download size={13} /> Cài vào màn hình chính
                </button>
              )}
              {updateAvailable && (
                <button
                  className="install-button"
                  onClick={() => void applyUpdate()}
                >
                  Có bản mới · Cập nhật
                </button>
              )}
              <p className="menu-footnote">
                Mỗi bước chân là một câu chuyện mới.
              </p>
            </div>
            <div className="leaf-corner left" />
            <div className="leaf-corner right" />
          </div>
        )}

        {mode !== "menu" && (
          <>
            <GameHUD pause={pause} />
            {mode === "playing" && (
              <>
                <Joystick />
                <RageControl />
              </>
            )}
          </>
        )}
        {mode === "paused" && (
          <div className="modal-backdrop">
            <section className="modal">
              <div className="modal-emblem">
                <Pause size={27} />
              </div>
              <span className="eyebrow">HÍT THỞ MỘT CHÚT</span>
              <h2>Rừng vẫn đợi bạn.</h2>
              <p>Cuộc phiêu lưu đang tạm dừng.</p>
              <button className="play-button compact" onClick={resume}>
                <Play size={19} /> TIẾP TỤC <ArrowRight size={19} />
              </button>
              <button
                className="secondary-button"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings size={17} /> Cài đặt
              </button>
              <button className="secondary-button" onClick={home}>
                <ArrowLeft size={17} /> Về trại
              </button>
              <RelicInventory />
            </section>
          </div>
        )}
        {mode === "levelup" && <LevelUp />}
        {mode === "treasure" && <Treasure />}
        {mode === "ended" && result && (
          <div className="modal-backdrop">
            <section className="modal result-modal">
              <div className="modal-emblem">
                {result.victory ? <Trophy size={29} /> : <Leaf size={28} />}
              </div>
              <span className="eyebrow">
                {result.victory
                  ? "RỪNG LẠI BÌNH YÊN"
                  : "MỘT CHUYẾN ĐI ĐÁNG NHỚ"}
              </span>
              <h2>
                {result.victory ? "Người hùng bé nhỏ!" : "Hẹn rừng lần sau!"}
              </h2>
              <p>
                {result.victory
                  ? "Thủ lĩnh đã gục ngã. Thử thách mới đang chờ bạn."
                  : "Mỗi chuyến đi đều giúp bạn mạnh mẽ hơn."}
              </p>
              <div className="result-stats">
                <div>
                  <strong>{formatTime(result.time)}</strong>
                  <small>THỜI GIAN</small>
                </div>
                <div>
                  <strong>{result.kills}</strong>
                  <small>ĐÃ HẠ GỤC</small>
                </div>
                <div>
                  <strong>{result.level}</strong>
                  <small>CẤP ĐẠT ĐƯỢC</small>
                </div>
              </div>
              <div className="earned-gold">
                <Coins size={23} />
                <strong>+{result.gold}</strong>
                <span>vàng</span>
              </div>
              <p className="earned-loot">
                +{result.essence ?? 0} tinh hoa
                {result.gearDrop && (
                  <>
                    <br />
                    {GEAR[result.gearDrop].name} · món trùng → +5 tinh hoa
                  </>
                )}
              </p>
              <small className="reward-status">
                {rewardSaved
                  ? "Phần thưởng đã được nhận."
                  : "Đang nhận phần thưởng…"}
              </small>
              <button
                className="play-button compact"
                onClick={start}
                disabled={!rewardSaved}
              >
                <RotateCcw size={18} /> THỬ LẠI <ArrowRight size={18} />
              </button>
              <button
                className="secondary-button"
                onClick={home}
                disabled={!rewardSaved}
              >
                Về trại
              </button>
              <RelicInventory />
            </section>
          </div>
        )}
        {settingsOpen && <SettingsPanel close={() => setSettingsOpen(false)} />}
        {armoryOpen && (
          <Armory
            close={() => setArmoryOpen(false)}
            chooseHero={() => {
              setArmoryOpen(false);
              setHeroesOpen(true);
            }}
            permanent={() => {
              setArmoryOpen(false);
              setShop(true);
            }}
          />
        )}
        {campaignOpen && (
          <CampaignChooser close={() => setCampaignOpen(false)} />
        )}
        {heroesOpen && <HeroChooser close={() => setHeroesOpen(false)} />}
        {shop && <Shop close={() => setShop(false)} />}
        {records && <Records close={() => setRecords(false)} />}
        {guide && (
          <div className="modal-backdrop">
            <section className="modal guide-modal">
              <button
                className="modal-close icon-button"
                aria-label="Đóng hướng dẫn"
                onClick={() => setGuide(false)}
              >
                <X size={20} />
              </button>
              <div className="modal-emblem">
                <Compass size={28} />
              </div>
              <span className="eyebrow">CẨM NANG NHỎ</span>
              <h2>Đừng đứng yên nhé!</h2>
              <div className="guide-row">
                <span>01</span>
                <p>
                  <strong>Chạm và di chuyển</strong>Chạm bất kỳ đâu rồi kéo.
                  Trên máy tính dùng WASD hoặc phím mũi tên.
                </p>
              </div>
              <div className="guide-row">
                <span>02</span>
                <p>
                  <strong>Thu thập và trưởng thành</strong>Nhặt tinh thể xanh từ
                  quái để lên cấp và chọn kỹ năng. Vũ khí sẽ tự chiến đấu!
                </p>
              </div>
              <div className="guide-row">
                <span>03</span>
                <p>
                  <strong>Chinh phục vùng đất</strong>Sống sót 5 phút, hạ thủ
                  lĩnh và né vùng báo chưởng. Dùng vàng, tinh hoa để nâng trang
                  bị và pet trong Hành trang.
                </p>
              </div>
              <EvolutionRecipes />
              <div className="guide-row">
                <span>04</span>
                <p>
                  <strong>Thách đấu thủ lĩnh</strong>Mini-boss xuất hiện ở phút
                  1 và phút 3. Né vòng sáng hoặc đường lao; hạ chúng rồi nhặt
                  rương để chọn bảo vật cho lượt chơi.
                </p>
              </div>
              <div className="guide-row">
                <span>05</span>
                <p>
                  <strong>Cuồng nộ và sức mạnh mới</strong>Hạ quái để nạp mana.
                  Chạm biểu tượng vũ khí để chọn chiêu; đủ100 mana, bấm Cuồng nộ
                  hoặc SPACE. Kiếm trận, Bão tuyết và Lốc lá vẫn nhận nâng cấp
                  sát thương, tầm phủ và đạn hỗ trợ sau tiến hóa.
                </p>
              </div>
              <button className="play-button compact" onClick={start}>
                <Swords size={20} /> ĐÃ HIỂU, ĐI THÔI! <ArrowRight size={20} />
              </button>
            </section>
          </div>
        )}
        {!storageAvailable && (
          <div className="storage-notice" role="status">
            Trình duyệt chưa cho lưu dữ liệu. Tiến trình chỉ giữ trong phiên
            này.
          </div>
        )}
      </section>
      <footer className="desktop-footer">
        <span>
          <span className="live-dot" /> SURVIVOR MINI 2.0
        </span>
        <span>
          WASD di chuyển <i>·</i> SPACE cuồng nộ <i>·</i> ESC tạm dừng
        </span>
        <button
          onClick={() => {
            void shell.current?.requestFullscreen?.().catch(() => undefined);
          }}
          aria-label="Toàn màn hình"
        >
          <Maximize size={15} />
        </button>
      </footer>
      <div className="desktop-side-note">
        <Sparkles size={17} />
        <span>
          MỘT KHU RỪNG.
          <br />
          VÔ VÀN KHẢ NĂNG.
        </span>
      </div>
    </main>
  );
}
