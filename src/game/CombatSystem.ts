import Phaser from "phaser";
import { weaponConfig, WEAPONS } from "../core/game";
import type { RunModel, WeaponId } from "../core/game";
import type { EnemyActor } from "./EnemyActor";
import { SpatialGrid } from "./SpatialGrid";
import { Effects } from "./Effects";
import { audioManager } from "../audio/AudioManager";
interface Projectile {
  image: Phaser.GameObjects.Image;
  active: boolean;
  kind: WeaponId;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  pierce: number;
  radius: number;
  hits: Set<number>;
  trail: number;
}
interface Beam {
  graphics: Phaser.GameObjects.Graphics;
  life: number;
}
export class CombatSystem {
  private projectiles: Projectile[] = [];
  private beams: Beam[] = [];
  private cooldowns: Record<WeaponId, number> = {
    sword: 0,
    fireball: 0,
    lightning: 0,
  };
  private targets: EnemyActor[] = [];
  private nearby: EnemyActor[] = [];
  private blast: EnemyActor[] = [];
  attacks = 0;
  constructor(
    private scene: Phaser.Scene,
    private effects: Effects,
  ) {
    this.makeTextures();
    for (let i = 0; i < 96; i++)
      this.projectiles.push({
        image: scene.add.image(0, 0, "blade").setVisible(false),
        active: false,
        kind: "sword",
        vx: 0,
        vy: 0,
        life: 0,
        damage: 0,
        pierce: 0,
        radius: 0,
        hits: new Set(),
        trail: 0,
      });
    for (let i = 0; i < 8; i++)
      this.beams.push({
        graphics: scene.add.graphics().setDepth(4500).setVisible(false),
        life: 0,
      });
  }
  private makeTextures() {
    const g = this.scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xb8ffec, 0.16);
    g.fillEllipse(23, 25, 18, 49);
    g.lineStyle(2, 0x175c54);
    g.fillStyle(0xe7fff1);
    g.fillPoints(
      [
        { x: 23, y: 0 },
        { x: 31, y: 25 },
        { x: 23, y: 35 },
        { x: 15, y: 25 },
      ],
      true,
    );
    g.strokePoints(
      [
        { x: 23, y: 0 },
        { x: 31, y: 25 },
        { x: 23, y: 35 },
        { x: 15, y: 25 },
      ],
      true,
    );
    g.fillStyle(0xf2c168);
    g.fillRoundedRect(10, 32, 26, 5, 2);
    g.fillStyle(0x845438);
    g.fillRoundedRect(20, 37, 6, 11, 2);
    g.generateTexture("blade", 46, 50);
    g.clear();
    g.fillStyle(0xff8f43, 0.15);
    g.fillCircle(24, 24, 23);
    g.fillStyle(0xed6635, 0.85);
    g.fillCircle(24, 24, 15);
    g.fillStyle(0xffc964);
    g.fillCircle(24, 23, 10);
    g.fillStyle(0xfff6be);
    g.fillCircle(21, 20, 5);
    g.generateTexture("fireball", 48, 48);
    g.destroy();
  }
  reset() {
    this.attacks = 0;
    this.cooldowns = { sword: 0, fireball: 0, lightning: 0 };
    for (const p of this.projectiles) {
      p.active = false;
      p.image.setVisible(false);
      p.hits.clear();
    }
    for (const b of this.beams) {
      b.life = 0;
      b.graphics.setVisible(false).clear();
    }
  }
  update(
    dt: number,
    x: number,
    y: number,
    run: RunModel,
    grid: SpatialGrid<EnemyActor>,
    hit: (enemy: EnemyActor, damage: number, dx: number, dy: number) => void,
  ) {
    for (const weapon of WEAPONS) {
      const level = run.weapons[weapon];
      if (!level) continue;
      const config = weaponConfig(weapon, level, run.stats);
      this.cooldowns[weapon] = Math.min(
        config.interval,
        this.cooldowns[weapon] + dt,
      );
      if (this.cooldowns[weapon] < config.interval) continue;
      grid.query(x, y, config.range, this.targets);
      this.targets.sort(
        (a, b) =>
          Phaser.Math.Distance.Squared(x, y, a.x, a.y) -
          Phaser.Math.Distance.Squared(x, y, b.x, b.y),
      );
      if (!this.targets.length) continue;
      this.cooldowns[weapon] = 0;
      this.attacks++;
      audioManager.play(weapon);
      if (weapon === "lightning") {
        const beam = this.beams.find((b) => b.life <= 0);
        if (beam) {
          beam.life = 0.18;
          beam.graphics.clear().setVisible(true).setAlpha(1);
        }
        let fromX = x,
          fromY = y;
        const struck = new Set<number>();
        for (let i = 0; i < config.count; i++) {
          const target = this.targets.find(
            (e) =>
              e.living &&
              !struck.has(e.id) &&
              (i === 0 ||
                Phaser.Math.Distance.Between(fromX, fromY, e.x, e.y) <=
                  config.radius),
          );
          if (!target) break;
          if (beam) {
            const middleX = (fromX + target.x) / 2 + 12,
              middleY = (fromY + target.y) / 2 - 12;
            beam.graphics
              .lineStyle(7, 0x95c8ff, 0.24)
              .beginPath()
              .moveTo(fromX, fromY - 10)
              .lineTo(middleX, middleY)
              .lineTo(target.x, target.y)
              .strokePath();
            beam.graphics
              .lineStyle(2, 0xf0f4ff, 1)
              .beginPath()
              .moveTo(fromX, fromY - 10)
              .lineTo(middleX, middleY)
              .lineTo(target.x, target.y)
              .strokePath();
          }
          struck.add(target.id);
          hit(target, config.damage, target.x - fromX, target.y - fromY);
          this.effects.burst(target.x, target.y, 0xb7dbff, 7);
          fromX = target.x;
          fromY = target.y;
          if (level >= 4) grid.query(fromX, fromY, config.radius, this.targets);
        }
      } else {
        for (let shot = 0; shot < config.count; shot++) {
          const target = this.targets[shot % this.targets.length];
          const angle =
            Phaser.Math.Angle.Between(x, y, target.x, target.y) +
            (shot >= this.targets.length ? (shot % 2 ? -0.1 : 0.1) : 0);
          const p = this.projectiles.find((p) => !p.active);
          if (!p) break;
          p.active = true;
          p.kind = weapon;
          p.vx = Math.cos(angle) * config.speed;
          p.vy = Math.sin(angle) * config.speed;
          p.life = weapon === "sword" ? 1.1 : 1.5;
          p.damage = config.damage;
          p.radius = config.radius;
          p.pierce = config.pierce;
          p.hits.clear();
          p.trail = 0;
          p.image
            .setTexture(weapon === "sword" ? "blade" : "fireball")
            .setDisplaySize(
              weapon === "sword" ? 25 : 35,
              weapon === "sword" ? 42 : 35,
            )
            .setPosition(x, y - 6)
            .setRotation(angle + Math.PI / 2)
            .setVisible(true)
            .setAlpha(1);
        }
      }
    }
    for (const beam of this.beams)
      if (beam.life > 0) {
        beam.life -= dt;
        beam.graphics.alpha = Math.max(0, beam.life / 0.18);
        if (beam.life <= 0) beam.graphics.setVisible(false);
      }
    for (const p of this.projectiles) {
      if (!p.active) continue;
      p.life -= dt;
      p.image.x += p.vx * dt;
      p.image.y += p.vy * dt;
      p.image.setDepth(p.image.y + 100);
      p.trail += dt;
      if (p.trail > 0.065) {
        p.trail = 0;
        this.effects.burst(
          p.image.x,
          p.image.y,
          p.kind === "fireball" ? 0xffb755 : 0xb2ffe7,
          1,
        );
      }
      grid.query(p.image.x, p.image.y, 60, this.nearby);
      for (const enemy of this.nearby) {
        if (
          !enemy.living ||
          p.hits.has(enemy.id) ||
          Phaser.Math.Distance.Between(p.image.x, p.image.y, enemy.x, enemy.y) >
            enemy.radius + 8
        )
          continue;
        p.hits.add(enemy.id);
        if (p.kind === "fireball") {
          this.explode(p, grid, hit);
          p.life = 0;
          break;
        }
        hit(enemy, p.damage, p.vx, p.vy);
        if (--p.pierce <= 0) {
          p.life = 0;
          break;
        }
      }
      if (p.life <= 0) {
        if (p.kind === "fireball" && p.hits.size === 0)
          this.explode(p, grid, hit);
        p.active = false;
        p.image.setVisible(false);
      }
    }
  }
  private explode(
    p: Projectile,
    grid: SpatialGrid<EnemyActor>,
    hit: (enemy: EnemyActor, damage: number, dx: number, dy: number) => void,
  ) {
    const { x, y } = p.image;
    this.effects.burst(x, y, 0xffcb73, 15);
    this.effects.ring(x, y, p.radius, 0xffa459, 240);
    grid.query(x, y, p.radius + 43, this.blast);
    for (const enemy of this.blast)
      if (
        enemy.living &&
        Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <=
          p.radius + enemy.radius
      )
        hit(enemy, p.damage, enemy.x - x, enemy.y - y);
  }
}
