export type WeaponId = "sword" | "fireball" | "lightning" | "frost" | "leaf";
export type HeroId = "an" | "linh";
export const HEROES: Record<
  HeroId,
  {
    name: string;
    title: string;
    description: string;
    portrait: string;
    weapon: WeaponId;
    hp: number;
    damage: number;
    speed: number;
    pickup: number;
  }
> = {
  an: {
    name: "An",
    title: "Người giữ rừng",
    description: "Bền bỉ và cân bằng. Khởi đầu với Kiếm phép.",
    portrait: "/assets/adventurer.webp",
    weapon: "sword",
    hp: 100,
    damage: 10,
    speed: 180,
    pickup: 60,
  },
  linh: {
    name: "Linh",
    title: "Pháp sư sương",
    description:
      "Linh hoạt, hút XP xa hơn nhưng ít máu. Khởi đầu với Băng tinh.",
    portrait: "/assets/linh.webp",
    weapon: "frost",
    hp: 85,
    damage: 9,
    speed: 189,
    pickup: 75,
  },
};
export type PassiveId =
  "damage" | "haste" | "speed" | "magnet" | "critical" | "health";
export type UpgradeId = WeaponId | PassiveId;
export type EnemyKind = "slime" | "bat" | "skeleton" | "orc" | "golem";
export type PermanentId = "health" | "damage" | "speed";
export interface Settings {
  music: number;
  sound: number;
  effects: boolean;
  sensitivity: number;
  vibration: boolean;
}
export interface Profile {
  version: 1;
  hero: HeroId;
  gold: number;
  upgrades: Record<PermanentId, number>;
  settings: Settings;
  bestTime: number;
  bestKills: number;
  totalRuns: number;
  wins: number;
  settledRuns: string[];
}
export interface PlayerStats {
  maxHp: number;
  damage: number;
  movementSpeed: number;
  attackSpeed: number;
  criticalChance: number;
  criticalMultiplier: number;
  pickupRadius: number;
  armor: number;
}
export interface RunResult {
  id: string;
  victory: boolean;
  time: number;
  kills: number;
  level: number;
  gold: number;
}
export interface UpgradeChoice {
  id: UpgradeId;
  name: string;
  description: string;
  current: number;
  next: number;
  weapon: boolean;
}
export const WEAPONS: WeaponId[] = [
  "sword",
  "fireball",
  "lightning",
  "frost",
  "leaf",
];
export const initialWeapons = (hero: HeroId): Record<WeaponId, number> => ({
  sword: 0,
  fireball: 0,
  lightning: 0,
  frost: 0,
  leaf: 0,
  [HEROES[hero].weapon]: 1,
});
export const PASSIVES: PassiveId[] = [
  "damage",
  "haste",
  "speed",
  "magnet",
  "critical",
  "health",
];
export const MAX_PERMANENT_LEVEL = 10;
export const MATCH_DURATION = 300;
export const DEFAULT_SETTINGS: Settings = {
  music: 0.35,
  sound: 0.65,
  effects: true,
  sensitivity: 1,
  vibration: true,
};
export function newProfile(): Profile {
  return {
    version: 1,
    hero: "an",
    gold: 0,
    upgrades: { health: 0, damage: 0, speed: 0 },
    settings: { ...DEFAULT_SETTINGS },
    bestTime: 0,
    bestKills: 0,
    totalRuns: 0,
    wins: 0,
    settledRuns: [],
  };
}
export const ENEMIES: Record<
  EnemyKind,
  { hp: number; damage: number; speed: number; xp: number; radius: number }
> = {
  slime: { hp: 20, damage: 5, speed: 37, xp: 5, radius: 17 },
  bat: { hp: 12, damage: 4, speed: 65, xp: 4, radius: 15 },
  skeleton: { hp: 40, damage: 8, speed: 56, xp: 8, radius: 19 },
  orc: { hp: 100, damage: 15, speed: 34, xp: 18, radius: 25 },
  golem: { hp: 1500, damage: 25, speed: 40, xp: 100, radius: 43 },
};
export const UPGRADE_NAMES: Record<UpgradeId, string> = {
  sword: "Kiếm phép",
  fireball: "Hỏa cầu",
  lightning: "Thiên lôi",
  frost: "Băng tinh",
  leaf: "Lá xoáy",
  damage: "Sức mạnh rừng",
  haste: "Nhịp chiến đấu",
  speed: "Bước chân gió",
  magnet: "Lời gọi tinh tú",
  critical: "Mắt diều hâu",
  health: "Trái tim cổ thụ",
};
export const UPGRADE_LIMITS: Record<UpgradeId, number> = {
  sword: 6,
  fireball: 6,
  lightning: 6,
  frost: 6,
  leaf: 6,
  damage: 5,
  haste: 5,
  speed: 4,
  magnet: 4,
  critical: 5,
  health: 5,
};
export function xpRequired(level: number) {
  return Math.floor(20 * Math.pow(Math.max(1, level), 1.35));
}
export function statsFor(
  profile: Profile,
  ranks: Record<PassiveId, number>,
): PlayerStats {
  const hero = HEROES[profile.hero];
  return {
    maxHp: hero.hp + profile.upgrades.health * 15 + ranks.health * 20,
    damage:
      (hero.damage + profile.upgrades.damage * 2) * (1 + ranks.damage * 0.1),
    movementSpeed:
      hero.speed * (1 + profile.upgrades.speed * 0.035 + ranks.speed * 0.1),
    attackSpeed: 1 + ranks.haste * 0.15,
    criticalChance: 0.05 + ranks.critical * 0.05,
    criticalMultiplier: 1.5,
    pickupRadius: hero.pickup * (1 + ranks.magnet * 0.2),
    armor: 0,
  };
}
export function rolledDamage(
  base: number,
  stats: PlayerStats,
  random = Math.random,
) {
  const critical = random() < stats.criticalChance;
  return {
    damage: Math.max(
      1,
      Math.round(base * (critical ? stats.criticalMultiplier : 1)),
    ),
    critical,
  };
}
export function damageAfterArmor(damage: number, armor: number) {
  return Math.max(1, Math.round(damage - armor));
}
export function rewardFor(time: number, kills: number, victory: boolean) {
  return Math.max(
    0,
    Math.floor(
      Math.max(0, time) * 0.5 + Math.max(0, kills) * 1.5 + (victory ? 100 : 0),
    ),
  );
}
export function permanentCost(id: PermanentId, level: number) {
  const base = { health: 80, damage: 100, speed: 90 }[id];
  return Math.floor(base * Math.pow(1.65, level));
}
export function buyPermanent(profile: Profile, id: PermanentId): Profile {
  const level = profile.upgrades[id];
  if (level >= MAX_PERMANENT_LEVEL) return profile;
  const cost = permanentCost(id, level);
  if (profile.gold < cost) return profile;
  return {
    ...profile,
    gold: profile.gold - cost,
    upgrades: { ...profile.upgrades, [id]: level + 1 },
  };
}
export function settleResult(profile: Profile, result: RunResult): Profile {
  if (profile.settledRuns.includes(result.id)) return profile;
  return {
    ...profile,
    gold: profile.gold + rewardFor(result.time, result.kills, result.victory),
    bestTime: Math.max(profile.bestTime, result.time),
    bestKills: Math.max(profile.bestKills, result.kills),
    totalRuns: profile.totalRuns + 1,
    wins: profile.wins + Number(result.victory),
    settledRuns: [...profile.settledRuns.slice(-63), result.id],
  };
}
export function waveAt(time: number) {
  const phase = Math.min(4, Math.floor(Math.max(0, time) / 60));
  const compositions: EnemyKind[][] = [
    ["slime"],
    ["slime", "slime", "bat"],
    ["slime", "bat", "skeleton", "skeleton"],
    ["slime", "bat", "skeleton", "orc"],
    ["slime", "bat", "skeleton", "orc", "orc"],
  ];
  return {
    phase,
    interval: [1.05, 0.8, 0.59, 0.43, 0.31][phase],
    composition: compositions[phase],
    hpScale: 1 + Math.max(0, time - 60) / 600,
    speedScale: 1 + Math.min(0.18, time / 1800),
    boss: time >= MATCH_DURATION,
  };
}
export function weaponConfig(id: WeaponId, level: number, stats: PlayerStats) {
  const rank = Math.max(1, Math.min(6, level));
  const config = {
    sword: {
      interval: 0.65,
      range: 270,
      speed: 440,
      multiplier: 1.4,
      count: 1 + Math.floor(rank / 3),
      radius: 0,
      pierce: rank >= 4 ? 2 : 1,
    },
    fireball: {
      interval: 1.8,
      range: 340,
      speed: 285,
      multiplier: 2.4,
      count: 1 + Math.floor(rank / 3),
      radius: 44 + rank * 9,
      pierce: 1,
    },
    lightning: {
      interval: 2.1,
      range: 330,
      speed: 0,
      multiplier: 2.1,
      count: 1 + Math.floor(rank / 2),
      radius: rank >= 4 ? 165 : 330,
      pierce: 1,
    },
    frost: {
      interval: 0.95,
      range: 310,
      speed: 390,
      multiplier: 1.15,
      count: 1 + Math.floor(rank / 2),
      radius: 0,
      pierce: rank >= 4 ? 2 : 1,
    },
    leaf: {
      interval: 1.45,
      range: 210,
      speed: 350,
      multiplier: 1.65,
      count: 1 + Math.floor(rank / 3),
      radius: 0,
      pierce: 4 + rank,
    },
  }[id];
  return {
    ...config,
    speed: config.speed * (id === "fireball" ? 1 + (rank - 1) * 0.08 : 1),
    damage: stats.damage * config.multiplier * (1 + (rank - 1) * 0.28),
    interval: (config.interval * Math.pow(0.93, rank - 1)) / stats.attackSpeed,
  };
}
export function upgradeDescription(id: UpgradeId, next: number) {
  if (id === "frost")
    return next === 1
      ? "Bắn tinh thể băng, làm chậm quái trong 1,4 giây."
      : next === 4
        ? "Băng xuyên 2 mục tiêu. Tăng sát thương và làm chậm."
        : "Tăng sát thương, số tinh thể và thời gian làm chậm.";
  if (id === "leaf")
    return next === 1
      ? "Phóng lá sắc xuyên quái rồi bay trở về bên bạn."
      : next === 3 || next === 6
        ? "Thêm một lá mỗi đợt. Tăng sát thương và xuyên quái."
        : "Lá mạnh hơn, xuyên nhiều quái hơn và hồi nhanh hơn.";
  if (id === "sword")
    return next === 3 || next === 6
      ? "Thêm một kiếm mỗi đợt. Sát thương tăng."
      : next === 4
        ? "Kiếm xuyên qua 2 mục tiêu. Sát thương tăng."
        : "Tăng sát thương và giảm hồi chiêu kiếm phép.";
  if (id === "fireball")
    return next === 1
      ? "Phóng cầu lửa phát nổ, gây sát thương diện rộng."
      : next === 3 || next === 6
        ? "Thêm một hỏa cầu. Vụ nổ rộng và mạnh hơn."
        : "Tăng sát thương, bán kính nổ, tốc độ bay và ra đòn.";
  if (id === "lightning")
    return next === 1
      ? "Gọi sét đánh trúng quái ở gần."
      : next === 4
        ? "Sét chuyền sang quái lân cận, tăng số mục tiêu."
        : "Tăng sát thương, số mục tiêu và giảm hồi chiêu.";
  return {
    damage: "+10% sát thương của tất cả vũ khí.",
    haste: "+15% tốc độ tấn công của tất cả vũ khí.",
    speed: "+10% tốc độ di chuyển.",
    magnet: "+20% phạm vi hút tinh thể kinh nghiệm.",
    critical: "+5% xác suất chí mạng.",
    health: "+20 sinh lực tối đa và hồi 20 sinh lực.",
  }[id];
}
export class RunModel {
  readonly id: string;
  hp: number;
  level = 1;
  xp = 0;
  time = 0;
  kills = 0;
  weapons: Record<WeaponId, number>;
  ranks: Record<PassiveId, number> = {
    damage: 0,
    haste: 0,
    speed: 0,
    magnet: 0,
    critical: 0,
    health: 0,
  };
  choices: UpgradeChoice[] = [];
  ended = false;
  bossSpawned = false;
  victory = false;
  constructor(
    readonly profile: Profile,
    private random = Math.random,
    id: string = crypto.randomUUID(),
  ) {
    this.id = id;
    this.weapons = initialWeapons(profile.hero);
    this.hp = this.stats.maxHp;
  }
  get stats() {
    return statsFor(this.profile, this.ranks);
  }
  get pending() {
    return this.choices.length > 0;
  }
  rank(id: UpgradeId) {
    return WEAPONS.includes(id as WeaponId)
      ? this.weapons[id as WeaponId]
      : this.ranks[id as PassiveId];
  }
  validUpgrades() {
    return [...WEAPONS, ...PASSIVES].filter(
      (id) => this.rank(id) < UPGRADE_LIMITS[id],
    );
  }
  private offer() {
    const pool = this.validUpgrades();
    const selected: UpgradeId[] = [];
    const locked = WEAPONS.filter((id) => !this.weapons[id]);
    if (locked.length)
      selected.push(
        locked[
          Math.min(locked.length - 1, Math.floor(this.random() * locked.length))
        ],
      );
    while (selected.length < 3 && pool.some((id) => !selected.includes(id))) {
      const remaining = pool.filter((id) => !selected.includes(id));
      selected.push(
        remaining[
          Math.min(
            remaining.length - 1,
            Math.floor(this.random() * remaining.length),
          )
        ],
      );
    }
    this.choices = selected.map((id) => ({
      id,
      name: UPGRADE_NAMES[id],
      description: upgradeDescription(id, this.rank(id) + 1),
      current: this.rank(id),
      next: this.rank(id) + 1,
      weapon: WEAPONS.includes(id as WeaponId),
    }));
  }
  gainXp(amount: number) {
    if (this.ended || !Number.isFinite(amount) || amount <= 0) return;
    this.xp += amount;
    this.checkLevel();
  }
  private checkLevel() {
    while (!this.pending && this.xp >= xpRequired(this.level)) {
      this.xp -= xpRequired(this.level);
      this.level++;
      this.offer();
      if (!this.pending) this.hp = Math.min(this.stats.maxHp, this.hp + 20);
    }
  }
  select(id: UpgradeId) {
    if (!this.choices.some((choice) => choice.id === id) || this.ended)
      return false;
    if (WEAPONS.includes(id as WeaponId)) this.weapons[id as WeaponId]++;
    else this.ranks[id as PassiveId]++;
    if (id === "health") this.hp = Math.min(this.stats.maxHp, this.hp + 20);
    this.choices = [];
    this.checkLevel();
    return true;
  }
  tick(dt: number, paused: boolean) {
    if (!paused && !this.pending && !this.ended) this.time += Math.max(0, dt);
  }
  hurt(damage: number) {
    if (this.ended) return;
    this.hp = Math.max(0, this.hp - damageAfterArmor(damage, this.stats.armor));
  }
  finish(victory: boolean): RunResult | null {
    if (this.ended) return null;
    this.ended = true;
    this.victory = victory;
    return {
      id: this.id,
      victory,
      time: this.time,
      kills: this.kills,
      level: this.level,
      gold: rewardFor(this.time, this.kills, victory),
    };
  }
}
