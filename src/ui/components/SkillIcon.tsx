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
} from "lucide-react";
import type { UpgradeId } from "../../core/game";
export function SkillIcon({ id, size = 24 }: { id: UpgradeId; size?: number }) {
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
  }[id];
  return <Icon size={size} />;
}
