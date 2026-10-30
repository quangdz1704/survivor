import type Phaser from "phaser";
import { ELITE_IDS, ELITES } from "../core/encounters";
import type { EliteId } from "../core/encounters";
import type { RunModel } from "../core/game";
import type { EnemyActor } from "./EnemyActor";
import type { Effects } from "./Effects";
import { WORLD_SIZE } from "./rules";
import { audioManager } from "../audio/AudioManager";

interface Slot {
  id: EliteId;
  enemy: EnemyActor | null;
  cooldown: number;
  phase: "chase" | "warning" | "dash";
  remaining: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  chest: { x: number; y: number } | null;
}
export const ELITE_PULSE_RADIUS = 90;
export const ELITE_DASH_LENGTH = 210;
/** Capsule intersection also covers a dash crossing the player between frames. */
export function nearSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  radius: number,
) {
  const dx = bx - ax,
    dy = by - ay;
  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)),
  );
  return Math.hypot(px - ax - t * dx, py - ay - t * dy) <= radius;
}
export class EliteEncounters {
  private ground: Phaser.GameObjects.Graphics;
  private markers: Phaser.GameObjects.Graphics;
  private time = 0;
  private slots: Slot[] = ELITE_IDS.map((id) => ({
    id,
    enemy: null,
    cooldown: 3,
    phase: "chase",
    remaining: 0,
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    chest: null,
  }));
  constructor(
    scene: Phaser.Scene,
    private effects: Effects,
  ) {
    this.ground = scene.add.graphics().setDepth(0);
    this.markers = scene.add.graphics().setDepth(4500);
  }
  reset() {
    this.time = 0;
    for (const slot of this.slots) {
      if (slot.enemy) slot.enemy.charging = 0;
      Object.assign(slot, {
        enemy: null,
        chest: null,
        cooldown: 3,
        phase: "chase",
        remaining: 0,
      });
    }
    this.ground.clear();
    this.markers.clear();
  }
  register(id: EliteId, enemy: EnemyActor) {
    const slot = this.slots.find((s) => s.id === id)!;
    Object.assign(slot, { enemy, cooldown: 3, phase: "chase", remaining: 0 });
  }
  defeat(enemy: EnemyActor, run: RunModel) {
    const slot = this.slots.find((s) => s.enemy === enemy);
    if (!slot || run.elites[slot.id] !== "active") return;
    run.elites[slot.id] = "defeated";
    slot.chest = { x: enemy.x, y: enemy.y };
    slot.enemy = null;
    slot.phase = "chase";
    this.effects.ring(enemy.x, enemy.y, 65, 0xffd985, 600);
    audioManager.play("treasure");
  }
  collect(x: number, y: number, run: RunModel) {
    for (const slot of this.slots) {
      if (
        slot.chest &&
        Math.hypot(slot.chest.x - x, slot.chest.y - y) <= 38 &&
        run.openTreasure(slot.id)
      ) {
        slot.chest = null;
        return true;
      }
    }
    return false;
  }
  snapshot() {
    return this.slots.flatMap(({ id, enemy }) =>
      enemy?.living ? [{ id, hp: enemy.hp, maxHp: enemy.maxHp }] : [],
    );
  }
  chests() {
    return this.slots.flatMap(({ id, chest }) =>
      chest ? [{ id, ...chest }] : [],
    );
  }
  update(dt: number, px: number, py: number, hurt: (damage: number) => void) {
    this.time += dt;
    this.ground.clear();
    this.markers.clear();
    for (const slot of this.slots) {
      const enemy = slot.enemy,
        color = ELITES[slot.id].color;
      if (slot.chest) this.drawChest(slot.chest.x, slot.chest.y);
      if (!enemy?.living) continue;
      if (slot.phase === "chase") {
        slot.cooldown -= dt;
        if (
          slot.cooldown <= 0 &&
          Math.hypot(px - enemy.x, py - enemy.y) < 290
        ) {
          slot.phase = "warning";
          slot.remaining = slot.id === "slime-king" ? 0.85 : 0.75;
          slot.x = enemy.x;
          slot.y = enemy.y;
          const length = Math.hypot(px - enemy.x, py - enemy.y) || 1;
          slot.dx = (px - enemy.x) / length;
          slot.dy = (py - enemy.y) / length;
          enemy.charging = 0.01;
        }
      } else {
        slot.remaining -= dt;
        if (slot.phase === "warning") {
          enemy.charging = 0.2 + (1 - Math.max(0, slot.remaining)) * 0.8;
          if (slot.id === "slime-king") {
            this.ground
              .fillStyle(0xe5a054, 0.22)
              .fillCircle(slot.x, slot.y, ELITE_PULSE_RADIUS)
              .lineStyle(3, 0xffe1a1, 0.9)
              .strokeCircle(slot.x, slot.y, ELITE_PULSE_RADIUS);
          } else {
            const ex = slot.x + slot.dx * ELITE_DASH_LENGTH,
              ey = slot.y + slot.dy * ELITE_DASH_LENGTH;
            const hitRadius = enemy.radius + 13;
            this.ground
              .lineStyle(hitRadius * 2, 0xe5a054, 0.22)
              .lineBetween(slot.x, slot.y, ex, ey)
              .fillStyle(0xe5a054, 0.22)
              .fillCircle(slot.x, slot.y, hitRadius)
              .fillCircle(ex, ey, hitRadius)
              .lineStyle(3, 0xffdf9b, 0.95)
              .lineBetween(slot.x, slot.y, ex, ey)
              .strokeCircle(ex, ey, hitRadius);
          }
          if (slot.remaining <= 0) {
            if (slot.id === "slime-king") {
              this.effects.ring(slot.x, slot.y, ELITE_PULSE_RADIUS, color, 350);
              this.effects.burst(slot.x, slot.y, color, 16);
              audioManager.play("fireball");
              if (Math.hypot(px - slot.x, py - slot.y) <= ELITE_PULSE_RADIUS)
                hurt(12);
              this.endAttack(slot);
            } else {
              slot.phase = "dash";
              slot.remaining = 0.5;
            }
          }
        } else {
          const oldX = enemy.x,
            oldY = enemy.y;
          const step =
            (Math.min(dt, Math.max(0, slot.remaining + dt)) *
              ELITE_DASH_LENGTH) /
            0.5;
          enemy.x = Math.max(
            20,
            Math.min(WORLD_SIZE - 20, enemy.x + slot.dx * step),
          );
          enemy.y = Math.max(
            20,
            Math.min(WORLD_SIZE - 20, enemy.y + slot.dy * step),
          );
          if (
            nearSegment(px, py, oldX, oldY, enemy.x, enemy.y, enemy.radius + 13)
          )
            hurt(18);
          this.ground
            .lineStyle(7, color, 0.35)
            .lineBetween(oldX, oldY, enemy.x, enemy.y);
          if (slot.remaining <= 0) this.endAttack(slot);
        }
      }
      const y = enemy.y - (slot.id === "slime-king" ? 45 : 69);
      this.markers
        .fillStyle(0x17382d, 0.8)
        .fillRoundedRect(enemy.x - 29, y, 58, 6, 3)
        .fillStyle(color)
        .fillRoundedRect(
          enemy.x - 28,
          y + 1,
          (56 * enemy.hp) / enemy.maxHp,
          4,
          2,
        );
      this.markers.fillStyle(0xffd57e).fillPoints(
        [
          { x: enemy.x - 10, y: y - 16 },
          { x: enemy.x - 5, y: y - 11 },
          { x: enemy.x, y: y - 20 },
          { x: enemy.x + 5, y: y - 11 },
          { x: enemy.x + 10, y: y - 16 },
          { x: enemy.x + 8, y: y - 5 },
          { x: enemy.x - 8, y: y - 5 },
        ],
        true,
      );
    }
  }
  private endAttack(slot: Slot) {
    slot.phase = "chase";
    slot.cooldown = slot.id === "slime-king" ? 4 : 4.5;
    if (slot.enemy) slot.enemy.charging = 0;
  }
  private drawChest(x: number, y: number) {
    const bob = this.effects.enabled ? Math.sin(this.time * 3) * 2 : 0;
    this.ground.lineStyle(2, 0xffdf8d, 0.45).strokeCircle(x, y, 32);
    this.markers
      .fillStyle(0xffdf8d, 0.12)
      .fillCircle(x, y - 9, 24)
      .fillStyle(0x784f37)
      .fillRoundedRect(x - 16, y - 15 + bob, 32, 25, 4)
      .lineStyle(2, 0xffd47f)
      .strokeRoundedRect(x - 16, y - 15 + bob, 32, 25, 4)
      .fillStyle(0xe4ac5f)
      .fillRoundedRect(x - 17, y - 18 + bob, 34, 12, 4)
      .fillStyle(0xffedaa)
      .fillRoundedRect(x - 3, y - 9 + bob, 6, 10, 2);
    if (this.effects.enabled)
      this.markers
        .lineStyle(2, 0xffe9a5, 0.85)
        .lineBetween(x + 23, y - 30, x + 23, y - 20)
        .lineBetween(x + 18, y - 25, x + 28, y - 25);
  }
}
