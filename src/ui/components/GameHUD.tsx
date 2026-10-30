import { Heart, Leaf, Pause, Shield, Skull } from "lucide-react";
import { useUI } from "../store";
import { WEAPONS } from "../../core/game";
import { SkillIcon } from "./SkillIcon";
export const formatTime = (time: number) =>
  `${Math.floor(time / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(time % 60)
    .toString()
    .padStart(2, "0")}`;
export function GameHUD({ pause }: { pause: () => void }) {
  const stats = useUI((s) => s.stats);
  return (
    <>
      <div className="hud">
        <div className="hud-top">
          <div className="health-panel">
            <div className="health-heading">
              <Heart size={15} fill="currentColor" />
              <span>SINH LỰC</span>
              <strong>
                {stats.hp}
                <small> / {stats.maxHp}</small>
              </strong>
            </div>
            <div className="health-track">
              <div style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }} />
            </div>
          </div>
          <button
            className="icon-button pause-button"
            aria-label="Tạm dừng"
            onClick={pause}
          >
            <Pause size={20} fill="currentColor" />
          </button>
        </div>
        <div
          className="xp-track"
          aria-label={`Kinh nghiệm ${stats.xp} trên ${stats.nextXp}`}
        >
          <div
            style={{
              width: `${Math.min(100, (stats.xp / stats.nextXp) * 100)}%`,
            }}
          />
        </div>
        <div className="run-bar">
          <span className="level-badge">
            <Shield size={13} /> CẤP {stats.level.toString().padStart(2, "0")}
          </span>
          <strong>{formatTime(stats.time)}</strong>
          <span className="kill-count">
            <Skull size={16} />
            {stats.kills.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="location-label">
          <Leaf size={11} /> RỪNG THÌ THẦM <span /> ĐỢT {stats.wave}
        </div>
        {stats.boss && !stats.boss.warning && (
          <div className="boss-health">
            <span>GOLEM · KẺ GIỮ CỔNG</span>
            <div>
              <i
                style={{
                  width: `${(stats.boss.hp / stats.boss.maxHp) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="weapon-rack">
        {WEAPONS.filter((id) => stats.weapons[id] > 0).map((id) => (
          <div
            key={id}
            className={`active-weapon skill-${id}`}
            aria-label={`${id === "sword" ? "Kiếm phép" : id === "fireball" ? "Hỏa cầu" : "Thiên lôi"} cấp ${stats.weapons[id]}`}
          >
            <SkillIcon id={id} size={23} />
            <small>{stats.weapons[id]}</small>
          </div>
        ))}
      </div>
      {stats.time < 10 && (
        <div className="combat-tip">
          <span>
            Chạm bất kỳ đâu và kéo
            <br />
            <strong>Kiếm sẽ lo phần còn lại.</strong>
          </span>
        </div>
      )}
      {stats.boss?.warning && (
        <div className="boss-warning">
          <Skull size={28} />
          <strong>CỔ THỤ ĐANG THỨC GIẤC</strong>
          <span>Golem đã nghe thấy bước chân bạn…</span>
        </div>
      )}
      <div className="bottom-safe-line" />
    </>
  );
}
