export const ELITE_IDS = ["slime-king", "orc-captain"] as const;
export type EliteId = (typeof ELITE_IDS)[number];
export const ELITES = {
  "slime-king": {
    name: "Slime vương",
    kind: "slime",
    time: 60,
    hp: 900,
    damage: 22,
    speed: 48,
    attackDamage: 28,
    scale: 1.5,
    xp: 40,
    color: 0xc7ef8b,
  },
  "orc-captain": {
    name: "Đội trưởng Orc",
    kind: "orc",
    time: 180,
    hp: 2200,
    damage: 34,
    speed: 47,
    attackDamage: 42,
    scale: 1.3,
    xp: 80,
    color: 0xffc684,
  },
} as const;
export type EliteState = "waiting" | "active" | "defeated" | "claimed";
export const initialElites = (): Record<EliteId, EliteState> => ({
  "slime-king": "waiting",
  "orc-captain": "waiting",
});
