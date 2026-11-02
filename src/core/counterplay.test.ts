import { describe, expect, it } from "vitest";
import { COUNTERPLAY, CounterWindow } from "./counterplay";

describe("boss counter windows", () => {
  it("only rewards a dodge and expires using simulation time", () => {
    const core = new CounterWindow();
    core.open(false, 1.8);
    expect(core.remaining).toBe(COUNTERPLAY.hitRecovery);
    expect(core.multiplier).toBe(1);
    core.tick(1);
    core.open(true, 1.8);
    expect(core.multiplier).toBe(1.5);
    core.tick(1.79);
    expect(core.multiplier).toBe(1.5);
    core.tick(0.02);
    expect(core.multiplier).toBe(1);
    expect(core.exposed).toBe(false);
  });
  it("clears vulnerable state on reuse and never extends it with negative time", () => {
    const core = new CounterWindow();
    core.open(true, 1.35);
    core.tick(-10);
    expect(core.remaining).toBe(1.35);
    core.reset();
    expect(core.remaining).toBe(0);
    expect(core.multiplier).toBe(1);
  });
});
