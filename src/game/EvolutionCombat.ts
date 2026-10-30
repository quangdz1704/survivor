import type Phaser from "phaser";
import { weaponConfig } from "../core/game";
import type { RunModel, WeaponId } from "../core/game";
import type { EnemyActor } from "./EnemyActor";
import type { SpatialGrid } from "./SpatialGrid";
import type { Effects } from "./Effects";
import { audioManager } from "../audio/AudioManager";

export type WeaponHit = (
  enemy: EnemyActor,
  damage: number,
  dx: number,
  dy: number,
  weapon: WeaponId,
) => void;
export const SWORD_ARRAY_RADIUS = 86;
export const BLIZZARD_RADIUS = 158;

/** Reused continuous-attack visuals and bounded per-target hit immunity. */
export class EvolutionCombat {
  private aura: Phaser.GameObjects.Graphics;
  private swords: Phaser.GameObjects.Image[];
  private targets: EnemyActor[] = [];
  private swordHits = new Map<number, number>();
  private time = 0;
  private frostClock = 0;
  private swordSound = 0;
  constructor(
    scene: Phaser.Scene,
    private effects: Effects,
  ) {
    this.aura = scene.add.graphics().setVisible(false);
    this.swords = Array.from({ length: 4 }, () =>
      scene.add
        .image(0, 0, "blade")
        .setDisplaySize(28, 49)
        .setTint(0xffe6a0)
        .setVisible(false),
    );
  }
  reset() {
    this.time = this.frostClock = this.swordSound = 0;
    this.swordHits.clear();
    this.aura.clear().setVisible(false);
    this.swords.forEach((sword) => sword.setVisible(false));
  }
  update(
    dt: number,
    x: number,
    y: number,
    run: RunModel,
    grid: SpatialGrid<EnemyActor>,
    hit: WeaponHit,
  ) {
    this.time += dt;
    this.aura
      .clear()
      .setPosition(x, y)
      .setDepth(y - 3)
      .setVisible(true);
    for (const [id, until] of this.swordHits)
      if (until <= this.time) this.swordHits.delete(id);
    let attacks = 0;
    const stats = run.stats;
    if (run.evolutions["sword-array"] && run.weapons.sword > 0) {
      const r = SWORD_ARRAY_RADIUS,
        phase = this.time * 3.4 * stats.attackSpeed;
      const config = weaponConfig("sword", run.weapons.sword, stats);
      if (this.effects.enabled) {
        this.aura.lineStyle(1.5, 0xffdf8d, 0.2).strokeCircle(0, 0, r);
        for (let i = 0; i < 4; i++) {
          const angle = phase + (i * Math.PI) / 2;
          this.aura
            .lineStyle(5, 0xffdc8a, 0.15)
            .beginPath()
            .arc(0, 0, r, angle - 0.65, angle)
            .strokePath();
        }
      }
      grid.query(x, y, r + 65, this.targets);
      let struck = false;
      this.swords.forEach((sword, i) => {
        const angle = phase + (i * Math.PI) / 2;
        const sx = x + Math.cos(angle) * r,
          sy = y + Math.sin(angle) * r;
        sword
          .setPosition(sx, sy)
          .setRotation(angle + Math.PI / 2)
          .setDepth(sy + 100)
          .setVisible(true);
        for (const enemy of this.targets) {
          if (
            run.ended ||
            !enemy.living ||
            this.swordHits.has(enemy.id) ||
            Math.hypot(enemy.x - sx, enemy.y - sy) > enemy.radius + 20
          )
            continue;
          this.swordHits.set(enemy.id, this.time + 0.28 / stats.attackSpeed);
          hit(enemy, config.damage * 1.7, enemy.x - x, enemy.y - y, "sword");
          struck = true;
        }
      });
      if (struck && this.time >= this.swordSound) {
        audioManager.play("sword-array");
        this.swordSound = this.time + 0.22;
        attacks++;
      }
    } else this.swords.forEach((sword) => sword.setVisible(false));
    if (run.ended) return attacks;
    if (run.evolutions.blizzard && run.weapons.frost > 0) {
      const r = BLIZZARD_RADIUS;
      this.aura
        .fillStyle(0x89e3ff, this.effects.enabled ? 0.07 : 0.035)
        .fillCircle(0, 0, r);
      this.aura.lineStyle(1.5, 0xb7eeff, 0.32).strokeCircle(0, 0, r);
      if (this.effects.enabled) {
        for (let i = 0; i < 3; i++) {
          const a = this.time * 1.2 + (i * Math.PI * 2) / 3;
          this.aura
            .lineStyle(3, 0xdafaff, 0.3)
            .beginPath()
            .arc(0, 0, r - 7 - i * 8, a, a + 0.9)
            .strokePath();
        }
        for (let i = 0; i < 18; i++) {
          const a = this.time * (i % 2 ? 0.8 : -0.65) + i * 2.4;
          const radius = 24 + ((i * 37) % 120);
          const sx = Math.cos(a) * radius,
            sy = Math.sin(a) * radius;
          const size = 2.5 + (i % 3);
          this.aura
            .lineStyle(1.5, 0xe3ffff, 0.7)
            .lineBetween(sx - size, sy, sx + size, sy)
            .lineBetween(sx, sy - size, sx, sy + size);
          this.aura
            .fillStyle(0x9ceaff, 0.65)
            .fillTriangle(sx, sy - size * 2, sx + size, sy, sx - size, sy);
        }
      }
      const interval = 0.38 / stats.attackSpeed;
      this.frostClock = Math.min(interval, this.frostClock + dt);
      if (this.frostClock >= interval) {
        this.frostClock = 0;
        grid.query(x, y, r + 43, this.targets);
        let struck = false;
        const damage =
          weaponConfig("frost", run.weapons.frost, stats).damage * 1.25;
        for (const enemy of this.targets) {
          if (
            run.ended ||
            !enemy.living ||
            Math.hypot(enemy.x - x, enemy.y - y) > r + enemy.radius
          )
            continue;
          hit(enemy, damage, enemy.x - x, enemy.y - y, "frost");
          struck = true;
        }
        if (struck) {
          audioManager.play("blizzard");
          attacks++;
        }
      }
    } else this.frostClock = 0;
    if (
      run.evolutions["leaf-vortex"] &&
      run.weapons.leaf > 0 &&
      this.effects.enabled
    ) {
      for (let i = 0; i < 3; i++) {
        const a = -this.time * 2.4 + (i * Math.PI * 2) / 3;
        this.aura
          .lineStyle(2, 0xc8ed8b, 0.45)
          .beginPath()
          .arc(0, 0, 34 + i * 5, a, a + 0.8)
          .strokePath();
      }
    }
    return attacks;
  }
}
