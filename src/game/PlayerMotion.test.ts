import { describe, expect, it } from "vitest";
import { PlayerMotion } from "./PlayerMotion";
import { PLAYER_SPEED } from "./rules";

describe("player movement easing", () => {
  function heldForOneSecond(fps: number) {
    const motion = new PlayerMotion();
    let x = 0,
      y = 0;
    for (let frame = 0; frame < fps; frame++) {
      const step = motion.step(1, 1, 1 / fps);
      x += step.dx;
      y += step.dy;
    }
    return { x, y, speed: Math.hypot(motion.vx, motion.vy) };
  }
  it("travels the same distance at 30, 60 and 120 FPS", () => {
    const expected = heldForOneSecond(60);
    for (const fps of [30, 120]) {
      const result = heldForOneSecond(fps);
      expect(result.x).toBeCloseTo(expected.x, 8);
      expect(result.y).toBeCloseTo(expected.y, 8);
    }
    expect(expected.speed).toBeLessThanOrEqual(PLAYER_SPEED);
  });
  it("responds within 100ms and stops with less than six pixels of drift", () => {
    const motion = new PlayerMotion();
    motion.step(1, 0, 0.1);
    expect(motion.vx).toBeGreaterThan(PLAYER_SPEED * 0.9);
    let drift = 0;
    for (let i = 0; i < 30; i++) drift += motion.step(0, 0, 1 / 60).dx;
    expect(drift).toBeLessThan(6);
    expect(Math.abs(motion.vx)).toBeLessThan(0.01);
  });
  it("preserves slow analog movement and clears momentum on reset", () => {
    const motion = new PlayerMotion();
    motion.step(0.3, 0.4, 1);
    expect(Math.hypot(motion.vx, motion.vy)).toBeCloseTo(PLAYER_SPEED * 0.5);
    motion.reset();
    expect(motion.step(0, 0, 1 / 60)).toEqual({ dx: 0, dy: 0, vx: 0, vy: 0 });
  });
});
