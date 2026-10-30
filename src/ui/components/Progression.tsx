import {
  ArrowLeft,
  ArrowRight,
  Coins,
  Heart,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  X,
  Wind,
  Check,
} from "lucide-react";
import { bridge } from "../../game/bridge";
import { useUI } from "../store";
import {
  buyPermanent,
  MAX_PERMANENT_LEVEL,
  permanentCost,
} from "../../core/game";
import type { PermanentId } from "../../core/game";
import { profileRepository } from "../../core/profile";
import { audioManager } from "../../audio/AudioManager";
import { SkillIcon } from "./SkillIcon";
import { useState } from "react";
export function LevelUp() {
  const choices = useUI((s) => s.choices),
    level = useUI((s) => s.stats.level);
  return (
    <div className="modal-backdrop level-backdrop">
      <section className="modal level-modal">
        <div className="modal-emblem">
          <Sparkles size={29} />
        </div>
        <span className="eyebrow">SỨC MẠNH ĐANG LỚN DẦN</span>
        <h2>Lên cấp {level}!</h2>
        <p>Chọn một món quà của khu rừng.</p>
        <div className="upgrade-choices">
          {choices.map((choice) => (
            <button
              key={choice.id}
              className={`upgrade-card ${choice.weapon ? "weapon-upgrade" : ""}`}
              onClick={() => bridge.send("choose", choice.id)}
            >
              <span className={`skill-icon skill-${choice.id}`}>
                <SkillIcon id={choice.id} />
              </span>
              <span className="upgrade-copy">
                <small>
                  {choice.current === 0
                    ? choice.weapon
                      ? "VŨ KHÍ MỚI"
                      : "KỸ NĂNG MỚI"
                    : `CẤP ${choice.current} → ${choice.next}`}
                </small>
                <strong>{choice.name}</strong>
                <span>{choice.description}</span>
              </span>
              <ArrowRight size={17} />
            </button>
          ))}
        </div>
        <small className="modal-note">
          Thời gian tạm dừng để bạn lựa chọn.
        </small>
      </section>
    </div>
  );
}
export function Shop({ close }: { close: () => void }) {
  const profile = useUI((s) => s.profile),
    setProfile = useUI((s) => s.setProfile);
  const [busy, setBusy] = useState(false);
  const items: {
    id: PermanentId;
    name: string;
    benefit: string;
    icon: typeof Heart;
  }[] = [
    {
      id: "health",
      name: "Trái tim bền bỉ",
      benefit: "+15 sinh lực khởi đầu mỗi cấp",
      icon: Heart,
    },
    {
      id: "damage",
      name: "Lưỡi kiếm sắc bén",
      benefit: "+2 sát thương cơ bản mỗi cấp",
      icon: Swords,
    },
    {
      id: "speed",
      name: "Đôi giày phiêu lưu",
      benefit: "+3,5% tốc độ di chuyển mỗi cấp",
      icon: Wind,
    },
  ];
  async function buy(id: PermanentId) {
    if (busy) return;
    setBusy(true);
    try {
      let purchased = false;
      const next = await profileRepository.update((profile) => {
        const next = buyPermanent(profile, id);
        purchased = next.upgrades[id] > profile.upgrades[id];
        return next;
      });
      setProfile(next);
      useUI.setState({ storageAvailable: profileRepository.available });
      if (purchased) audioManager.play("level");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section className="modal shop-modal">
        <button
          className="modal-close icon-button"
          aria-label="Đóng cửa hàng"
          disabled={busy}
          onClick={close}
        >
          <X size={20} />
        </button>
        <div className="modal-emblem">
          <Shield size={27} />
        </div>
        <span className="eyebrow">CHUẨN BỊ CHO CHUYẾN ĐI MỚI</span>
        <h2>Góc nâng cấp</h2>
        <div className="shop-wallet">
          <Coins size={19} />
          <strong>{profile.gold.toLocaleString("vi-VN")}</strong>
          <span>vàng</span>
        </div>
        <div className="shop-items">
          {items.map(({ id, name, benefit, icon: Icon }) => {
            const rank = profile.upgrades[id],
              max = rank >= MAX_PERMANENT_LEVEL,
              cost = permanentCost(id, rank);
            return (
              <article className="shop-item" key={id}>
                <span className="skill-icon">
                  <Icon size={24} />
                </span>
                <div className="shop-copy">
                  <strong>{name}</strong>
                  <small>
                    Cấp {rank}/{MAX_PERMANENT_LEVEL} · {benefit}
                  </small>
                  <div className="rank-track">
                    {Array.from({ length: MAX_PERMANENT_LEVEL }, (_, i) => (
                      <i key={i} className={i < rank ? "filled" : ""} />
                    ))}
                  </div>
                </div>
                <button
                  disabled={busy || max || profile.gold < cost}
                  onClick={() => void buy(id)}
                  aria-label={`Nâng cấp ${name}`}
                >
                  {max ? (
                    <Check size={18} />
                  ) : (
                    <>
                      <Coins size={13} />
                      {cost}
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>
        <p className="shop-help">Nâng cấp được giữ lại sau mỗi lượt chơi.</p>
        <button className="secondary-button" disabled={busy} onClick={close}>
          <ArrowLeft size={17} /> Về trại
        </button>
      </section>
    </div>
  );
}
export function Records({ close }: { close: () => void }) {
  const profile = useUI((s) => s.profile);
  return (
    <div className="modal-backdrop">
      <section className="modal">
        <button
          className="modal-close icon-button"
          aria-label="Đóng thành tích"
          onClick={close}
        >
          <X size={20} />
        </button>
        <div className="modal-emblem">
          <Trophy size={28} />
        </div>
        <h2>Những dấu chân nhỏ</h2>
        <div className="record-grid">
          <div>
            <strong>
              {Math.floor(profile.bestTime / 60)}:
              {Math.floor(profile.bestTime % 60)
                .toString()
                .padStart(2, "0")}
            </strong>
            <small>SỐNG SÓT LÂU NHẤT</small>
          </div>
          <div>
            <strong>{profile.bestKills}</strong>
            <small>HẠ QUÁI NHIỀU NHẤT</small>
          </div>
          <div>
            <strong>{profile.totalRuns}</strong>
            <small>CHUYẾN PHIÊU LƯU</small>
          </div>
          <div>
            <strong>{profile.wins}</strong>
            <small>LẦN BẢO VỆ RỪNG</small>
          </div>
        </div>
        <button className="play-button compact" onClick={close}>
          TIẾP BƯỚC PHIÊU LƯU <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
}
