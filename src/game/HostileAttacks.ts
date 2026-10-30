import type Phaser from "phaser";
export function segmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax,
    dy = by - ay,
    denominator = dx * dx + dy * dy;
  const t = denominator
    ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / denominator))
    : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
interface Zone {
  x: number;
  y: number;
  bx: number;
  by: number;
  radius: number;
  wait: number;
  life: number;
  damage: number;
  ice: boolean;
  fired: boolean;
}
interface Fan {
  x: number;
  y: number;
  angle: number;
  count: number;
  spread: number;
  damage: number;
  ice: boolean;
  speed: number;
  wait: number;
}
interface Shot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  ice: boolean;
}
/** Fixed hostile budgets. The same geometry draws warnings and resolves hits. */
export class HostileAttacks {
  private zones: Zone[] = [];
  private shots: Shot[] = [];
  private fans: Fan[] = [];
  private generation = 0;
  private graphics: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(4400);
  }
  reset() {
    this.generation++;
    this.fans.length = 0;
    this.zones.length = 0;
    this.shots.length = 0;
    this.graphics.clear();
  }
  zone(
    x: number,
    y: number,
    radius: number,
    damage: number,
    ice = false,
    wait = 0.85,
    bx = x,
    by = y,
  ) {
    if (this.zones.length >= 24) return;
    this.zones.push({
      x,
      y,
      bx,
      by,
      radius,
      damage,
      ice,
      wait,
      life: 0.28,
      fired: false,
    });
  }
  fan(
    x: number,
    y: number,
    angle: number,
    count: number,
    spread: number,
    damage: number,
    ice = false,
    speed = 170,
  ) {
    if (this.fans.length < 16)
      this.fans.push({
        x,
        y,
        angle,
        count: Math.min(32, count),
        spread,
        damage,
        ice,
        speed,
        wait: 0.65,
      });
  }

  update(dt: number, px: number, py: number, hurt: (damage: number) => void) {
    const g = this.graphics.clear(),
      generation = this.generation;
    for (let i = this.fans.length - 1; i >= 0; i--) {
      const f = this.fans[i];
      f.wait -= dt;
      for (let j = 0; j < f.count; j++) {
        const a =
          f.angle + (f.count === 1 ? 0 : (j / (f.count - 1) - 0.5) * f.spread);
        if (f.wait > 0)
          g.lineStyle(1, f.ice ? 0x9aeaff : 0xffb780, 0.55).lineBetween(
            f.x,
            f.y,
            f.x + Math.cos(a) * 135,
            f.y + Math.sin(a) * 135,
          );
        else if (this.shots.length < 128)
          this.shots.push({
            x: f.x,
            y: f.y,
            vx: Math.cos(a) * f.speed,
            vy: Math.sin(a) * f.speed,
            damage: f.damage,
            ice: f.ice,
            life: 5,
          });
      }
      if (f.wait <= 0) this.fans.splice(i, 1);
    }
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i],
        color = z.ice ? 0x7ee5ff : 0xff8c61;
      z.wait -= dt;
      if (z.wait > 0) {
        g.lineStyle(z.radius * 2, color, 0.12).lineBetween(
          z.x,
          z.y,
          z.bx,
          z.by,
        );
        g.fillStyle(color, 0.13)
          .fillCircle(z.x, z.y, z.radius)
          .fillCircle(z.bx, z.by, z.radius);
        g.lineStyle(2, color, 0.9)
          .strokeCircle(z.x, z.y, z.radius)
          .strokeCircle(z.bx, z.by, z.radius);
        if (z.x !== z.bx || z.y !== z.by)
          g.lineStyle(2, color, 0.8).lineBetween(z.x, z.y, z.bx, z.by);
        g.lineStyle(3, 0xffefc1, 0.8)
          .beginPath()
          .arc(
            z.x,
            z.y,
            z.radius,
            -Math.PI / 2,
            -Math.PI / 2 + Math.PI * 2 * (1 - Math.min(1, z.wait)),
          )
          .strokePath();
      } else {
        if (!z.fired) {
          z.fired = true;
          if (segmentDistance(px, py, z.x, z.y, z.bx, z.by) <= z.radius)
            hurt(z.damage);
          if (this.generation !== generation) return;
        }
        z.life -= dt;
        g.lineStyle(z.radius * 2, color, Math.max(0, z.life) * 1.8).lineBetween(
          z.x,
          z.y,
          z.bx,
          z.by,
        );
        g.fillStyle(0xfff1cf, Math.max(0, z.life) * 2).fillCircle(
          z.x,
          z.y,
          z.radius * (1 - z.life),
        );
        g.lineStyle(5, color, Math.max(0, z.life) * 3).strokeCircle(
          z.x,
          z.y,
          z.radius * (1.3 - z.life),
        );
        if (z.life <= 0) this.zones.splice(i, 1);
      }
    }
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i],
        oldX = s.x,
        oldY = s.y;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (segmentDistance(px, py, oldX, oldY, s.x, s.y) <= 19) {
        hurt(s.damage);
        if (this.generation !== generation) return;
        s.life = 0;
      }
      if (s.life <= 0) {
        this.shots.splice(i, 1);
        continue;
      }
      g.lineStyle(9, s.ice ? 0x67dbff : 0xff9c4f, 0.25).lineBetween(
        oldX - s.vx * 0.04,
        oldY - s.vy * 0.04,
        s.x,
        s.y,
      );
      g.fillStyle(s.ice ? 0xbff8ff : 0xffdb94).fillCircle(s.x, s.y, 6);
    }
  }
  get count() {
    return {
      zones: this.zones.length,
      shots: this.shots.length,
      fans: this.fans.length,
    };
  }
}
