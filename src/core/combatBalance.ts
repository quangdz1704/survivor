/** Shared tuning keeps combat, HUD, descriptions and simulations in agreement. */
export const RAGE = {
  duration: 3,
  maxUses: 2,
  manaPerKill: 0.15,
  manaPerElite: 4,
  manaPerSecond: 0.1,
  damageBonus: 1.18,
  attackSpeedBonus: 1.12,
  swordRadius: 72,
  swordSway: 22,
  leafRadius: 165,
  frostRadius: 165,
  meteorRadius: 65,
} as const;
export const EVOLVED = {
  sword: { radius: 60, damage: 1.05, hitInterval: 0.44 },
  frost: {
    radius: 100,
    damage: 0.7,
    interval: 0.65,
    slow: 0.32,
    slowDuration: 1.25,
  },
  leaf: { count: 4, range: 180, speed: 330, damage: 0.9, interval: 1.05 },
  powerPerRank: 0.12,
  areaPerRank: 0.12,
} as const;
