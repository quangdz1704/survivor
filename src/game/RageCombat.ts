import { RAGE } from "../core/combatBalance";
import { BlizzardVisual } from "./BlizzardVisual";
import type Phaser from "phaser";
import type { RunModel } from "../core/game";
import type { SpatialGrid } from "./SpatialGrid";
import type { EnemyActor } from "./EnemyActor";
import type { WeaponHit } from "./EvolutionCombat";
import type { Effects } from "./Effects";
import { isBoss } from "../core/campaign";
export const RAGE_NAMES = {
  sword: "Thập kiếm thiên vũ",
  fireball: "Mưa sao hỏa",
  lightning: "Lôi đình liên hoàn",
  frost: "Kỷ băng hà",
  leaf: "Vạn diệp quy tông",
};
/** Twenty-four reusable sprites and one graphics layer for all five ultimates. */
export class RageCombat {
  private images: Phaser.GameObjects.Image[];
  private graphics: Phaser.GameObjects.Graphics;
  private frostVisual: BlizzardVisual;
  private targets: EnemyActor[] = [];
  private hits = new Map<number, number>();
  private clock = 0;
  private beamLife = 0;
  private segments: { ax: number; ay: number; bx: number; by: number }[] = [];
  private meteors: { x: number; y: number; wait: number }[] = [];
  constructor(
    scene: Phaser.Scene,
    private effects: Effects,
  ) {
    this.images = Array.from({ length: 24 }, () =>
      scene.add.image(0, 0, "blade").setVisible(false),
    );
    this.graphics = scene.add.graphics().setDepth(4300);
    this.frostVisual = new BlizzardVisual(scene);
  }
  reset() {
    this.images.forEach((i) => i.setVisible(false));
    this.graphics.clear();
    this.frostVisual.reset();
    this.hits.clear();
    this.meteors.length = 0;
    this.clock = 0;
    this.beamLife = 0;
    this.segments.length = 0;
  }
  update(
    dt: number,
    x: number,
    y: number,
    run: RunModel,
    grid: SpatialGrid<EnemyActor>,
    hit: WeaponHit,
  ) {
    if (run.ended || run.rageRemaining <= 0) {
      this.reset();
      return;
    }
    this.beamLife = Math.max(0, this.beamLife - dt);
    const age = RAGE.duration - run.rageRemaining,
      kind = run.rageWeapon,
      g = this.graphics.clear();
    for (const [id, time] of this.hits) if (time <= age) this.hits.delete(id);
    const strike = (e: EnemyActor, damage: number) => {
      if (!run.ended && e.living) hit(e, damage, e.x - x, e.y - y, kind);
    };
    const power =
      run.stats.damage * 0.85 * (1 + Math.min(6, run.weapons[kind]) * 0.18);
    g.lineStyle(2, 0xffd67b, 0.25).strokeCircle(
      x,
      y,
      42 + Math.sin(age * 5) * 4,
    );
    if (kind === "frost") {
      this.frostVisual.update(dt, x, y, RAGE.frostRadius, this.effects.enabled);
      // Tall faceted ice makes the short ultimate distinct from the ground aura.
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4,
          r = RAGE.frostRadius * 0.75;
        const cx = x + Math.cos(a) * r,
          cy = y + Math.sin(a) * r;
        const height =
          18 + 12 * Math.sin((Math.min(1, age / 0.3) * Math.PI) / 2);
        g.fillStyle(0x7bd7f5, 0.55).fillTriangle(
          cx - 8,
          cy,
          cx,
          cy - height,
          cx + 9,
          cy,
        );
        g.fillStyle(0xe9fcff, 0.8).fillTriangle(
          cx,
          cy - height,
          cx + 9,
          cy,
          cx + 1,
          cy - 4,
        );
      }
    } else this.frostVisual.reset();
    if (kind === "sword" || kind === "leaf") {
      const count = kind === "sword" ? 10 : 16;
      for (let i = 0; i < count; i++) {
        if (run.ended) return;
        const a =
          age * (kind === "sword" ? 4.8 : 2.8) + (i * Math.PI * 2) / count;
        const radius =
          kind === "sword"
            ? RAGE.swordRadius + Math.sin(age * 4) * RAGE.swordSway
            : 32 + ((age * 0.65 + i / count) % 1) * RAGE.leafRadius;
        const sx = x + Math.cos(a) * radius,
          sy = y + Math.sin(a) * radius;
        this.images[i]
          .setTexture(kind === "sword" ? "blade" : "leaf")
          .setDisplaySize(
            kind === "sword" ? 31 : 36,
            kind === "sword" ? 65 : 40,
          )
          .setTint(kind === "sword" ? 0xffedb1 : 0xd4ff89)
          .setPosition(sx, sy)
          .setRotation(a + Math.PI / 2)
          .setDepth(sy + 110)
          .setVisible(true);
        grid.query(sx, sy, 85, this.targets);
        for (const e of this.targets)
          if (
            e.living &&
            !this.hits.has(e.id) &&
            Math.hypot(e.x - sx, e.y - sy) <= e.radius + 23
          ) {
            this.hits.set(e.id, age + 0.3);
            strike(e, power * 1.2);
          }
      }
    } else {
      this.clock -= dt;
      if (this.clock <= 0) {
        this.clock =
          kind === "fireball" ? 0.45 : kind === "lightning" ? 0.48 : 0.75;
        grid.query(
          x,
          y,
          kind === "frost" ? RAGE.frostRadius + 60 : 310,
          this.targets,
        );
        this.targets.sort(
          (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
        );
        if (kind === "fireball") {
          for (const e of this.targets.slice(0, 1))
            if (this.meteors.length < 16)
              this.meteors.push({ x: e.x, y: e.y, wait: 0.45 });
        } else if (kind === "lightning") {
          this.segments.length = 0;
          this.beamLife = 0.14;
          let ax = x,
            ay = y;
          for (const e of this.targets.slice(0, 6)) {
            if (run.ended) return;
            this.segments.push({ ax, ay, bx: e.x, by: e.y });
            g.lineStyle(9, 0xcab6ff, 0.25).lineBetween(ax, ay, e.x, e.y);
            g.lineStyle(2, 0xffffff, 1)
              .lineBetween(ax, ay, e.x + 9, e.y - 12)
              .lineBetween(e.x + 9, e.y - 12, e.x, e.y);
            strike(e, power * 1.8);
            if (run.ended) return;
            this.effects.burst(e.x, e.y, 0xd6c0ff, 3);
            ax = e.x;
            ay = e.y;
          }
        } else {
          this.effects.ring(x, y, RAGE.frostRadius, 0xb4efff, 500);
          for (const e of this.targets)
            if (
              !run.ended &&
              Math.hypot(e.x - x, e.y - y) <= RAGE.frostRadius + e.radius
            ) {
              strike(e, power * 1.25);
              e.chill.apply(1.4, 0.45, isBoss(e.kind) || !!e.elite);
            }
        }
      }
      if (kind === "lightning" && this.beamLife > 0)
        for (const b of this.segments) {
          g.lineStyle(8, 0xcab6ff, this.beamLife * 2).lineBetween(
            b.ax,
            b.ay,
            b.bx,
            b.by,
          );
          g.lineStyle(2, 0xf5f0ff, this.beamLife * 6)
            .lineBetween(b.ax, b.ay, b.bx + 9, b.by - 12)
            .lineBetween(b.bx + 9, b.by - 12, b.bx, b.by);
        }
      for (let i = this.meteors.length - 1; i >= 0; i--) {
        if (run.ended) return;
        const m = this.meteors[i];
        m.wait -= dt;
        g.lineStyle(2, 0xffd88c, 0.7).strokeCircle(m.x, m.y, RAGE.meteorRadius);
        g.lineStyle(13, 0xffae68, 0.6).lineBetween(
          m.x - 45 * m.wait,
          m.y - 350 * m.wait,
          m.x,
          m.y,
        );
        if (m.wait <= 0) {
          this.effects.ring(m.x, m.y, RAGE.meteorRadius, 0xffa45e, 380);
          this.effects.burst(m.x, m.y, 0xffcb79, 18);
          grid.query(m.x, m.y, RAGE.meteorRadius + 60, this.targets);
          for (const e of this.targets)
            if (
              !run.ended &&
              Math.hypot(e.x - m.x, e.y - m.y) <= RAGE.meteorRadius + e.radius
            )
              strike(e, power * 2.5);
          if (run.ended) return;
          this.meteors.splice(i, 1);
        }
      }
    }
  }
}
