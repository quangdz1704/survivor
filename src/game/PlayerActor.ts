import Phaser from "phaser";
import { PLAYER_SPEED } from "./rules";
import type { HeroId } from "../core/game";

const PARTS = [
  "head",
  "torso",
  "sword-arm",
  "free-arm",
  "leg-left",
  "leg-right",
  "scarf-tail",
  "scarf-collar",
] as const;

/** An uses his approved cutout rig; Linh uses intact, painted animation frames. */
export class PlayerActor extends Phaser.GameObjects.Container {
  private torsoGroup: Phaser.GameObjects.Container;
  private head: Phaser.GameObjects.Image;
  private leftLeg: Phaser.GameObjects.Image;
  private rightLeg: Phaser.GameObjects.Image;
  private swordArm: Phaser.GameObjects.Image;
  private freeArm: Phaser.GameObjects.Image;
  private scarf: Phaser.GameObjects.Image;
  private parts: Phaser.GameObjects.Image[] = [];
  private phase = 0;
  private age = 0;
  private weight = 0;
  private facing = 1;
  private lean = 0;
  private scarfAngle = 0;
  private hurt = 0;
  private hero: HeroId = "an";
  private linh: Phaser.GameObjects.Image;

  static preload(scene: Phaser.Scene) {
    for (const part of PARTS)
      scene.load.image(`player-${part}`, `/assets/player/${part}.webp`);
    scene.load.image("linh-idle", "/assets/linh.webp");
    scene.load.spritesheet("linh-walk", "/assets/player/linh-walk.webp", {
      frameWidth: 256,
      frameHeight: 256,
    });
  }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    const part = (key: (typeof PARTS)[number], width: number) => {
      const sprite = scene.add.image(0, 0, `player-${key}`);
      sprite.setScale(width / sprite.width);
      this.parts.push(sprite);
      return sprite;
    };
    this.scarf = part("scarf-tail", 29)
      .setOrigin(0.03, 0.27)
      .setPosition(4, -7);
    this.leftLeg = part("leg-left", 13)
      .setOrigin(0.65, 0.08)
      .setPosition(-5.5, 11);
    this.rightLeg = part("leg-right", 12.4)
      .setOrigin(0.28, 0.08)
      .setPosition(5.5, 11);
    const torso = part("torso", 22).setOrigin(0.5, 0.12).setPosition(0, -7);
    this.swordArm = part("sword-arm", 27)
      .setOrigin(0.92, 0.58)
      .setPosition(-9, -4);
    this.freeArm = part("free-arm", 10)
      .setOrigin(0.35, 0.08)
      .setPosition(9, -5);
    const collar = part("scarf-collar", 22).setPosition(0, -6);
    this.head = part("head", 40).setOrigin(0.51, 0.97).setPosition(0, -5);
    this.torsoGroup = scene.add.container(0, 0, [
      this.freeArm,
      torso,
      this.swordArm,
      collar,
      this.head,
    ]);
    this.linh = scene.add.image(0, 28, "linh-idle").setVisible(false);
    this.add([
      this.scarf,
      this.rightLeg,
      this.leftLeg,
      this.torsoGroup,
      this.linh,
    ]);
    this.setSize(48, 68).setScale(1.08);
    scene.add.existing(this);
  }

  useHero(hero: HeroId) {
    this.hero = hero;
    for (const child of [
      this.scarf,
      this.rightLeg,
      this.leftLeg,
      this.torsoGroup,
    ])
      child.setVisible(hero === "an");
    this.linh.setVisible(hero === "linh");
    this.resetPose();
  }

  resetPose() {
    this.phase = 0;
    this.weight = 0;
    this.lean = 0;
    this.scarfAngle = 0;
    this.hurt = 0;
    this.facing = 1;
    this.setScale(1.08).setAngle(0);
    this.parts.forEach((part) => part.clearTint());
    this.linh.clearTint();
    this.animate(0, 0, 0);
  }

  hit() {
    this.hurt = 0.13;
  }

  /** Advance the stride by actual distance, so slow input never moonwalks. */
  animate(dx: number, dy: number, dt: number) {
    this.age += dt;
    const speed = dt > 0 ? Math.hypot(dx, dy) / dt : 0;
    const targetWeight = Math.min(1, speed / PLAYER_SPEED);
    this.weight += (targetWeight - this.weight) * (1 - Math.exp(-24 * dt));
    const previousBeat = Math.floor(this.phase / Math.PI);
    this.phase +=
      (Math.hypot(dx, dy) / (this.hero === "linh" ? 88 : 64)) * Math.PI * 2;
    const footfall =
      Math.floor(this.phase / Math.PI) > previousBeat && this.weight > 0.4;
    if (Math.abs(dx) > 0.06)
      this.facing = (dx > 0 ? 1 : -1) * (this.hero === "linh" ? 1 : -1);
    this.setScale(this.facing * 1.08, 1.08);
    this.hurt = Math.max(0, this.hurt - dt);
    if (this.hero === "linh") {
      const moving = speed > 4;
      // A single painted body keeps neck, shoulders and hips connected.
      // Fixed cell dimensions preserve scale and alignment across the gait.
      this.linh
        .setTexture(
          moving ? "linh-walk" : "linh-idle",
          moving ? Math.floor((this.phase / (Math.PI * 2)) * 4) % 4 : undefined,
        )
        .setOrigin(0.55, moving ? 248 / 256 : 1)
        .setDisplaySize(
          (this.linh.width * (moving ? 81 : 76)) / this.linh.height,
          moving ? 81 : 76,
        )
        .setPosition(0, 28 + (moving ? 0 : Math.sin(this.age * 2.4) * 0.25));
      if (this.hurt > 0) this.linh.setTint(0xffd8ba);
      else this.linh.clearTint();
      return footfall;
    }
    const stride = Math.sin(this.phase) * this.weight;
    const bounce = -Math.abs(Math.sin(this.phase)) * 1.35 * this.weight;
    const breath = Math.sin(this.age * 2.4) * 0.32 * (1 - this.weight);
    const desiredLean =
      dt > 0 ? Phaser.Math.Clamp(dx / dt / PLAYER_SPEED, -1, 1) * 3.8 : 0;
    this.lean += (desiredLean - this.lean) * (1 - Math.exp(-15 * dt));
    this.torsoGroup
      .setPosition(0, bounce + breath)
      .setAngle(this.lean * this.facing + stride * 0.65);
    this.leftLeg.setPosition(-5.5, 11 + stride * 2.8).setAngle(stride * 13);
    this.rightLeg.setPosition(5.5, 11 - stride * 2.8).setAngle(-stride * 13);
    this.swordArm.setAngle(-stride * 11 - this.weight * 5);
    this.freeArm.setAngle(stride * 20 + this.weight * 5);
    this.head.setAngle(-this.torsoGroup.angle * 0.45 + stride * 0.4);
    const desiredScarf =
      -this.weight * 16 +
      Math.sin(this.phase - 0.8) * 10 * this.weight +
      Math.sin(this.age * 2) * 2;
    this.scarfAngle +=
      (desiredScarf - this.scarfAngle) * (1 - Math.exp(-8 * dt));
    this.scarf.setPosition(4, -7 + bounce * 0.6).setAngle(this.scarfAngle);
    if (this.hurt > 0) {
      this.parts.forEach((part) => part.setTint(0xffd8ba));
      this.head.angle -= this.hurt * 35;
    } else this.parts.forEach((part) => part.clearTint());
    return footfall;
  }

  fall() {
    this.torsoGroup.setAngle(-20).setY(8);
    this.head.setAngle(-12);
    this.leftLeg.setAngle(20);
    this.rightLeg.setAngle(-10);
    this.scene.tweens.add({
      targets: this,
      angle: -24,
      alpha: 0.25,
      duration: 350,
      ease: "Quad.easeOut",
    });
  }
}
