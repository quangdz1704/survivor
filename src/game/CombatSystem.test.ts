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
  return { combat, step, hit, enemy, grid };
}
describe("pooled new weapons", () => {
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
