import type Phaser from "phaser";

export const GOLEM_BLAST_RADIUS = 104;
const DURATION = 1.15;
const TAU = Math.PI * 2;
const fade = (value: number) => Math.max(0, Math.min(1, value));
const mix = (a: number, b: number, t: number) => {
  t = fade(t);
  return [16, 8, 0].reduce(
    (color, shift) =>
      color |
      (Math.round(((a >> shift) & 255) * (1 - t) + ((b >> shift) & 255) * t) <<
        shift),
    0,
  );
};

/** One reusable blast: simulation time drives every layer, including debris. */
export class GolemBlast {
  private ground: Phaser.GameObjects.Graphics;
  private cloud: Phaser.GameObjects.Graphics;
  private age = DURATION;
  private rocks = Array.from({ length: 14 }, (_, i) => ({
    angle: (i / 14) * TAU,
    speed: 100,
    lift: 120,
    size: 4,
    spin: 0,
  }));

  constructor(scene: Phaser.Scene) {
    this.ground = scene.add.graphics().setVisible(false);
    this.cloud = scene.add.graphics().setVisible(false);
  }

  play(x: number, y: number, enabled: boolean) {
    this.age = 0;
    this.ground
      .setPosition(x, y)
      .setDepth(y - 2)
      .setVisible(true);
    this.cloud
      .setPosition(x, y)
      .setDepth(y + 80)
      .setVisible(true);
    for (const rock of this.rocks) {
      rock.speed = 85 + Math.random() * 85;
      rock.lift = 90 + Math.random() * 100;
      rock.size = 3 + Math.random() * 4;
      rock.spin = Math.random() * TAU;
    }
    this.draw(enabled);
  }

  update(dt: number, enabled: boolean) {
    if (this.age >= DURATION) return;
    this.age += dt;
    if (this.age >= DURATION) this.clear();
    else this.draw(enabled);
  }

  private draw(enabled: boolean) {
    const t = this.age,
      r = GOLEM_BLAST_RADIUS;
    const ground = this.ground.clear(),
      cloud = this.cloud.clear();
    // Reduced effects retains a short, precise impact outline with no flash.
    if (!enabled) {
      ground.lineStyle(3, 0xffd797, fade(1 - t / 0.3));
      ground.strokeCircle(0, 0, r);
      return;
    }
    const expansion = 1 - (1 - fade(t / 0.34)) ** 3;
    ground.fillStyle(0x382c27, 0.25 * fade((DURATION - t) / 0.5));
    ground.fillEllipse(0, 4, r * 1.5, r * 0.74);
    // Broad golden pressure wave and a finer trailing edge.
    ground.lineStyle(
      10 * (1 - expansion) + 2,
      0xffd490,
      0.8 * fade(1 - t / 0.48),
    );
    ground.strokeCircle(0, 0, r * (0.18 + expansion * 0.82));
    ground.lineStyle(2, 0xfff3c7, 0.85 * fade(1 - t / 0.4));
    ground.strokeCircle(0, 0, r * (0.1 + expansion * 0.8));

    // Low dust skirts stay on the ground; the hotter plume rises above them.
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU,
        distance = r * (0.36 + fade(t / 0.5) * 0.67);
      const size = 6 + Math.sin(Math.min(1, t / 0.8) * Math.PI) * 12;
      ground.fillStyle(i % 2 ? 0xc2a27c : 0xe2c391, 0.46 * fade(1 - t / 0.9));
      ground.fillEllipse(
        Math.cos(a) * distance,
        Math.sin(a) * distance * 0.7,
        size * 2,
        size,
      );
    }
    const flash = fade(1 - t / 0.16);
    if (flash > 0) {
      cloud.fillStyle(0xffd16f, flash * 0.2);
      cloud.fillCircle(0, -8, 70);
      cloud.fillStyle(0xfff3bd, flash);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU,
          reach = 48 + expansion * 42;
        cloud.fillTriangle(
          Math.cos(a - 0.15) * 12,
          Math.sin(a - 0.15) * 12 - 8,
          Math.cos(a) * reach,
          Math.sin(a) * reach - 8,
          Math.cos(a + 0.15) * 12,
          Math.sin(a + 0.15) * 12 - 8,
        );
      }
    }
    const smoke = fade((t - 0.18) / 0.42);
    const opacity = fade((DURATION - t) / 0.48);
    // Paint all outer silhouettes before the inner color so overlapping lobes
    // merge into one plume rather than separate outlined circles.
    for (let layer = 0; layer < 3; layer++)
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU - Math.PI / 2 + Math.sin(i * 2.3) * 0.2;
        const size = (20 + (i % 3) * 4) * (0.4 + expansion * 0.8 + smoke * 0.2);
        const x = Math.cos(a) * (12 + expansion * 24);
        const y = Math.sin(a) * (12 + expansion * 20) - 12 - t * 30;
        if (layer === 0) {
          cloud.fillStyle(mix(0x9c3d2d, 0x4d5049, smoke), opacity * 0.9);
          cloud.fillCircle(x, y, size + 3);
        } else if (layer === 1) {
          cloud.fillStyle(mix(0xff8739, 0x858679, smoke), opacity * 0.95);
          cloud.fillCircle(x - 1, y - 3, size);
        } else {
          cloud.fillStyle(mix(0xffd276, 0xa3a18d, smoke), opacity * 0.6);
          cloud.fillCircle(x - size * 0.2, y - size * 0.3, size * 0.55);
        }
      }
    const heat = fade(1 - t / 0.38);
    cloud.fillStyle(0xffed9b, heat);
    cloud.fillCircle(0, -12, 12 + expansion * 23);
    cloud.fillStyle(0xfffbe0, flash);
    cloud.beginPath();
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * TAU;
      const radius =
        i % 2 ? 12 : (36 + expansion * 28) * (0.8 + Math.sin(i * 2) * 0.2);
      const x = Math.cos(angle) * radius,
        y = Math.sin(angle) * radius - 12;
      if (i === 0) cloud.moveTo(x, y);
      else cloud.lineTo(x, y);
    }
    cloud.closePath().fillPath();

    for (const rock of this.rocks) {
      const travel = 22 + rock.speed * t;
      const height = Math.max(0, rock.lift * t - 170 * t * t);
      const x = Math.cos(rock.angle) * travel;
      const y = Math.sin(rock.angle) * travel * 0.6 - height;
      const alpha = fade((0.95 - t) / 0.3);
      const spin = rock.spin + t * 6;
      const dx = Math.cos(spin) * rock.size,
        dy = Math.sin(spin) * rock.size;
      cloud.fillStyle(0x403d35, alpha);
      cloud.fillTriangle(x - dx, y - dy, x + dy, y - dx, x + dx, y + dy);
      cloud.fillStyle(0xcbb991, alpha);
      cloud.fillTriangle(x - dx, y - dy, x - dy, y + dx, x + dx, y + dy);
      if (t < 0.42) {
        cloud.lineStyle(2, 0xffe5a0, fade(1 - t / 0.42));
        cloud.lineBetween(x, y, x * 0.76, y + 9);
      }
    }
  }

  clear() {
    this.age = DURATION;
    this.ground.clear().setVisible(false);
    this.cloud.clear().setVisible(false);
  }
}
