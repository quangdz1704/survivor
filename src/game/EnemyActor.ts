import Phaser from "phaser";
import { SlowEffect } from "./SlowEffect";
import { ENEMIES } from "../core/game";
import type { EnemyKind } from "../core/game";
const HUMANOID_PARTS = [
  "head",
  "torso",
  "arm-left",
  "arm-right",
  "leg-left",
  "leg-right",
];
let nextEnemyId = 1;
export class EnemyActor extends Phaser.GameObjects.Container {
  id = 0;
  hp = 0;
  maxHp = 0;
  speed = 0;
  damage = 0;
  xp = 0;
  stagger = 0;
  knockX = 0;
  knockY = 0;
  charging = 0;
  readonly chill = new SlowEffect();
  private pose: Phaser.GameObjects.Container;
  private shadow: Phaser.GameObjects.Ellipse;
  private layers: Phaser.GameObjects.Image[] = [];
  private headPart?: Phaser.GameObjects.Image;
  private armLeft?: Phaser.GameObjects.Image;
  private armRight?: Phaser.GameObjects.Image;
  private legLeft?: Phaser.GameObjects.Image;
  private legRight?: Phaser.GameObjects.Image;
  private slime?: Phaser.GameObjects.Image;
  private wingLeft?: Phaser.GameObjects.Image;
  private wingRight?: Phaser.GameObjects.Image;
  private phase = 0;
  private deathTime = 0;
  static preload(scene: Phaser.Scene) {
    for (const kind of ["skeleton", "orc", "golem"])
      for (const part of HUMANOID_PARTS)
        scene.load.image(
          `${kind}-${part}`,
          `/assets/enemies/${kind}/${part}.webp`,
        );
    for (const part of ["body", "wing-left", "wing-right"])
      scene.load.image(`bat-${part}`, `/assets/enemies/bat/${part}.webp`);
  }
  constructor(
    scene: Phaser.Scene,
    readonly kind: EnemyKind,
  ) {
    super(scene, 0, 0);
    this.shadow = scene.add.ellipse(
      0,
      19,
      kind === "golem" ? 72 : 30,
      kind === "golem" ? 22 : 10,
      0x163e2c,
      0.25,
    );
    this.pose = scene.add.container(0, 0);
    this.add([this.shadow, this.pose]);
    scene.add.existing(this);
    const part = (name: string, w: number) => {
      const image = scene.add.image(0, 0, `${kind}-${name}`);
      image.setScale(w / image.width);
      this.layers.push(image);
      return image;
    };
    if (kind === "slime") {
      this.slime = scene.add.image(0, 0, "atlas", 1).setDisplaySize(49, 49);
      this.layers.push(this.slime);
      this.pose.add(this.slime);
    } else if (kind === "bat") {
      this.wingLeft = part("wing-left", 28)
        .setOrigin(0.97, 0.65)
        .setPosition(-8, -1);
      this.wingRight = part("wing-right", 28)
        .setOrigin(0.03, 0.65)
        .setPosition(8, -1);
      const body = part("body", 29).setPosition(0, -4);
      this.pose.add([this.wingLeft, this.wingRight, body]);
    } else {
      const boss = kind === "golem",
        orc = kind === "orc";
      const headW = boss ? 61 : orc ? 37 : 31,
        torsoW = boss ? 61 : orc ? 32 : 24;
      this.legLeft = part("leg-left", boss ? 30 : orc ? 17 : 12)
        .setOrigin(0.6, 0.08)
        .setPosition(boss ? -14 : -6, boss ? 20 : 11);
      this.legRight = part("leg-right", boss ? 30 : orc ? 17 : 12)
        .setOrigin(0.4, 0.08)
        .setPosition(boss ? 14 : 6, boss ? 20 : 11);
      const torso = part("torso", torsoW)
        .setOrigin(0.5, 0.1)
        .setPosition(0, boss ? -24 : -10);
      this.armLeft = part("arm-left", boss ? 35 : orc ? 29 : 27)
        .setOrigin(0.15, 0.15)
        .setPosition(boss ? 26 : orc ? 13 : 10, boss ? -21 : -8);
      this.armRight = part("arm-right", boss ? 35 : orc ? 18 : 15)
        .setOrigin(0.8, 0.12)
        .setPosition(boss ? -26 : orc ? -13 : -10, boss ? -21 : -8);
      this.headPart = part("head", headW)
        .setOrigin(0.5, 0.96)
        .setPosition(0, boss ? -21 : -9);
      this.pose.add([
        this.armRight,
        this.legRight,
        this.legLeft,
        torso,
        this.armLeft,
        this.headPart,
      ]);
      if (boss) this.shadow.setY(54);
      else this.shadow.setY(28);
    }
    this.setActive(false).setVisible(false);
  }
  get living() {
    return this.active && this.hp > 0;
  }
  get radius() {
    return ENEMIES[this.kind].radius;
  }
  activate(x: number, y: number, hpScale = 1, speedScale = 1) {
    const base = ENEMIES[this.kind];
    this.id = nextEnemyId++;
    this.hp = this.maxHp = Math.round(base.hp * hpScale);
    this.speed = base.speed * speedScale;
    this.damage = base.damage;
    this.xp = base.xp;
    this.phase = Math.random() * Math.PI * 2;
    this.deathTime = 0;
    this.stagger = 0;
    this.chill.clear();
    this.charging = 0;
    this.knockX = this.knockY = 0;
    this.pose.setPosition(0, 0).setScale(1).setAngle(0);
    this.setPosition(x, y)
      .setScale(1)
      .setAngle(0)
      .setAlpha(1)
      .setActive(true)
      .setVisible(true);
    this.layers.forEach((p) => p.clearTint());
  }
  movementMultiplier() {
    return (
      this.chill.multiplier *
      (this.kind === "slime"
        ? 0.55 + Math.max(0, Math.sin(this.phase)) * 0.9
        : 1)
    );
  }
  hit(dx: number, dy: number) {
    this.stagger = 0.11;
    const len = Math.hypot(dx, dy) || 1;
    this.knockX = (dx / len) * (this.kind === "golem" ? 14 : 90);
    this.knockY = (dy / len) * (this.kind === "golem" ? 14 : 90);
  }
  die() {
    this.hp = 0;
    this.deathTime = 0.27;
    this.charging = 0;
  }
  animate(dt: number, distance: number, headingX: number) {
    if (!this.active) return;
    this.chill.step(dt);
    if (this.hp <= 0) {
      this.deathTime -= dt;
      this.alpha = Math.max(0, this.deathTime / 0.27);
      this.pose.angle += dt * (this.kind === "bat" ? 120 : -70);
      this.pose.y += dt * 22;
      if (this.deathTime <= 0) this.setActive(false).setVisible(false);
      return;
    }
    this.phase +=
      this.kind === "slime"
        ? dt * 6
        : this.kind === "bat"
          ? dt * 19
          : (distance / (this.kind === "golem" ? 83 : 47)) * Math.PI * 2;
    const beat = Math.sin(this.phase);
    if (Math.abs(headingX) > 0.02 && this.kind !== "slime")
      this.scaleX = headingX > 0 ? -1 : 1;
    this.pose.y =
      this.kind === "bat"
        ? -10 + Math.sin(this.phase * 0.5) * 2.3
        : this.kind === "slime"
          ? -Math.pow(Math.max(0, beat), 1.2) * 7
          : -Math.abs(beat) * (this.kind === "golem" ? 2.3 : 1.2);
    if (this.slime) {
      const squash = 1 + Math.cos(this.phase) * 0.065;
      this.slime.setScale((49 / 512) * squash, 49 / 512 / squash);
      this.shadow.setScale(1 - Math.max(0, beat) * 0.13);
    }
    if (this.wingLeft && this.wingRight) {
      this.wingLeft
        .setAngle(-beat * 27)
        .setScale(
          28 / this.wingLeft.width,
          (28 / this.wingLeft.width) * (0.65 + 0.3 * Math.cos(this.phase)),
        );
      this.wingRight
        .setAngle(beat * 27)
        .setScale(
          28 / this.wingRight.width,
          (28 / this.wingRight.width) * (0.65 + 0.3 * Math.cos(this.phase)),
        );
      this.pose.angle = Math.sin(this.phase * 0.5) * 1.5;
    }
    if (
      this.legLeft &&
      this.legRight &&
      this.armLeft &&
      this.armRight &&
      this.headPart
    ) {
      const boss = this.kind === "golem",
        hipY = boss ? 20 : 11;
      this.legLeft.setY(hipY + beat * 2).setAngle(beat * (boss ? 8 : 12));
      this.legRight.setY(hipY - beat * 2).setAngle(-beat * (boss ? 8 : 12));
      this.armLeft.angle = -beat * 10 - this.charging * 72;
      this.armRight.angle = beat * 13 + this.charging * 72;
      this.headPart.angle = -beat * 0.7;
    }
    this.stagger = Math.max(0, this.stagger - dt);
    if (this.stagger > 0) this.layers.forEach((p) => p.setTintFill(0xffefbc));
    else if (this.chill.remaining > 0)
      this.layers.forEach((p) => p.setTint(0x8edcff));
    else this.layers.forEach((p) => p.clearTint());
    this.setDepth(this.y);
  }
}
