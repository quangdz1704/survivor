import { describe, expect, it, vi } from "vitest";
import type Phaser from "phaser";
import { EliteEncounters, nearSegment } from "./EliteEncounters";
import type { EnemyActor } from "./EnemyActor";
import type { Effects } from "./Effects";
import { RunModel, newProfile } from "../core/game";
import type { EliteId } from "../core/encounters";

function setup(id: EliteId) {
  const lineWidths: number[] = [];
  const graphic: unknown = new Proxy(
    {},
    {
      get: (_, key) =>
        key === "then"
          ? undefined
          : key === "lineStyle"
            ? (width: number) => {
                lineWidths.push(width);
                return graphic;
              }
            : () => graphic,
    },
  );
  const scene = { add: { graphics: () => graphic } } as unknown as Phaser.Scene;
  const effects = {
    enabled: true,
    ring: vi.fn(),
    burst: vi.fn(),
  } as unknown as Effects;
  const encounters = new EliteEncounters(scene, effects);
  const enemy = {
    x: 1000,
    y: 1000,
    hp: 500,
    maxHp: 500,
    radius: 30,
    charging: 0,
    living: true,
  } as EnemyActor;
  encounters.register(id, enemy);
  const hurt = vi.fn();
  const step = (seconds: number, x = 1000, y = 1000, fps = 60) => {
    for (let i = 0; i < Math.round(seconds * fps); i++)
      encounters.update(1 / fps, x, y, hurt);
  };
  return { encounters, enemy, effects, hurt, step, lineWidths };
}
describe("elite attack and treasure runtime", () => {
  it("paints a dash warning at the full collision capsule width", () => {
    const { step, enemy, lineWidths } = setup("orc-captain");
    step(3.5, 1200, 1000);
    expect(lineWidths).toContain(2 * (enemy.radius + 13));
  });
  it("warns before one pulse hit, respects the area edge and cancels after reset", () => {
    const { step, hurt, enemy, encounters } = setup("slime-king");
    step(3.5);
    expect(enemy.charging).toBeGreaterThan(0);
    expect(hurt).not.toHaveBeenCalled();
    step(0.5, 1090, 1000);
    expect(hurt).toHaveBeenCalledExactlyOnceWith(12);
    encounters.reset();
    step(10);
    expect(hurt).toHaveBeenCalledTimes(1);
    const outside = setup("slime-king");
    outside.step(4, 1091, 1000);
    expect(outside.hurt).not.toHaveBeenCalled();
  });
  it.each([30, 60, 120])(
    "locks dash direction and travels 210 pixels at %s FPS",
    (fps) => {
      const { step, enemy, hurt } = setup("orc-captain");
      step(3.5, 1200, 1000, fps);
      expect(enemy.x).toBe(1000);
      step(1, 1000, 1200, fps); // dodge perpendicular after the line is telegraphed
      expect(enemy.x).toBeCloseTo(1210, 5);
      expect(enemy.y).toBe(1000);
      expect(enemy.charging).toBe(0);
      expect(hurt).not.toHaveBeenCalled();
    },
  );
  it("sweeps the whole dash segment, including zero movement and exact edges", () => {
    expect(nearSegment(50, 0, 0, 0, 100, 0, 10)).toBe(true);
    expect(nearSegment(50, 10, 0, 0, 100, 0, 10)).toBe(true);
    expect(nearSegment(50, 11, 0, 0, 100, 0, 10)).toBe(false);
    expect(nearSegment(0, 5, 0, 0, 0, 0, 10)).toBe(true);
  });
  it("drops one persistent chest, defers it during level-up and consumes it once in proximity", () => {
    const { encounters, enemy } = setup("slime-king");
    const run = new RunModel(newProfile(), () => 0);
    run.elites["slime-king"] = "active";
    encounters.defeat(enemy, run);
    encounters.defeat(enemy, run);
    expect(encounters.chests()).toHaveLength(1);
    expect(encounters.snapshot()).toHaveLength(0);
    expect(encounters.collect(1100, 1000, run)).toBe(false);
    run.gainXp(20);
    expect(encounters.collect(1000, 1000, run)).toBe(false);
    expect(encounters.chests()).toHaveLength(1);
    run.select(run.choices[0].id);
    expect(encounters.collect(1000, 1000, run)).toBe(true);
    expect(encounters.collect(1000, 1000, run)).toBe(false);
    expect(run.relicChoices).toHaveLength(3);
    expect(encounters.chests()).toHaveLength(0);
    encounters.reset();
    expect(encounters.chests()).toHaveLength(0);
  });
});
