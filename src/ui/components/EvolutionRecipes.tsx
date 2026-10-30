import { Sparkles } from "lucide-react";
import { EVOLUTION_IDS, EVOLUTIONS, UPGRADE_NAMES } from "../../core/game";
import type { Snapshot } from "../../game/bridge";
import { SkillIcon } from "./SkillIcon";

export function EvolutionRecipes({
  progress,
}: {
  progress?: Pick<Snapshot, "weapons" | "ranks" | "evolutions">;
}) {
  return (
    <details className="evolution-recipes">
      <summary>
        <Sparkles size={14} /> Công thức tiến hóa <span>3 công thức</span>
      </summary>
      <div className="evolution-recipe-list">
        {EVOLUTION_IDS.map((id) => {
          const recipe = EVOLUTIONS[id];
          const weaponRank = progress?.weapons[recipe.weapon] ?? 0;
          const passiveRank = progress?.ranks[recipe.passive] ?? 0;
          const evolved = progress?.evolutions[id] ?? false;
          const ready =
            weaponRank >= recipe.weaponRank &&
            passiveRank >= recipe.passiveRank;
          return (
            <div
              className={`evolution-recipe ${ready || evolved ? "ready" : ""}`}
              key={id}
            >
              <SkillIcon id={id} size={20} />
              <div>
                <strong>
                  {UPGRADE_NAMES[id]}
                  {evolved ? " · Đã tiến hóa" : ready ? " · Sẵn sàng" : ""}
                </strong>
                <span>
                  {UPGRADE_NAMES[recipe.weapon]}{" "}
                  {progress ? `${weaponRank}/` : "cấp "}
                  {recipe.weaponRank}
                  {" + "}
                  {UPGRADE_NAMES[recipe.passive]}{" "}
                  {progress ? `${passiveRank}/` : "cấp "}
                  {recipe.passiveRank}
                </span>
              </div>
            </div>
          );
        })}
        <p>
          Đủ điều kiện sẽ có thẻ tiến hóa khi lên cấp. Tiến hóa chỉ áp dụng
          trong lượt này.
        </p>
      </div>
    </details>
  );
}
