import {
  Heart,
  Leaf,
  Pause,
  Shield,
  Skull,
  Crown,
  ArrowRight,
  PackageOpen,
} from "lucide-react";
import { useUI } from "../store";
import { WEAPONS, UPGRADE_NAMES, evolutionFor } from "../../core/game";
import { SkillIcon } from "./SkillIcon";
import { ELITES } from "../../core/encounters";
import { RELICS } from "../../core/relics";
import { RelicIcon } from "./Treasure";
export const formatTime = (time: number) =>
  `${Math.floor(time / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(time % 60)
    .toString()
    .padStart(2, "0")}`;
export function GameHUD({ pause }: { pause: () => void }) {
  const stats = useUI((s) => s.stats);
  const chest = stats.chests
    .slice()
    .sort(
      (a, b) =>
        Math.hypot(a.x - stats.x, a.y - stats.y) -
        Math.hypot(b.x - stats.x, b.y - stats.y),
    )[0];
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
        {stats.elites.map((elite) => (
          <div className="elite-health" key={elite.id}>
            <span>
              <Crown size={11} /> {ELITES[elite.id].name}{" "}
              <small>MINI-BOSS</small>
            </span>
            <div>
              <i style={{ width: `${(elite.hp / elite.maxHp) * 100}%` }} />
            </div>
          </div>
        ))}
        {chest && (
          <div className="chest-guide">
            <PackageOpen size={15} />
            <span>Nhặt rương để chọn bảo vật</span>
            <ArrowRight
              size={20}
              style={{
                transform: `rotate(${Math.atan2(chest.y - stats.y, chest.x - stats.x)}rad)`,
              }}
            />
          </div>
        )}
      </div>
      <div className="weapon-rack">
        {WEAPONS.filter((id) => stats.weapons[id] > 0).map((id) => {
          const evolution = evolutionFor(id);
          const evolved =
            evolution !== undefined && stats.evolutions[evolution];
          const displayId = evolved && evolution ? evolution : id;
          return (
            <div
              key={id}
              className={`active-weapon skill-${id} ${evolved ? "evolved-weapon" : ""}`}
              aria-label={
                evolved
                  ? `${UPGRADE_NAMES[displayId]} đã tiến hóa`
                  : `${UPGRADE_NAMES[id]} cấp ${stats.weapons[id]}`
              }
            >
              <SkillIcon id={displayId} size={23} />
              <small>{evolved ? "✦" : stats.weapons[id]}</small>
            </div>
          );
        })}
      </div>
      <div className="relic-rack" aria-label="Bảo vật trong lượt">
        {stats.relics.map((id) => (
          <span
            key={id}
            className={`relic-badge ${(id === "root" && stats.relicActive.root) || (id === "rage" && stats.relicActive.rage) ? "relic-active" : ""}`}
            style={{ color: RELICS[id].color }}
            aria-label={RELICS[id].name}
            title={RELICS[id].description}
          >
            <RelicIcon id={id} size={18} />
          </span>
        ))}
      </div>
      {stats.time < 10 && (
        <div className="combat-tip">
          <span>
            Chạm bất kỳ đâu và kéo
            <br />
            <strong>Vũ khí sẽ lo phần còn lại.</strong>
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
