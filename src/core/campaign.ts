import type { EnemyKind, Profile } from "./game";
export const MAP_IDS = ["forest", "ashlands", "glacier"] as const;
export type MapId = (typeof MAP_IDS)[number];
export const DIFFICULTY_IDS = ["normal", "hard", "nightmare"] as const;
export type DifficultyId = (typeof DIFFICULTY_IDS)[number];
export const MAPS: Record<
  MapId,
  {
    name: string;
    subtitle: string;
    color: string;
    ground: string;
    boss: EnemyKind;
    enemies: EnemyKind[];
  }
> = {
  forest: {
    name: "Rừng thì thầm",
    subtitle: "Lối về của người giữ rừng",
    color: "#b7d594",
    ground: "/assets/forest-atlas.webp",
    boss: "golem",
    enemies: ["slime", "bat", "skeleton", "orc"],
  },
  ashlands: {
    name: "Vực tro tàn",
    subtitle: "Lửa thức giấc dưới chân bạn",
    color: "#ffb280",
    ground: "/assets/expansion/ashlands.webp",
    boss: "ember-drake",
    enemies: ["ash-imp", "bat", "ember-beetle", "orc"],
  },
  glacier: {
    name: "Thành băng vĩnh cửu",
    subtitle: "Lời thách đấu giữa bão tuyết",
    color: "#b0e9f7",
    ground: "/assets/expansion/glacier.webp",
    boss: "frost-warden",
    enemies: ["ice-wisp", "frost-wolf", "skeleton", "ember-beetle"],
  },
};
export const DIFFICULTIES = {
  normal: {
    name: "Thường",
    hp: 1,
    damage: 1,
    speed: 1,
    interval: 1,
    group: 1,
    cap: 150,
    reward: 1,
  },
  hard: {
    name: "Khắc nghiệt",
    hp: 1.6,
    damage: 1.4,
    speed: 1.12,
    interval: 0.7,
    group: 2,
    cap: 280,
    reward: 1.7,
  },
  nightmare: {
    name: "Ác mộng",
    hp: 2.7,
    damage: 2,
    speed: 1.22,
    interval: 0.45,
    group: 4,
    cap: 480,
    reward: 2.8,
  },
} as const;
export interface Campaign {
  map: MapId;
  difficulty: DifficultyId;
  completed: string[];
}
export const initialCampaign = (): Campaign => ({
  map: "forest",
  difficulty: "normal",
  completed: [],
});
export function mapUnlocked(profile: Profile, id: MapId) {
  const index = MAP_IDS.indexOf(id);
  return (
    index === 0 ||
    profile.campaign.completed.includes(`${MAP_IDS[index - 1]}:normal`)
  );
}
export function difficultyUnlocked(
  profile: Profile,
  map: MapId,
  difficulty: DifficultyId,
) {
  return (
    mapUnlocked(profile, map) &&
    (difficulty === "normal" ||
      profile.campaign.completed.includes(
        `${map}:${difficulty === "hard" ? "normal" : "hard"}`,
      ))
  );
}
export function selectCampaign(
  profile: Profile,
  map: MapId,
  difficulty: DifficultyId,
): Profile {
  if (!difficultyUnlocked(profile, map, difficulty)) return profile;
  return { ...profile, campaign: { ...profile.campaign, map, difficulty } };
}
export const isBoss = (kind: EnemyKind) =>
  kind === "golem" || kind === "ember-drake" || kind === "frost-warden";
