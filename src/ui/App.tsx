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
import { profileRepository } from "../core/profile";
import { settleResult } from "../core/game";
import { audioManager } from "../audio/AudioManager";
import { GameHUD, formatTime } from "./components/GameHUD";
import { LevelUp, Records, Shop } from "./components/Progression";
import { SettingsPanel } from "./components/SettingsPanel";
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
    [shop, setShop] = useState(false),
    [guide, setGuide] = useState(false),
    [records, setRecords] = useState(false),
    [updateAvailable, setUpdateAvailable] = useState(false),
    [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  useEffect(() => {
    let mounted = true;
    const state = useUI.getState();
    const offReady = bridge.whenReady(state.setReady),
      offStats = bridge.subscribe(state.setStats),
      offChoices = bridge.event("choices", state.setChoices);
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
    if (!ready || !profileReady) return;
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
          <div className="menu-screen">
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
                src="/assets/adventurer.webp"
                alt="Nhân vật An với áo choàng xanh ngọc và khăn cam"
                draggable={false}
              />
              <span className="hero-spark s-one">✦</span>
              <span className="hero-spark s-two">✧</span>
              <span className="hero-spark s-three">✦</span>
              <div className="hero-label">
                <span>AN</span>
                <small>NGƯỜI GIỮ RỪNG</small>
              </div>
            </div>
            <div className="menu-bottom">
              <div className="chapter-card">
                <div className="chapter-icon">
                  <Leaf size={23} />
                </div>
                <div>
                  <span>VÙNG ĐẤT ĐẦU TIÊN</span>
                  <h2>Rừng thì thầm</h2>
                </div>
                <span className="chapter-number">01</span>
              </div>
              <button
                className="play-button"
                onClick={start}
                disabled={!ready || !profileReady}
              >
                <Swords size={23} />
                <span>
                  {ready && profileReady ? "VÀO RỪNG" : "ĐANG CHUẨN BỊ…"}
                </span>
                <ArrowRight size={23} />
              </button>
              <div className="camp-actions">
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
            {mode === "playing" && <Joystick />}
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
            </section>
          </div>
        )}
        {mode === "levelup" && <LevelUp />}
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
                  ? "Golem đã gục ngã. Khu rừng cảm ơn bạn."
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
            </section>
          </div>
        )}
        {settingsOpen && <SettingsPanel close={() => setSettingsOpen(false)} />}
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
                  <strong>Bảo vệ rừng</strong>Sống sót 5 phút, hạ Golem và né
                  vòng nện đỏ. Dùng vàng sau mỗi lượt để nâng cấp vĩnh viễn.
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
          <span className="live-dot" /> SURVIVOR MINI 1.0
        </span>
        <span>
          WASD để di chuyển <i>·</i> ESC để tạm dừng
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
