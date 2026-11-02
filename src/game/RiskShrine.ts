import type Phaser from "phaser";
import { TRIAL } from "../core/trials";
import type { Trial } from "../core/trials";
import { WORLD_SIZE } from "./rules";

/** One reusable world landmark; its interaction radius matches the HUD button. */
export class RiskShrine {
  private ground: Phaser.GameObjects.Graphics;
  private rune: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private round = 0;
  x = 0;
  y = 0;
  constructor(scene: Phaser.Scene) {
    this.ground = scene.add.graphics().setDepth(1);
    this.rune = scene.add.graphics();
    this.label = scene.add
      .text(0, 0, "", {
        fontFamily: "Arial",
        fontSize: "11px",
        color: "#ffe9bf",
        stroke: "#24243a",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setVisible(false);
  }
  reset() {
    this.round = 0;
    this.ground.clear();
    this.rune.clear();
    this.label.setVisible(false);
  }
  nearby(px: number, py: number) {
    return Math.hypot(px - this.x, py - this.y) <= TRIAL.radius;
  }
  update(time: number, trial: Trial, px: number, py: number) {
    this.ground.clear();
    this.rune.clear();
    const visible = trial.phase === "available" || trial.phase === "active";
    this.label.setVisible(visible);
    if (!visible) return;
    if (this.round !== trial.round) {
      this.round = trial.round;
      const angle = trial.round === 1 ? Math.PI / 4 : -Math.PI / 3;
      this.x = Math.max(
        65,
        Math.min(WORLD_SIZE - 65, px + Math.cos(angle) * 160),
      );
      this.y = Math.max(
        90,
        Math.min(WORLD_SIZE - 65, py + Math.sin(angle) * 160),
      );
    }
    const x = this.x,
      y = this.y,
      active = trial.phase === "active",
      color = active ? 0xf19cbf : 0xf2d394;
    this.ground
      .fillStyle(0x181d32, 0.5)
      .fillEllipse(x, y + 10, 76, 29)
      .lineStyle(2, color, this.nearby(px, py) ? 0.8 : 0.35)
      .strokeEllipse(x, y + 7, 100, 46);
    const g = this.rune.setDepth(y + 40),
      lift = Math.sin(time * 2.5) * 3;
    g.fillStyle(0x394655)
      .fillRoundedRect(x - 23, y - 6, 46, 18, 4)
      .lineStyle(2, 0x9ca3aa)
      .strokeRoundedRect(x - 23, y - 6, 46, 18, 4)
      .fillStyle(0x252c45)
      .fillTriangle(x, y - 57, x - 18, y - 5, x + 18, y - 5)
      .lineStyle(2, color)
      .strokeTriangle(x, y - 57, x - 18, y - 5, x + 18, y - 5)
      .fillStyle(color, 0.13)
      .fillCircle(x, y - 35 + lift, 24)
      .fillStyle(color)
      .fillTriangle(x, y - 51 + lift, x - 7, y - 35 + lift, x, y - 26 + lift)
      .fillTriangle(x, y - 51 + lift, x + 7, y - 35 + lift, x, y - 26 + lift);
    this.label
      .setText(active ? "KHẾ ƯỚC ĐANG DIỄN RA" : "TẾ ĐÀN NGUYỀN RỦA")
      .setPosition(x, y - 80)
      .setDepth(y + 41);
  }
}
