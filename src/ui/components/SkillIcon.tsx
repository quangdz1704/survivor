import {
  Flame,
  Heart,
  Magnet,
  MoveUpRight,
  Swords,
  Target,
  Wind,
  Zap,
  TrendingUp,
  Snowflake,
  Leaf,
  Orbit,
  Tornado,
} from "lucide-react";
import type { UpgradeId } from "../../core/game";
export function SkillIcon({ id, size = 24 }: { id: UpgradeId; size?: number }) {
  if (id === "blizzard")
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 9a8.5 8.5 0 0 1 14-3M20 15a8.5 8.5 0 0 1-14 3M15 3l3 3-4 1M9 21l-3-3 4-1" />
        <path d="M12 7v10M7.7 9.5l8.6 5M7.7 14.5l8.6-5M10.5 8.5 12 10l1.5-1.5M10.5 15.5 12 14l1.5 1.5" />
      </svg>
    );
  const Icon = {
    sword: Swords,
    fireball: Flame,
    lightning: Zap,
    frost: Snowflake,
    leaf: Leaf,
    health: Heart,
    damage: TrendingUp,
    haste: Wind,
    speed: MoveUpRight,
    magnet: Magnet,
    critical: Target,
    "sword-array": Orbit,
    "leaf-vortex": Tornado,
  }[id];
  return <Icon size={size} />;
}
