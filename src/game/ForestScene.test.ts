import { describe, it, expect, vi } from "vitest";
import { CounterWindow } from "../core/counterplay";
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
      counter = new CounterWindow();
      chill = { remaining: 0 };
      hit() {}
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
  invincible: number;
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
  hitEnemy: (
    enemy: EnemyActor,
    damage: number,
    dx: number,
    dy: number,
    weapon: "sword",
  ) => void;
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
      shake: vi.fn(),
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
  scene.effects = {
    ring: vi.fn(),
    number: vi.fn(),
    burst: vi.fn(),
    golemBlast: vi.fn(),
  };
  scene.encounters = { register: vi.fn() };
  scene.hostile = { zone: vi.fn().mockReturnValue(true), fan: vi.fn() };
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
      expect(line.length).toBe(9);
      expect(Math.hypot(line[6] - line[0], line[7] - line[1])).toBeCloseTo(400);
      scene.boss!.hp = scene.boss!.maxHp * 0.3;
      scene.updateBoss(3.1);
      expect(scene.bossCooldown).toBe(1.65);
      expect(scene.hostile.zone).toHaveBeenCalledTimes(13); // 4 initial, 1 fan tell, 1 line, 7 enrage circles.
    },
  );
  it("doubles ordinary spawn attempts only during an accepted trial and keeps the actor cap", () => {
    const normal = setup(),
      trial = setup();
    normal.run.elites = { "slime-king": "claimed", "orc-captain": "claimed" };
    trial.run.elites = { "slime-king": "claimed", "orc-captain": "claimed" };
    normal.directWaves(2);
    trial.run.tick(90, false);
    trial.run.trial.inspect(true);
    trial.run.trial.decide("accept");
    // Compare the same wave composition/time with and without its optional curse.
    normal.run.time = 90;
    normal.enemies.forEach((e) => e.setActive(false));
    normal.directWaves(2);
    trial.directWaves(2);
    expect(trial.enemies.filter((e) => e.active)).toHaveLength(2);
    expect(normal.enemies.filter((e) => e.active)).toHaveLength(1);
    for (let i = 0; i < 300; i++) trial.directWaves(2);
    expect(trial.enemies.filter((e) => e.active).length).toBeLessThanOrEqual(
      DIFFICULTIES.normal.cap,
    );
  });
  it.each([false, true])(
    "Golem exposes its core only after a geometric miss (dodged=%s)",
    (dodged) => {
      const scene = setup();
      scene.boss = scene.spawn("golem");
      scene.bossCooldown = 0;
      scene.invincible = 1; // Immunity must not turn tanking the explosion into a dodge.
      scene.updateBoss(0.01);
      expect(scene.boss!.charging).toBeGreaterThan(0);
      if (dodged) scene.player.x += 250;
      scene.updateBoss(1.01);
      expect(scene.boss!.counter.multiplier).toBe(dodged ? 1.5 : 1);
      expect(scene.boss!.charging).toBe(0);
      const cooldown = scene.bossCooldown;
      scene.updateBoss(0.1);
      expect(scene.bossCooldown).toBe(cooldown);
    },
  );
  it.each(["ashlands", "glacier"] as MapId[])(
    "%s heavy lane waits for both enraged lanes and rejects either hit",
    (map) => {
      const scene = setup(map);
      scene.boss = scene.spawn(MAPS[map].boss);
      scene.boss!.hp *= 0.3;
      scene.bossPattern = 2;
      scene.bossCooldown = 0;
      scene.updateBoss(0.01);
      const [main, cross] = scene.hostile.zone.mock.calls;
      main[8](false);
      expect(scene.boss!.counter.multiplier).toBe(1);
      expect(scene.boss!.charging).toBeGreaterThan(0);
      cross[8](true);
      expect(scene.boss!.counter.multiplier).toBe(1);
      scene.boss!.counter.reset();
      scene.bossPattern = 2;
      scene.bossCooldown = 0;
      scene.hostile.zone.mockClear();
      scene.updateBoss(0.01);
      const next = scene.hostile.zone.mock.calls;
      next[0][8](false);
      next[1][8](false);
      expect(scene.boss!.counter.multiplier).toBe(1.5);
      expect(scene.boss!.charging).toBe(0);
    },
  );
  it("applies the core bonus to actual damage only while the boss is exposed", () => {
    const scene = setup();
    const boss = scene.spawn("golem")!;
    Object.assign(scene, { random: () => 0.99 });
    const before = boss.hp;
    scene.hitEnemy(boss, 10, 1, 0, "sword");
    expect(before - boss.hp).toBe(10);
    boss.counter.open(true, 1.8);
    scene.hitEnemy(boss, 10, 1, 0, "sword");
    expect(before - boss.hp).toBe(25);
    boss.counter.tick(2);
    scene.hitEnemy(boss, 10, 1, 0, "sword");
    expect(before - boss.hp).toBe(35);
  });
  it("does not strand a charging boss when either lane exceeds the hostile zone budget", () => {
    const scene = setup("ashlands");
    scene.boss = scene.spawn("ember-drake");
    scene.boss!.hp *= 0.3;
    scene.bossPattern = 2;
    scene.bossCooldown = 0;
    scene.hostile.zone.mockReturnValue(false);
    scene.updateBoss(0.01);
    expect(scene.boss!.charging).toBe(0);
    scene.hostile.zone
      .mockReset()
      .mockReturnValueOnce(true)
      .mockReturnValue(false);
    scene.bossPattern = 2;
    scene.bossCooldown = 0;
    scene.updateBoss(0.01);
    expect(scene.boss!.charging).toBeGreaterThan(0);
    scene.hostile.zone.mock.calls[0][8](false);
    expect(scene.boss!.charging).toBe(0);
    expect(scene.boss!.counter.multiplier).toBe(1.5);
  });
});
