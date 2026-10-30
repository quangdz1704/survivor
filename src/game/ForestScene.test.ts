import { describe, it, expect, vi } from "vitest";
vi.mock("phaser", () => ({
  default: {
    Scene: class {},
    Math: {
      Clamp: (v: number, a: number, b: number) => Math.max(a, Math.min(b, v)),
      Distance: {
        Between: (x: number, y: number, a: number, b: number) =>
          Math.hypot(x - a, y - b),
      },
    },
    Input: { Keyboard: { JustDown: () => false } },
  },
}));
vi.mock("./PlayerActor", () => ({ PlayerActor: class {} }));
vi.mock("./EnemyActor", async () => {
  const { ENEMIES } = await import("../core/game");
  return {
    EnemyActor: class {
      active = false;
      hp = 0;
      maxHp = 0;
      damage = 0;
      speed = 0;
      charging = 0;
      x = 0;
      y = 0;
      elite = null;
      constructor(
        _scene: unknown,
        readonly kind: keyof typeof ENEMIES,
      ) {}
      get living() {
        return this.active && this.hp > 0;
      }
      activate(x: number, y: number, hp: number, speed: number) {
        this.x = x;
        this.y = y;
        this.hp = this.maxHp = ENEMIES[this.kind].hp * hp;
        this.damage = ENEMIES[this.kind].damage;
        this.speed = ENEMIES[this.kind].speed * speed;
        this.active = true;
      }
      setActive(value: boolean) {
        this.active = value;
        return this;
      }
      setVisible() {
        return this;
      }
      destroy() {}
    },
  };
});
import { ForestScene } from "./ForestScene";
import { RunModel, newProfile, ENEMIES } from "../core/game";
import { MAPS, DIFFICULTIES } from "../core/campaign";
import type { MapId, DifficultyId } from "../core/campaign";
import type { EnemyActor } from "./EnemyActor";
interface Harness {
  run: RunModel;
  player: { x: number; y: number };
  enemies: EnemyActor[];
  boss: EnemyActor | null;
  bossDelay: number;
  bossCooldown: number;
  bossPattern: number;
  cameras: unknown;
  add: unknown;
  effects: unknown;
  encounters: unknown;
  hostile: { zone: ReturnType<typeof vi.fn>; fan: ReturnType<typeof vi.fn> };
  spawn: (
    kind: keyof typeof ENEMIES,
    side?: number,
    priority?: boolean,
  ) => EnemyActor | null;
  directWaves: (dt: number) => void;
  updateBoss: (dt: number) => void;
  publish: () => void;
}
function setup(map: MapId = "forest", difficulty: DifficultyId = "normal") {
  const scene = new ForestScene() as unknown as Harness,
    profile = newProfile();
  profile.campaign.map = map;
  profile.campaign.difficulty = difficulty;
  scene.run = new RunModel(profile, () => 0.5, "scene");
  scene.player = { x: 1200, y: 1200 };
  scene.cameras = {
    main: {
      worldView: {
        left: 1000,
        right: 1400,
        top: 800,
        bottom: 1600,
        width: 400,
        height: 800,
        contains: (x: number, y: number) =>
          x >= 1000 && x <= 1400 && y >= 800 && y <= 1600,
      },
    },
  };
  const circle = {
    setStrokeStyle() {
      return circle;
    },
    setDepth() {
      return circle;
    },
    setFillStyle() {
      return circle;
    },
    destroy() {},
  };
  scene.add = { circle: () => circle };
  scene.effects = { ring: vi.fn() };
  scene.encounters = { register: vi.fn() };
  scene.hostile = { zone: vi.fn(), fan: vi.fn() };
  scene.publish = vi.fn();
  return scene;
}
describe("campaign scene encounters", () => {
  it.each(["normal", "hard", "nightmare"] as DifficultyId[])(
    "enforces %s actor budget, reserves the boss and never spawns on the player",
    (difficulty) => {
      const scene = setup("glacier", difficulty),
        cap = DIFFICULTIES[difficulty].cap;
      for (let i = 0; i < cap + 20; i++) scene.spawn("frost-wolf");
      expect(scene.enemies.filter((e) => e.active)).toHaveLength(cap);
      expect(scene.spawn("ice-wisp")).toBeNull();
      const boss = scene.spawn("frost-warden");
      expect(boss?.living).toBe(true);
      expect(scene.enemies.filter((e) => e.active)).toHaveLength(cap);
      expect(
        scene.enemies.every((e) => Math.hypot(e.x - 1200, e.y - 1200) > 200),
      ).toBe(true);
      expect(boss!.maxHp).toBeCloseTo(
        ENEMIES["frost-warden"].hp * DIFFICULTIES[difficulty].hp * 1.3,
      );
      expect(boss!.damage).toBe(
        ENEMIES["frost-warden"].damage * DIFFICULTIES[difficulty].damage,
      );
    },
  );
  it.each(["forest", "ashlands", "glacier"] as MapId[])(
    "%s spawns its own roster and correct final boss after five minutes",
    (map) => {
      const scene = setup(map);
      scene.directWaves(1.1);
      expect(scene.enemies[0].kind).toBe(MAPS[map].enemies[0]);
      scene.run.time = 300;
      scene.run.elites = { "slime-king": "claimed", "orc-captain": "claimed" };
      scene.directWaves(0.1);
      expect(scene.run.bossSpawned).toBe(true);
      scene.directWaves(2.2);
      expect(scene.boss?.kind).toBe(MAPS[map].boss);
    },
  );
  it.each(["ashlands", "glacier"] as MapId[])(
    "%s boss rotates zones, delayed projectile fans and a warned line, then enrages",
    (map) => {
      const scene = setup(map);
      scene.boss = scene.spawn(MAPS[map].boss);
      scene.bossCooldown = 0;
      scene.updateBoss(0.1);
      expect(scene.hostile.zone).toHaveBeenCalledTimes(4);
      scene.updateBoss(3.1);
      expect(scene.hostile.fan).toHaveBeenCalledTimes(1);
      scene.updateBoss(3.1);
      const line = scene.hostile.zone.mock.calls.at(-1)!;
      expect(line.length).toBe(8);
      expect(Math.hypot(line[6] - line[0], line[7] - line[1])).toBeCloseTo(400);
      scene.boss!.hp = scene.boss!.maxHp * 0.3;
      scene.updateBoss(3.1);
      expect(scene.bossCooldown).toBe(1.65);
      expect(scene.hostile.zone).toHaveBeenCalledTimes(13); // 4 initial, 1 fan tell, 1 line, 7 enrage circles.
    },
  );
});
