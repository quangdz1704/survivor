import { describe, expect, it } from "vitest";
import { normalizeMovement, seededRandom } from "./rules";
describe("analog movement", () => {
  it("does not accelerate diagonally", () => {
    const v = normalizeMovement(1, 1);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1);
  });
  it("preserves partial analog input", () => {
    expect(normalizeMovement(0.2, 0.3)).toEqual({ x: 0.2, y: 0.3 });
  });
  it("stays finite at the center", () => {
    expect(normalizeMovement(0, 0)).toEqual({ x: 0, y: 0 });
  });
});
describe("seeded map randomness", () => {
  it("repeats its sequence and stays in bounds", () => {
    const a = seededRandom(42),
      b = seededRandom(42);
    for (let i = 0; i < 300; i++) {
      const n = a();
      expect(n).toBe(b());
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
  it("varies between seeds", () => {
    expect(seededRandom(42)()).not.toBe(seededRandom(43)());
  });
});
