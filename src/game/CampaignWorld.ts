import type Phaser from "phaser";
import { drawForestMap } from "./ForestMap";
import { seededRandom } from "./rules";
import type { MapId } from "../core/campaign";
/** Each terrain is built once; switching runs reuses the same display objects. */
export class CampaignWorld {
  private maps = new Map<MapId, Phaser.GameObjects.GameObject[]>();
  readonly trees: Phaser.GameObjects.Image[];
  constructor(private scene: Phaser.Scene) {
    const before = new Set(scene.children.list);
    this.trees = drawForestMap(scene);
    this.maps.set(
      "forest",
      scene.children.list.filter((o) => !before.has(o)),
    );
  }
  show(id: MapId) {
    if (!this.maps.has(id)) this.build(id);
    for (const [key, objects] of this.maps)
      for (const object of objects)
        (object as Phaser.GameObjects.Image).setVisible(key === id);
  }
  private build(id: MapId) {
    const before = new Set(this.scene.children.list),
      ice = id === "glacier",
      r = seededRandom(ice ? 177 : 391);
    this.scene.add
      .tileSprite(1200, 1200, 2400, 2400, `ground-${id}`)
      .setDepth(-10);
    // Sparse landmarks leave room to read dense combat and telegraphs.
    for (let i = 0; i < 110; i++) {
      const x = r() * 2400,
        y = r() * 2400;
      if (Math.hypot(x - 1200, y - 1200) < 180) continue;
      const g = this.scene.add.graphics().setPosition(x, y).setDepth(y),
        size = 18 + r() * 27;
      g.fillStyle(0x152e3a, 0.2).fillEllipse(2, 8, size * 1.7, size * 0.55);
      g.fillStyle(ice ? 0x69bad6 : 0x493948).fillTriangle(
        -size * 0.6,
        4,
        0,
        -size,
        size * 0.65,
        4,
      );
      g.fillStyle(ice ? 0xc7f1f5 : 0x8e5660).fillTriangle(
        0,
        -size,
        size * 0.65,
        4,
        size * 0.13,
        -2,
      );
      g.lineStyle(2, ice ? 0xe6fdff : 0xffaf6c, 0.7).lineBetween(
        -size * 0.4,
        0,
        0,
        -size * 0.8,
      );
      if (!ice) g.lineStyle(2, 0xff9a4e, 0.7).lineBetween(-size, 14, size, 21);
    }
    const seal = this.scene.add.graphics().setDepth(-1);
    seal
      .lineStyle(3, ice ? 0xc3f6ff : 0xffb46c, 0.25)
      .strokeCircle(1200, 1200, 115);
    seal
      .lineStyle(1, ice ? 0xc3f6ff : 0xffb46c, 0.2)
      .strokeCircle(1200, 1200, 128);
    this.maps.set(
      id,
      this.scene.children.list.filter((o) => !before.has(o)),
    );
  }
}
