import { describe, expect, it, vi } from "vitest";
vi.mock("phaser", () => ({
  default: {
    Math: {
      Distance: {
        Squared: (x: number, y: number, a: number, b: number) =>
          (x - a) ** 2 + (y - b) ** 2,
        Between: (x: number, y: number, a: number, b: number) =>
          Math.hypot(x - a, y - b),
      },
      Angle: {
        Between: (x: number, y: number, a: number, b: number) =>
          Math.atan2(b - y, a - x),
      },
    },
  },
}));
import { CombatSystem } from "./CombatSystem";
import { SpatialGrid } from "./SpatialGrid";
import { RunModel, newProfile, initialWeapons } from "../core/game";
import type { WeaponId } from "../core/game";
import type { EnemyActor } from "./EnemyActor";
import type { Effects } from "./Effects";
import type Phaser from "phaser";
// Only rendering primitives are stubbed; weapon dispatch, time, collision and
// projectile reuse all execute the production CombatSystem.
function image() {
  return {
    x: 0,
    y: 0,
    rotation: 0,
    alpha: 1,
    visible: false,
    setPosition(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    },
    setRotation(r: number) {
      this.rotation = r;
      return this;
    },
    setTexture() {
      return this;
    },
    setDisplaySize() {
      return this;
    },
    setDepth() {
      return this;
    },
    setVisible(v: boolean) {
      this.visible = v;
      return this;
    },
    setAlpha() {
      return this;
    },
    setTint() {
      return this;
    },
  };
}
function graphics(): unknown {
  return new Proxy(
    {},
    { get: (_target, key) => (key === "then" ? undefined : () => graphics()) },
  );
}
function setup(weapon: WeaponId) {
  const scene = {
    make: { graphics },
    add: { image, graphics },
  } as unknown as Phaser.Scene;
  const effects = { burst: vi.fn(), ring: vi.fn() } as unknown as Effects;
  const combat = new CombatSystem(scene, effects),
    run = new RunModel(newProfile(), () => 0.5, "combat");
  run.weapons = { ...initialWeapons("an"), sword: 0, [weapon]: 1 };
  const enemy = {
    x: 90,
    y: 0,
    active: true,
    living: true,
    radius: 17,
    id: 1,
  } as EnemyActor;
  const grid = new SpatialGrid<EnemyActor>(100, (e) => e.living);
  grid.rebuild([enemy]);
  const hit = vi.fn();
  const step = (seconds: number) => {
    for (let i = 0; i < Math.round(seconds * 60); i++)
      combat.update(1 / 60, 0, 6, run, grid, hit);
  };
  return { combat, step, hit, enemy, grid, run };
}
describe("pooled new weapons", () => {
  it("replaces frost shots with periodic bounded area damage and excludes dead targets", () => {
    const { step, hit, enemy, grid, run } = setup("frost");
    run.weapons.frost = 6;
    run.evolutions.blizzard = true;
    enemy.x = 0;
    const outside = { ...enemy, x: 210, id: 2 } as EnemyActor;
    const dead = { ...enemy, id: 3, living: false } as EnemyActor;
    grid.rebuild([enemy, outside, dead]);
    step(1.2);
    expect(hit).toHaveBeenCalledTimes(3);
    expect(
      hit.mock.calls.every((call) => call[0] === enemy && call[4] === "frost"),
    ).toBe(true);
    hit.mockClear();
    enemy.x = 400;
    grid.rebuild([enemy, outside, dead]);
    step(0.5);
    expect(hit).not.toHaveBeenCalled();
  });
  it("orbiting swords hit at their blade positions with a per-target damage cooldown", () => {
    const { step, hit, enemy, grid, run, combat } = setup("sword");
    run.weapons.sword = 6;
    run.evolutions["sword-array"] = true;
    enemy.x = 0;
    step(0.8);
    expect(hit).not.toHaveBeenCalled(); // A target at the orbit center is not touching a blade.
    enemy.x = 86;
    grid.rebuild([enemy]);
    step(1.5);
    expect(hit.mock.calls.length).toBeGreaterThan(0);
    expect(hit.mock.calls.length).toBeLessThanOrEqual(6);
    expect(hit.mock.calls.every((call) => call[4] === "sword")).toBe(true);
    combat.reset();
    hit.mockClear();
    run.evolutions["sword-array"] = false;
    run.weapons.sword = 0;
    step(1);
    expect(hit).not.toHaveBeenCalled();
  });
  it("evolved leaves follow curved paths and respect one hit per target per flight", () => {
    const { step, hit, enemy, grid, run } = setup("leaf");
    run.weapons.leaf = 6;
    run.evolutions["leaf-vortex"] = true;
    enemy.x = 80;
    enemy.y = 25;
    grid.rebuild([enemy]);
    step(1.9);
    expect(hit.mock.calls.length).toBeGreaterThan(0);
    expect(hit.mock.calls.length).toBeLessThanOrEqual(8);
    expect(hit.mock.calls.every((call) => call[4] === "leaf")).toBe(true);
  });
  it("reports frost as the hit source so the scene can apply slow", () => {
    const { step, hit } = setup("frost");
    step(1.3);
    expect(hit).toHaveBeenCalledTimes(1);
    expect(hit.mock.calls[0][4]).toBe("frost");
  });
  it("hits a target once across the outward and return passes, then again on the next flight", () => {
    const { step, hit } = setup("leaf");
    step(2.7);
    expect(hit).toHaveBeenCalledTimes(1);
    expect(hit.mock.calls[0][4]).toBe("leaf");
    step(1.3);
    expect(hit).toHaveBeenCalledTimes(2);
  });
  it("cancels outstanding projectiles on reset and reuses them with cleared hit IDs", () => {
    const { combat, step, hit } = setup("leaf");
    step(1.6);
    expect(hit).not.toHaveBeenCalled();
    combat.reset();
    step(1.3);
    expect(hit).not.toHaveBeenCalled();
    step(1.4);
    expect(hit).toHaveBeenCalledTimes(1);
  });
  it("does not waste attacks on a target that died after the grid rebuild", () => {
    const { combat, step, hit, enemy } = setup("frost");
    Object.defineProperty(enemy, "living", { value: false });
    step(2);
    expect(hit).not.toHaveBeenCalled();
    expect(combat.attacks).toBe(0);
  });
});
