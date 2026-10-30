import { Flame } from "lucide-react";
import { useUI } from "../store";
import { bridge } from "../../game/bridge";
import { RAGE_NAMES } from "../../game/RageCombat";
export function RageControl() {
  const stats = useUI((s) => s.stats),
    mode = useUI((s) => s.mode),
    active = stats.rageRemaining > 0;
  return (
    <div
      className={`rage-control ${stats.mana >= 100 ? "rage-ready" : ""} ${active ? "rage-active" : ""}`}
    >
      <button
        className="rage-button"
        aria-label={`Cuồng nộ: ${RAGE_NAMES[stats.rageWeapon]}, mana ${Math.floor(stats.mana)} trên 100`}
        disabled={mode !== "playing" || stats.mana < 100 || active}
        onClick={() => bridge.send("rage", undefined)}
        style={
          {
            "--mana": `${active ? (stats.rageRemaining / 6) * 100 : stats.mana}%`,
          } as React.CSSProperties
        }
      >
        <span className="rage-fill" />
        <Flame size={25} />
        <strong>
          {active
            ? `${stats.rageRemaining.toFixed(1)}s`
            : stats.mana >= 100
              ? "CUỒNG NỘ"
              : `${Math.floor(stats.mana)}%`}
        </strong>
      </button>
      <small>{RAGE_NAMES[stats.rageWeapon]}</small>
    </div>
  );
}
