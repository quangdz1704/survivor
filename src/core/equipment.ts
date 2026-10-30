import type { Profile } from "./game";
export const GEAR_SLOTS = [
  "weapon",
  "hood",
  "coat",
  "boots",
  "ring",
  "charm",
] as const;
export type GearSlot = (typeof GEAR_SLOTS)[number];
export const SLOT_NAMES: Record<GearSlot, string> = {
  weapon: "Vũ khí",
  hood: "Mũ",
  coat: "Áo giáp",
  boots: "Giày",
  ring: "Nhẫn",
  charm: "Bùa",
};
export const GEAR_IDS = [
  "dawnblade",
  "cinderwand",
  "barkhood",
  "frostcrown",
  "rangercoat",
  "obsidianmail",
  "windboots",
  "glacierboots",
  "sunring",
  "stormring",
  "seedcharm",
  "mooncharm",
] as const;
export type GearId = (typeof GEAR_IDS)[number];
export interface GearBonus {
  hp?: number;
  damage?: number;
  speed?: number;
  haste?: number;
  crit?: number;
  armor?: number;
  pickup?: number;
}
export const GEAR: Record<
  GearId,
  {
    name: string;
    slot: GearSlot;
    tier: "rare" | "epic";
    description: string;
    bonus: GearBonus;
  }
> = {
  dawnblade: {
    name: "Kiếm ban mai",
    slot: "weapon",
    tier: "rare",
    description: "Lưỡi kiếm giữ ánh bình minh.",
    bonus: { damage: 1.5 },
  },
  cinderwand: {
    name: "Trượng hỏa tâm",
    slot: "weapon",
    tier: "epic",
    description: "Than hồng đập như nhịp tim.",
    bonus: { damage: 2, crit: 0.01 },
  },
  barkhood: {
    name: "Mũ vỏ cây",
    slot: "hood",
    tier: "rare",
    description: "Bền bỉ trước những đòn bất ngờ.",
    bonus: { hp: 8 },
  },
  frostcrown: {
    name: "Miện băng lam",
    slot: "hood",
    tier: "epic",
    description: "Băng cổ đại che chở người mang.",
    bonus: { hp: 10, armor: 0.3 },
  },
  rangercoat: {
    name: "Áo người giữ rừng",
    slot: "coat",
    tier: "rare",
    description: "Áo nhẹ dệt từ sợi rừng.",
    bonus: { armor: 0.8, hp: 5 },
  },
  obsidianmail: {
    name: "Giáp hắc diệu",
    slot: "coat",
    tier: "epic",
    description: "Giáp đá núi lửa tôi trong tro.",
    bonus: { armor: 1.2, hp: 8 },
  },
  windboots: {
    name: "Ủng gió",
    slot: "boots",
    tier: "rare",
    description: "Mỗi bước nhẹ như lá.",
    bonus: { speed: 0.035 },
  },
  glacierboots: {
    name: "Hài băng hành",
    slot: "boots",
    tier: "epic",
    description: "Lướt qua khe băng nguy hiểm.",
    bonus: { speed: 0.04, armor: 0.2 },
  },
  sunring: {
    name: "Nhẫn nắng sớm",
    slot: "ring",
    tier: "rare",
    description: "Giữ nhịp chiến đấu luôn bền.",
    bonus: { haste: 0.035 },
  },
  stormring: {
    name: "Nhẫn giông tố",
    slot: "ring",
    tier: "epic",
    description: "Sức mạnh trong mắt cơn bão.",
    bonus: { haste: 0.045, crit: 0.01 },
  },
  seedcharm: {
    name: "Bùa hạt giống",
    slot: "charm",
    tier: "rare",
    description: "Tinh thể kinh nghiệm tìm đến bạn.",
    bonus: { pickup: 0.07 },
  },
  mooncharm: {
    name: "Bùa trăng bạc",
    slot: "charm",
    tier: "epic",
    description: "Ánh trăng dẫn lối và điểm yếu.",
    bonus: { pickup: 0.08, crit: 0.015 },
  },
};
export const PET_IDS = ["fox", "owl", "sprout"] as const;
export type PetId = (typeof PET_IDS)[number];
export const PETS = {
  fox: {
    name: "Cáo lửa",
    description: "Lao cắn mục tiêu gần. +2% chí mạng mỗi cấp.",
    image: "/assets/expansion/fox.webp",
  },
  owl: {
    name: "Cú sương",
    description: "Bắn tia băng vào quái. +8% hút XP mỗi cấp.",
    image: "/assets/expansion/owl.webp",
  },
  sprout: {
    name: "Mầm xanh",
    description: "Xung kích quanh bạn và hồi máu mỗi 8 giây. +5 HP mỗi cấp.",
    image: "/assets/expansion/sprout.webp",
  },
} as const;
export interface Loadout {
  inventory: Record<GearId, number>;
  equipped: Partial<Record<GearSlot, GearId>>;
  pets: Record<PetId, number>;
  pet: PetId | null;
  essence: number;
}
export const initialLoadout = (): Loadout => ({
  inventory: Object.fromEntries(
    GEAR_IDS.map((id) => [id, GEAR[id].tier === "rare" ? 1 : 0]),
  ) as Record<GearId, number>,
  equipped: {},
  pets: { fox: 1, owl: 0, sprout: 0 },
  pet: null,
  essence: 0,
});
export const MAX_GEAR_LEVEL = 20,
  MAX_PET_LEVEL = 10;
export function gearCost(level: number) {
  return {
    gold: level === 0 ? 300 : 50 + level * 40,
    essence: level === 0 ? 15 : 2 + Math.floor(level / 2),
  };
}
export function petCost(level: number) {
  return {
    gold: level === 0 ? 240 : 90 + level * 70,
    essence: level === 0 ? 12 : 4 + level,
  };
}
export function equipGear(profile: Profile, id: GearId): Profile {
  if (!GEAR_IDS.includes(id) || profile.loadout.inventory[id] < 1)
    return profile;
  return {
    ...profile,
    loadout: {
      ...profile.loadout,
      equipped: { ...profile.loadout.equipped, [GEAR[id].slot]: id },
    },
  };
}
export function improveGear(profile: Profile, id: GearId): Profile {
  if (!GEAR_IDS.includes(id)) return profile;
  const level = profile.loadout.inventory[id],
    cost = gearCost(level);
  if (
    level >= MAX_GEAR_LEVEL ||
    profile.gold < cost.gold ||
    profile.loadout.essence < cost.essence
  )
    return profile;
  return {
    ...profile,
    gold: profile.gold - cost.gold,
    loadout: {
      ...profile.loadout,
      essence: profile.loadout.essence - cost.essence,
      inventory: { ...profile.loadout.inventory, [id]: level + 1 },
    },
  };
}
export function equipPet(profile: Profile, id: PetId | null): Profile {
  if (id !== null && (!PET_IDS.includes(id) || profile.loadout.pets[id] < 1))
    return profile;
  return { ...profile, loadout: { ...profile.loadout, pet: id } };
}
export function improvePet(profile: Profile, id: PetId): Profile {
  if (!PET_IDS.includes(id)) return profile;
  const level = profile.loadout.pets[id],
    cost = petCost(level);
  if (
    level >= MAX_PET_LEVEL ||
    profile.gold < cost.gold ||
    profile.loadout.essence < cost.essence
  )
    return profile;
  return {
    ...profile,
    gold: profile.gold - cost.gold,
    loadout: {
      ...profile.loadout,
      essence: profile.loadout.essence - cost.essence,
      pets: { ...profile.loadout.pets, [id]: level + 1 },
    },
  };
}
export function gearBonuses(loadout: Loadout): Required<GearBonus> {
  const total = {
    hp: 0,
    damage: 0,
    speed: 0,
    haste: 0,
    crit: 0,
    armor: 0,
    pickup: 0,
  };
  for (const slot of GEAR_SLOTS) {
    const id = loadout.equipped[slot];
    if (!id || GEAR[id].slot !== slot || !loadout.inventory[id]) continue;
    const factor = 1 + (loadout.inventory[id] - 1) * 0.22;
    for (const [stat, amount] of Object.entries(GEAR[id].bonus))
      total[stat as keyof GearBonus] += amount * factor;
  }
  return total;
}
