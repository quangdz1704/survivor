import type Phaser from "phaser";

const TAU = Math.PI * 2;
/** Two reusable layers; every gust and snow mote follows simulation time. */
export class BlizzardVisual {
  private ground: Phaser.GameObjects.Graphics;
  private snow: Phaser.GameObjects.Graphics;
  private age = 0;
  private active = false;
  constructor(scene: Phaser.Scene) {
    this.ground = scene.add.graphics().setVisible(false);
    this.snow = scene.add.graphics().setVisible(false);
  }
  reset() {
    if (!this.active) return;
    this.active = false;
    this.age = 0;
    this.ground.clear().setVisible(false);
    this.snow.clear().setVisible(false);
  }
  update(
    dt: number,
    x: number,
    y: number,
    radius: number,
    fullEffects: boolean,
  ) {
    this.active = true;
    this.age += dt;
    const fade = Math.min(1, this.age / 0.4);
    this.ground
      .clear()
      .setPosition(x, y)
      .setDepth(y - 4)
      .setVisible(true);
    this.snow
      .clear()
      .setPosition(x, y)
      .setDepth(y + 80)
      .setVisible(true);
    // A cool, open center lets the player and enemy silhouettes stay legible.
    this.ground.fillStyle(0xa3e8f5, 0.035 * fade).fillCircle(0, 0, radius);
    this.ground
      .fillStyle(0xbceff8, 0.025 * fade)
      .fillCircle(0, 0, radius * 0.82);
    // Broken frost at the true damage boundary replaces the hard UI-like ring.
    for (let i = 0; i < 14; i++) {
      const a = (i * TAU) / 14;
      const span = 0.07 + (i % 3) * 0.022;
      this.ground
        .lineStyle(1.5, 0xd1f7ff, (fullEffects ? 0.2 : 0.3) * fade)
        .beginPath()
        .arc(0, 0, radius, a, a + span)
        .strokePath();
      if (fullEffects && i % 2 === 0) {
        const cx = Math.cos(a) * (radius - 6),
          cy = Math.sin(a) * (radius - 6);
        this.ground
          .lineStyle(1, 0xafe7f5, 0.2 * fade)
          .lineBetween(
            cx,
            cy,
            cx + Math.cos(a + 0.5) * 9,
            cy + Math.sin(a + 0.5) * 9,
          );
      }
    }
    if (fullEffects) {
      for (let i = 0; i < 4; i++) {
        this.ribbon(i, 11, 0.055 * fade);
        this.ribbon(i, 3.2, 0.38 * fade);
      }
    }
    const count = fullEffects ? 32 : 9;
    for (let i = 0; i < count; i++) {
      const phase = (this.age * (0.25 + (i % 4) * 0.025) + i * 0.618034) % 1;
      const a = i * 2.39996 + this.age * (0.9 + (i % 3) * 0.16);
      const r = 48 + Math.sqrt(phase) * (radius - 55);
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r * 0.87 - 10 - phase * 17;
      const opacity = Math.sin(phase * Math.PI) * fade;
      const tx = -Math.sin(a),
        ty = Math.cos(a) * 0.87;
      if (fullEffects && i % 5 === 0) {
        this.crystal(sx, sy, a + this.age * 0.35, 5 + (i % 3), opacity);
      } else {
        const length = fullEffects ? 3 + (i % 3) : 2;
        this.snow
          .lineStyle(i % 3 === 0 ? 1.8 : 1.1, 0xecfcff, opacity * 0.75)
          .lineBetween(sx, sy, sx - tx * length, sy - ty * length);
      }
    }
  }
  private ribbon(index: number, width: number, alpha: number) {
    const radius = 61 + index * 27;
    const phase = this.age * (1.1 + index * 0.09) + index * 2.39996;
    const g = this.snow
      .fillStyle(index % 2 ? 0xdafaff : 0xa3e5f5, alpha)
      .beginPath();
    // A tapered, gently uneven ribbon, rather than a constant-width arc.
    for (let side = 0; side < 2; side++) {
      for (let step = 0; step <= 18; step++) {
        const t = (side === 0 ? step : 18 - step) / 18;
        const a = phase + t * 1.8;
        const thickness = Math.sin(t * Math.PI) * width;
        const r =
          radius +
          Math.sin(a * 2 + index) * 5 +
          (side === 0 ? thickness : -thickness);
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r * 0.87 - 15 + Math.sin(this.age + index) * 3;
        if (side === 0 && step === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
    }
    g.closePath().fillPath();
  }
  private crystal(
    x: number,
    y: number,
    angle: number,
    size: number,
    alpha: number,
  ) {
    const dx = Math.cos(angle) * size,
      dy = Math.sin(angle) * size;
    const wx = -Math.sin(angle) * size * 0.36,
      wy = Math.cos(angle) * size * 0.36;
    this.snow
      .fillStyle(0x80d8ed, alpha * 0.7)
      .fillTriangle(x - dx, y - dy, x + wx, y + wy, x + dx, y + dy);
    this.snow
      .fillStyle(0xe8fcff, alpha * 0.9)
      .fillTriangle(x - dx, y - dy, x - wx, y - wy, x + dx, y + dy);
  }
}
