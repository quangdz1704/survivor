import { expect, it } from "vitest";
import type Phaser from "phaser";
import { Effects } from "./Effects";

it("bounds ring bursts to eight reusable objects and clears them on restart", () => {
  const circles: { visible: boolean; alpha: number }[] = [];
  function shape() {
    const state = { visible: true, alpha: 1 };
    const object: unknown = new Proxy(state, {
      get: (target, key) =>
        key === "visible" || key === "alpha"
          ? target[key]
          : key === "then"
            ? undefined
            : (value: number | boolean) => {
                if (key === "setVisible") target.visible = Boolean(value);
                if (key === "setAlpha") target.alpha = Number(value);
                return object;
              },
    });
    return { object, state };
  }
  const scene = {
    add: {
      circle: () => {
        const s = shape();
        circles.push(s.state);
        return s.object;
      },
      text: () => shape().object,
      graphics: () => shape().object,
    },
  } as unknown as Phaser.Scene;
  const effects = new Effects(scene),
    count = circles.length;
  for (let i = 0; i < 100; i++) effects.ring(0, 0, 90, 0xffffff, 1000);
  expect(circles.length).toBe(count);
  expect(circles.slice(0, 8).every((c) => c.visible)).toBe(true);
  effects.update(0.5);
  expect(circles[0].alpha).toBeCloseTo(0.5);
  effects.clear();
  expect(circles.every((c) => !c.visible)).toBe(true);
  effects.ring(0, 0, 90, 0xffffff, 100);
  effects.update(0.1);
  expect(circles.every((c) => !c.visible)).toBe(true);
  effects.enabled = false;
  effects.ring(0, 0, 90, 0xffffff);
  expect(circles.every((c) => !c.visible)).toBe(true);
});
