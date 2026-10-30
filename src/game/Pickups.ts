import Phaser from "phaser";
import type { RunModel } from "../core/game";
import { audioManager } from "../audio/AudioManager";
import { Effects } from "./Effects";
interface Pickup {
  image: Phaser.GameObjects.Image;
  active: boolean;
  x: number;
  y: number;
  value: number;
  kind: "xp" | "heal";
  attracted: boolean;
  phase: number;
}
export class Pickups {
  private items: Pickup[] = [];
  private soundCooldown = 0;
  constructor(
    scene: Phaser.Scene,
    private effects: Effects,
  ) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x4ce8cf, 0.15);
    g.fillCircle(14, 14, 13);
    g.fillStyle(0x1b7567);
    g.fillPoints(
      [
        { x: 14, y: 2 },
        { x: 23, y: 14 },
        { x: 14, y: 25 },
        { x: 5, y: 14 },
      ],
      true,
    );
    g.fillStyle(0x81ffe0);
    g.fillTriangle(14, 4, 14, 22, 7, 14);
    g.fillStyle(0xdbfff0);
    g.fillTriangle(14, 4, 21, 14, 14, 11);
    g.generateTexture("xp-orb", 28, 28);
    g.clear();
    g.fillStyle(0x355b33);
    g.fillCircle(14, 14, 13);
    g.fillStyle(0xf5b798);
    g.fillCircle(10, 11, 5);
    g.fillCircle(18, 11, 5);
    g.fillTriangle(5, 12, 23, 12, 14, 23);
    g.generateTexture("heal-orb", 28, 28);
    g.destroy();
    for (let i = 0; i < 240; i++)
      this.items.push({
        image: scene.add
          .image(0, 0, "xp-orb")
          .setDisplaySize(19, 19)
          .setDepth(1)
          .setVisible(false),
        active: false,
        x: 0,
        y: 0,
        value: 0,
        kind: "xp",
        attracted: false,
        phase: 0,
      });
  }
  clear() {
    for (const item of this.items) {
      item.active = false;
      item.image.setVisible(false);
    }
    this.soundCooldown = 0;
  }
  spawn(x: number, y: number, value: number, kind: "xp" | "heal" = "xp") {
    let item = this.items.find(
      (i) =>
        i.active && i.kind === kind && (i.x - x) ** 2 + (i.y - y) ** 2 < 625,
    );
    if (item) {
      item.value += value;
      return;
    }
    item = this.items.find((i) => !i.active);
    if (!item) {
      item = this.items.find((i) => i.kind === kind);
      if (item) item.value += value;
      return;
    }
    Object.assign(item, {
      x,
      y,
      value,
      kind,
      active: true,
      attracted: false,
      phase: Math.random() * 6,
    });
    item.image
      .setTexture(kind === "xp" ? "xp-orb" : "heal-orb")
      .setPosition(x, y)
      .setDisplaySize(kind === "xp" ? 18 : 23, kind === "xp" ? 18 : 23)
      .setDepth(y - 50)
      .setVisible(true);
  }
  update(dt: number, x: number, y: number, run: RunModel) {
    this.soundCooldown = Math.max(0, this.soundCooldown - dt);
    const radius = run.stats.pickupRadius;
    for (const item of this.items) {
      if (!item.active) continue;
      item.phase += dt * 3;
      const dx = x - item.x,
        dy = y - item.y,
        d = Math.hypot(dx, dy);
      if (d < radius) item.attracted = true;
      if (item.attracted && d > 0) {
        const step = Math.min(d, (200 + d * 4) * dt);
        item.x += (dx / d) * step;
        item.y += (dy / d) * step;
      }
      item.image.setPosition(item.x, item.y + Math.sin(item.phase) * 2);
      if (d < 15) {
        item.active = false;
        item.image.setVisible(false);
        if (item.kind === "xp") run.gainXp(item.value);
        else run.hp = Math.min(run.stats.maxHp, run.hp + item.value);
        this.effects.burst(x, y, 0xa3ffe0, 3);
        if (this.soundCooldown === 0) {
          audioManager.play("xp");
          this.soundCooldown = 0.08;
        }
        if (run.pending) break;
      }
    }
  }
}
