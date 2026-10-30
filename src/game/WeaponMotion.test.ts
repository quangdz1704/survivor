import { describe, expect, it } from "vitest";
import { SlowEffect } from "./SlowEffect";
import { ReturningFlight } from "./ReturningFlight";
describe("frost slow", () => {
  it("refreshes instead of stacking, expires, and can reset for a pooled enemy", () => {
    const slow = new SlowEffect();
    slow.apply(1.4, 0.35);
    slow.step(0.8);
    slow.apply(1.4, 0.35);
    expect(slow.multiplier).toBeCloseTo(0.65);
    expect(slow.remaining).toBe(1.4);
    slow.step(0);
    expect(slow.remaining).toBe(1.4);
    slow.step(1.4);
    expect(slow.multiplier).toBe(1);
    slow.apply(2, 0.4);
    slow.clear();
    expect(slow.multiplier).toBe(1);
  });
  it("keeps bosses moving with half-strength, shorter chills", () => {
    const slow = new SlowEffect();
    slow.apply(2, 0.4, true);
    expect(slow.multiplier).toBe(0.8);
    expect(slow.remaining).toBeCloseTo(1.4);
  });
});
describe("returning leaf flight", () => {
  it("travels outward for the same distance at 30, 60 and 120 FPS", () => {
    for (const fps of [30, 60, 120]) {
      const p = new ReturningFlight();
      p.launch(0, 0, 0, 350);
      for (let i = 0; i < fps * 0.4; i++) p.step(1 / fps, 0, 0);
      expect(p.x).toBeCloseTo(140, 5);
      expect(p.returning).toBe(false);
      p.step(0.08, 0, 0);
      expect(p.x).toBeCloseTo(168, 5);
      p.step(0.1, 0, 0);
      expect(p.returning).toBe(true);
      expect(p.x).toBeLessThan(168);
    }
  });
  it("catches a moving caster, stops on arrival and resets for the next shot", () => {
    const p = new ReturningFlight();
    p.launch(0, 0, 0, 350);
    let casterX = 0;
    for (let i = 0; i < 180 && !p.done; i++) {
      casterX -= 150 / 60;
      p.step(1 / 60, casterX, 0);
    }
    expect(p.done).toBe(true);
    expect(p.x).toBeCloseTo(casterX);
    const caught = p.x;
    p.step(1, 999, 999);
    expect(p.x).toBe(caught);
    p.launch(10, 20, Math.PI / 2, 350);
    expect(p.returning).toBe(false);
    expect(p.done).toBe(false);
    p.step(0.1, 10, 20);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(55);
  });
});
