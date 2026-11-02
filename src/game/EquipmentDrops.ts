import { WORLD_SIZE } from "./rules";
import type Phaser from "phaser";
import type { RunModel } from "../core/game";
import { GEAR } from "../core/equipment";
import type { GearId } from "../core/equipment";
import type { Effects } from "./Effects";
import { audioManager } from "../audio/AudioManager";
/** Two reserved drops stay separate from the crowded XP pool. */
export class EquipmentDrops {
  private slots: {
    id: GearId | null;
    x: number;
    y: number;
    image: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
  }[];
  private age = 0;
  constructor(
    scene: Phaser.Scene,
    private effects: Effects,
  ) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xf0ce79, 0.15).fillCircle(20, 20, 20);
    g.fillStyle(0x284a55).fillRoundedRect(6, 8, 28, 26, 5);
    g.lineStyle(2, 0xe4c675).strokeRoundedRect(6, 8, 28, 26, 5);
    g.fillStyle(0xdceeff)
      .fillTriangle(20, 8, 25, 20, 20, 26)
      .fillTriangle(20, 8, 15, 20, 20, 26);
    g.fillStyle(0xffd477).fillRect(11, 25, 18, 3).fillRect(18, 27, 4, 8);
    g.generateTexture("equipment-drop", 40, 40);
    g.destroy();
    this.slots = Array.from({ length: 2 }, () => ({
      id: null,
      x: 0,
      y: 0,
      image: scene.add.image(0, 0, "equipment-drop").setVisible(false),
      label: scene.add
        .text(0, 0, "", {
          fontFamily: "Arial",
          fontSize: "10px",
          color: "#fff1ba",
          stroke: "#183831",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setVisible(false),
    }));
  }
  spawn(id: GearId, x: number, y: number) {
    x = Math.max(35, Math.min(WORLD_SIZE - 35, x));
    y = Math.max(40, Math.min(WORLD_SIZE - 35, y));
    const slot = this.slots.find((s) => s.id === null);
    if (!slot) return;
    Object.assign(slot, { id, x, y });
    slot.image
      .setPosition(x, y)
      .setDepth(y + 40)
      .setVisible(true);
    slot.label
      .setText(GEAR[id].name)
      .setPosition(x, y - 28)
      .setDepth(y + 41)
      .setVisible(true);
  }
  reset() {
    this.age = 0;
    for (const s of this.slots) {
      s.id = null;
      s.image.setVisible(false);
      s.label.setVisible(false);
    }
  }
  update(dt: number, x: number, y: number, run: RunModel) {
    if (run.ended || run.pending) return;
    this.age += dt;
    for (const s of this.slots) {
      if (!s.id) continue;
      s.image.setY(s.y + Math.sin(this.age * 3) * 3);
      if (Math.hypot(s.x - x, s.y - y) > 38) continue;
      if (run.collectedGear.length < 2) run.collectedGear.push(s.id);
      s.id = null;
      s.image.setVisible(false);
      s.label.setVisible(false);
      this.effects.ring(x, y, 42, 0xf9dc8b, 300);
      audioManager.play("treasure");
    }
  }
}
