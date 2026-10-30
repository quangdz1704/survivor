// @vitest-environment jsdom
import { expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../core/game";

it("keeps the victory chord audible after a dense area kill and pickup burst", async () => {
  vi.useFakeTimers();
  vi.resetModules();
  const frequencies: number[] = [];
  let now = 1;
  const parameter = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
  });
  class Context {
    state = "running";
    destination = {};
    get currentTime() {
      return now;
    }
    createGain() {
      return { gain: parameter(), connect: vi.fn(), disconnect: vi.fn() };
    }
    createOscillator() {
      const frequency = parameter();
      return {
        frequency,
        type: "sine",
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: () =>
          frequencies.push(frequency.setValueAtTime.mock.calls[0][0]),
        stop: vi.fn(),
      };
    }
    close() {
      return Promise.resolve();
    }
  }
  vi.stubGlobal("AudioContext", Context);
  const { audioManager } = await import("./AudioManager");
  try {
    audioManager.unlock();
    audioManager.configure({ ...DEFAULT_SETTINGS, music: 0 });
    for (let i = 0; i < 150; i++) {
      audioManager.play("hit");
      audioManager.play("death");
      audioManager.play("xp");
    }
    expect(frequencies).toHaveLength(3);
    now += 0.04;
    audioManager.play("hit");
    expect(frequencies).toHaveLength(4);
    audioManager.play("victory");
    expect(frequencies.slice(-5)).toEqual([523, 659, 784, 1047, 1319]);
  } finally {
    audioManager.dispose();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  }
});
