import type { EvolutionId } from "./game";
export const MASTERY_IDS = [
  "sword-power",
  "sword-area",
  "frost-power",
  "frost-area",
  "leaf-power",
  "leaf-area",
] as const;
export type MasteryId = (typeof MASTERY_IDS)[number];
export const MASTERY: Record<
  MasteryId,
  { evolution: EvolutionId; name: string; description: string; limit: number }
> = {
  "sword-power": {
    evolution: "sword-array",
    name: "Kiếm trận · Sức mạnh",
    description: "+15% sát thương kiếm trận và kiếm bắn.",
    limit: 20,
  },
  "sword-area": {
    evolution: "sword-array",
    name: "Kiếm trận · Tầm phủ",
    description: "+8% bán kính kiếm trận và tầm kiếm bắn.",
    limit: 5,
  },
  "frost-power": {
    evolution: "blizzard",
    name: "Bão tuyết · Sức mạnh",
    description: "+15% sát thương bão tuyết và băng bắn.",
    limit: 20,
  },
  "frost-area": {
    evolution: "blizzard",
    name: "Bão tuyết · Tầm phủ",
    description: "+8% bán kính bão tuyết và tầm băng bắn.",
    limit: 5,
  },
  "leaf-power": {
    evolution: "leaf-vortex",
    name: "Lốc lá · Sức mạnh",
    description: "+15% sát thương lá xoáy.",
    limit: 20,
  },
  "leaf-area": {
    evolution: "leaf-vortex",
    name: "Lốc lá · Tầm phủ",
    description: "+8% tầm bay và tốc độ lá để giữ nhịp trở về.",
    limit: 5,
  },
};
export const initialMasteries = () =>
  Object.fromEntries(MASTERY_IDS.map((id) => [id, 0])) as Record<
    MasteryId,
    number
  >;
export const isMastery = (id: string): id is MasteryId =>
  MASTERY_IDS.includes(id as MasteryId);
