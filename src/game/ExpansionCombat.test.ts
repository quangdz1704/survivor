import { describe, it, expect, vi } from "vitest";
import type Phaser from "phaser";
import { HostileAttacks, segmentDistance } from "./HostileAttacks";
import { RageCombat } from "./RageCombat";
import { PetActor } from "./PetActor";
import { SlowEffect } from "./SlowEffect";
import { SpatialGrid } from "./SpatialGrid";
import type { EnemyActor } from "./EnemyActor";
import type { Effects } from "./Effects";
import { RunModel, newProfile, WEAPONS } from "../core/game";
import type { PetId } from "../core/equipment";
function setup() {
  const images: {
    visible: boolean;
    x: number;
    y: number;
    [key: string]: unknown;
  }[] = [];
  const graphic = { clear: vi.fn() };
  const g = new Proxy(graphic, {
    get: (o, k) =>
      k === "clear"
        ? () => {
            o.clear();
            return g;
          }
        : () => g,
  });
  const image = () => {
    const data = { visible: false, x: 0, y: 0 };
    const sprite = new Proxy(data, {
      get: (o, k) =>
        k in o
          ? o[k as keyof typeof o]
          : (...args: unknown[]) => {
              if (k === "setVisible") o.visible = args[0] as boolean;
              if (k === "setPosition") {
                o.x = args[0] as number;
                o.y = args[1] as number;
              }
              return sprite;
            },
    });
    images.push(sprite);
    return sprite;
  };
  const scene = {
    add: { image, graphics: () => g },
  } as unknown as Phaser.Scene;
  const effects = { burst: vi.fn(), ring: vi.fn() } as unknown as Effects;
  return { scene, effects, images, graphic };
}
const enemy = (id: number, x: number, y = 0) =>
  ({
    id,
    x,
    y,
    active: true,
    living: true,
    radius: 17,
    kind: "slime",
    chill: new SlowEffect(),
  }) as EnemyActor;
describe("hostile warnings and budgets", () => {
  it("matches the warned circle and capsule, fires once, and sweeps fast bullets", () => {
    const { scene } = setup(),
      attack = new HostileAttacks(scene),
      hurt = vi.fn();
    expect(segmentDistance(50, 10, 0, 0, 100, 0)).toBe(10);
    attack.zone(0, 0, 40, 30, false, 0.5, 100, 0);
    attack.update(0.49, 50, 39, hurt);
    expect(hurt).not.toHaveBeenCalled();
    attack.update(0.02, 50, 41, hurt);
    expect(hurt).not.toHaveBeenCalled();
    attack.reset();
    attack.zone(0, 0, 40, 30, false, 0.5, 100, 0);
    attack.update(0.51, 50, 39, hurt);
    attack.update(0.1, 50, 39, hurt);
    expect(hurt).toHaveBeenCalledExactlyOnceWith(30);
    attack.reset();
    hurt.mockClear();
    attack.fan(0, 0, 0, 1, 0, 20, false, 1000);
    attack.update(0.64, 1000, 0, hurt);
    expect(attack.count.shots).toBe(0);
    attack.update(0.02, 1000, 0, hurt);
    expect(attack.count.shots).toBe(1);
    attack.update(0.2, 100, 0, hurt);
    expect(hurt).toHaveBeenCalledExactlyOnceWith(20);
  });
  it("survives a lethal callback clearing several zones and projectiles mid-iteration", () => {
    const { scene } = setup(),
      attack = new HostileAttacks(scene),
      hurt = vi.fn(() => attack.reset());
    for (let i = 0; i < 5; i++) attack.zone(0, 0, 50, 20, false, 0.1);
    expect(() => attack.update(0.2, 0, 0, hurt)).not.toThrow();
    expect(hurt).toHaveBeenCalledTimes(1);
    expect(attack.count).toEqual({ zones: 0, shots: 0, fans: 0 });
    for (let i = 0; i < 3; i++) attack.fan(0, 0, 0, 3, 0, 20);
    expect(() => attack.update(0.7, 0, 0, hurt)).not.toThrow();
    expect(hurt).toHaveBeenCalledTimes(2);
    expect(attack.count).toEqual({ zones: 0, shots: 0, fans: 0 });
  });
  it("keeps dense combat bounded and resets every warned attack", () => {
    const { scene } = setup(),
      attack = new HostileAttacks(scene);
    for (let i = 0; i < 100; i++) {
      attack.zone(0, 0, 30, 5);
      attack.fan(0, 0, 0, 32, 6, 5);
    }
    expect(attack.count).toEqual({ zones: 24, shots: 0, fans: 16 });
    attack.update(0.7, 2000, 2000, vi.fn());
    expect(attack.count.shots).toBe(128);
    attack.reset();
    expect(attack.count).toEqual({ zones: 0, shots: 0, fans: 0 });
  });
});
describe("rage attacks", () => {
  it.each(WEAPONS)(
    "%s damages targets through production collision and releases every pooled visual",
    (weapon) => {
      const { scene, effects, images } = setup(),
        rage = new RageCombat(scene, effects),
        run = new RunModel(newProfile(), () => 0.5, "rage");
      run.weapons[weapon] = 6;
      run.rageWeapon = weapon;
      run.mana = 100;
      run.activateRage();
      const targets = Array.from({ length: 18 }, (_, i) =>
        enemy(i, Math.cos(i) * 110, Math.sin(i) * 110),
      );
      const grid = new SpatialGrid<EnemyActor>(100, (e) => e.living);
      grid.rebuild(targets);
      const hit = vi.fn();
      for (let i = 0; i < 120; i++) {
        run.tick(1 / 60, false);
        rage.update(1 / 60, 0, 0, run, grid, hit);
      }
      expect(hit.mock.calls.length).toBeGreaterThan(0);
      expect(hit.mock.calls.every((c) => c[4] === weapon && c[1] > 0)).toBe(
        true,
      );
      expect(images).toHaveLength(24);
      run.finish(true);
      rage.reset();
      rage.update(0.1, 0, 0, run, grid, hit);
      expect(images.every((i) => !i.visible)).toBe(true);
    },
  );
  it("stops safely when a meteor or lightning hit wins while several attacks are queued", () => {
    for (const weapon of ["fireball", "lightning"] as const) {
      const { scene, effects } = setup(),
        rage = new RageCombat(scene, effects),
        run = new RunModel(newProfile(), () => 0.5, "rage");
      run.weapons[weapon] = 6;
      run.rageWeapon = weapon;
      run.mana = 100;
      run.activateRage();
      const grid = new SpatialGrid<EnemyActor>(100, (e) => e.living);
      grid.rebuild([enemy(1, 90), enemy(2, 120)]);
      const hit = vi.fn(() => {
        run.finish(true);
        rage.reset();
      });
      expect(() => {
        for (let i = 0; i < 80 && !run.ended; i++) {
          run.tick(1 / 60, false);
          rage.update(1 / 60, 0, 0, run, grid, hit);
        }
      }).not.toThrow();
      expect(hit).toHaveBeenCalledTimes(1);
    }
  });
});
describe("pet support", () => {
  it.each(["fox", "owl", "sprout"] as PetId[])(
    "%s uses its unique attack or heal and rank increases support",
    (id) => {
      const { scene, effects, images } = setup(),
        pet = new PetActor(scene, effects),
        profile = newProfile();
      profile.loadout.pet = id;
      profile.loadout.pets[id] = 3;
      const run = new RunModel(profile, () => 0.5, "pet");
      run.hp = 30;
      const target = enemy(1, 90),
        grid = new SpatialGrid<EnemyActor>(100, (e) => e.living);
      grid.rebuild([target]);
      const hit = vi.fn();
      for (let i = 0; i < 60; i++) pet.update(1 / 60, 0, 0, run, grid, hit);
      expect(hit).toHaveBeenCalledTimes(1);
      if (id === "owl") expect(target.chill.remaining).toBeGreaterThan(0);
      if (id === "sprout") expect(run.hp).toBe(39);
      pet.reset();
      expect(images[0].visible).toBe(false);
    },
  );
});
