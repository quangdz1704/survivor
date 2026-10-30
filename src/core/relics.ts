import type { WeaponId } from "./game";

export const RELIC_IDS = [
  "root",
  "rage",
  "heart",
  "rime",
  "return",
  "fang",
] as const;
export type RelicId = (typeof RELIC_IDS)[number];
export const RELICS: Record<
  RelicId,
  {
    name: string;
    description: string;
    hint: string;
    color: string;
    weapon?: WeaponId;
  }
> = {
  root: {
    name: "Rễ cổ thụ",
    description: "Đứng yên 1 giây: +35% sát thương. Di chuyển sẽ mất hiệu ứng.",
    hint: "Giữ vị trí · Kiếm trận / Bão tuyết",
    color: "#b7db91",
  },
  rage: {
    name: "Huyết thạch",
    description: "Khi còn tối đa 40% sinh lực: +30% tốc độ tấn công.",
    hint: "Mạo hiểm · Mọi vũ khí",
    color: "#f6a291",
  },
  heart: {
    name: "Tim cộng hưởng",
    description:
      "Nhặt tim tạo sóng nổ bán kính 140, gây sát thương bằng 300% sức mạnh.",
    hint: "Hồi phục · Khi chọn nhận được 3 tim quanh bạn",
    color: "#ffbbcb",
  },
  rime: {
    name: "Ấn sương giá",
    description: "+25% sát thương lên quái đang bị làm chậm bởi băng.",
    hint: "Phối hợp · Băng tinh / Bão tuyết",
    color: "#a4e4f4",
    weapon: "frost",
  },
  return: {
    name: "Hạt hồi phong",
    description: "Lá xoáy và Lốc lá gây thêm 50% sát thương trên đường bay về.",
    hint: "Phối hợp · Lá xoáy / Lốc lá",
    color: "#d5ec9b",
    weapon: "leaf",
  },
  fang: {
    name: "Nanh thủ lĩnh",
    description: "+40% sát thương lên mini-boss và Golem.",
    hint: "Săn thủ lĩnh · Mọi vũ khí",
    color: "#f5d189",
  },
};
export function relicHitMultiplier(
  relics: readonly RelicId[],
  chilled: boolean,
  leader: boolean,
) {
  return (
    (chilled && relics.includes("rime") ? 1.25 : 1) *
    (leader && relics.includes("fang") ? 1.4 : 1)
  );
}
