import type Phaser from "phaser";
import { isBoss } from "../core/campaign";
import { PETS } from "../core/equipment";
import type { RunModel } from "../core/game";
import type { EnemyActor } from "./EnemyActor";
import type { SpatialGrid } from "./SpatialGrid";
import type { Effects } from "./Effects";
export class PetActor {
  private image: Phaser.GameObjects.Image;
  private beam: Phaser.GameObjects.Graphics;
  private targets: EnemyActor[] = [];
  private clock = 0;
  private age = 0;
  private flash = 0;
  private beamTarget = { x: 0, y: 0 };
  private dash: {
    enemy: EnemyActor;
    x: number;
    y: number;
    remaining: number;
  } | null = null;
  constructor(
    scene: Phaser.Scene,
    private effects: Effects,
  ) {
    this.image = scene.add.image(0, 0, "pet-fox").setVisible(false);
    this.beam = scene.add.graphics().setDepth(4200);
  }
  reset() {
    this.clock = this.age = this.flash = 0;
    this.dash = null;
    this.image.setVisible(false);
    this.beam.clear();
  }
  update(
    dt: number,
    x: number,
    y: number,
    run: RunModel,
    grid: SpatialGrid<EnemyActor>,
    hit: (e: EnemyActor, damage: number, dx: number, dy: number) => void,
  ) {
    const id = run.profile.loadout.pet;
    if (!id || run.ended) {
      this.reset();
      return;
    }
    const level = run.profile.loadout.pets[id];
    if (!level) return;
    this.age += dt;
    this.clock -= dt;
    this.flash = Math.max(0, this.flash - dt);
    this.beam.clear();
    if (this.flash > 0)
      this.beam
        .lineStyle(3, 0xb9f1ff, this.flash * 5)
        .lineBetween(
          this.image.x,
          this.image.y,
          this.beamTarget.x,
          this.beamTarget.y,
        );
    const tx = x - 43,
      ty = y + 12 + Math.sin(this.age * 3) * 3;
    if (!this.image.visible) this.image.setPosition(tx, ty);
    this.image.setTexture(`pet-${id}`).setDisplaySize(47, 47).setVisible(true);
    const targetX = this.dash?.x ?? tx,
      targetY = this.dash?.y ?? ty;
    this.image.x += (targetX - this.image.x) * (1 - Math.exp(-7 * dt));
    this.image.y += (targetY - this.image.y) * (1 - Math.exp(-7 * dt));
    this.image.setDepth(this.image.y);
    this.image.setAngle(Math.sin(this.age * 5) * 2);
    if (this.dash) {
      this.dash.remaining -= dt;
      if (this.dash.remaining <= 0) {
        const target = this.dash.enemy;
        this.dash = null;
        if (
          target.living &&
          Math.hypot(target.x - this.image.x, target.y - this.image.y) < 80
        ) {
          this.effects.burst(target.x, target.y, 0xffc584, 6);
          hit(
            target,
            run.stats.damage * (1 + level * 0.25),
            target.x - x,
            target.y - y,
          );
        }
      }
      return;
    }
    if (this.clock > 0) return;
    this.clock = id === "sprout" ? 8 : Math.max(0.7, 2.2 - level * 0.1);
    if (id === "sprout") {
      run.hp = Math.min(run.stats.maxHp, run.hp + 3 + level * 2);
      this.effects.ring(x, y, 150, 0xb7eaa0, 500);
      grid.query(x, y, 210, this.targets);
      for (const e of this.targets)
        if (
          !run.ended &&
          e.living &&
          Math.hypot(e.x - x, e.y - y) <= 150 + e.radius
        )
          hit(e, run.stats.damage * (0.6 + level * 0.18), e.x - x, e.y - y);
    } else {
      grid.query(x, y, id === "owl" ? 380 : 220, this.targets);
      const target = this.targets
        .filter((e) => e.living)
        .sort(
          (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
        )[0];
      if (!target) {
        this.clock = 0.15;
        return;
      }
      if (id === "fox") {
        this.dash = {
          enemy: target,
          x: target.x,
          y: target.y,
          remaining: 0.28,
        };
        return;
      } else {
        this.flash = 0.16;
        this.beamTarget = { x: target.x, y: target.y };
        this.effects.ring(target.x, target.y, 27, 0xa6e5ff, 220);
        target.chill.apply(1.5, 0.3, isBoss(target.kind) || !!target.elite);
        this.beam
          .lineStyle(3, 0xb9f1ff, 0.9)
          .lineBetween(this.image.x, this.image.y, target.x, target.y);
      }
      hit(
        target,
        run.stats.damage * (1 + level * 0.25),
        target.x - x,
        target.y - y,
      );
    }
  }
}
export function preloadPets(scene: Phaser.Scene) {
  for (const [id, pet] of Object.entries(PETS))
    scene.load.image(`pet-${id}`, pet.image);
}
