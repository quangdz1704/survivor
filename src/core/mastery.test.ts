import { describe, it, expect } from "vitest";
import {
  RunModel,
  newProfile,
  xpRequired,
  EVOLUTION_IDS,
  EVOLUTIONS,
} from "./game";
import { MASTERY_IDS, MASTERY } from "./mastery";
describe("continued evolution progression", () => {
  it("gates mastery and support shots behind their evolution, then applies chosen ranks", () => {
    for (const evolution of EVOLUTION_IDS) {
      const run = new RunModel(newProfile(), () => 0.5, "mastery"),
        weapon = EVOLUTIONS[evolution].weapon;
      run.weapons[weapon] = 6;
      expect(run.validUpgrades()).not.toContain(weapon);
      for (const id of MASTERY_IDS.filter(
        (id) => MASTERY[id].evolution === evolution,
      ))
        expect(run.validUpgrades()).not.toContain(id);
      run.evolutions[evolution] = true;
      expect(run.validUpgrades()).toContain(weapon);
      const power = MASTERY_IDS.find(
        (id) => MASTERY[id].evolution === evolution && id.endsWith("power"),
      )!;
      run.choices = [
        {
          id: power,
          name: "",
          description: "",
          current: 0,
          next: 1,
          weapon: false,
        },
      ];
      expect(run.select(power)).toBe(true);
      expect(run.mastery(weapon, "power")).toBe(1.15);
      run.choices = [
        {
          id: weapon,
          name: "",
          description: "",
          current: 6,
          next: 7,
          weapon: true,
        },
      ];
      expect(run.select(weapon)).toBe(true);
      expect(run.weapons[weapon]).toBe(7);
      expect(run.evolutions[evolution]).toBe(true);
      run.gainXp(xpRequired(run.level));
      expect(run.choices).toHaveLength(3);
    }
  });
  it("bounds mana, freezes duration during every pause, and cannot double activate or select an unowned rage", () => {
    const run = new RunModel(newProfile(), () => 0.5, "rage");
    run.gainMana(1000);
    expect(run.mana).toBe(100);
    run.selectRage("frost");
    expect(run.rageWeapon).toBe("sword");
    run.gainXp(20);
    expect(run.activateRage()).toBe(false);
    run.select(run.choices[0].id);
    expect(run.activateRage()).toBe(true);
    expect(run.mana).toBe(0);
    expect(run.activateRage()).toBe(false);
    expect(run.stats.damage).toBe(15);
    run.tick(2, true);
    expect(run.rageRemaining).toBe(6);
    run.tick(1, false);
    expect(run.rageRemaining).toBe(5);
    run.gainMana(100);
    expect(run.mana).toBe(0);
    run.gainXp(xpRequired(run.level));
    run.tick(2, false);
    expect(run.rageRemaining).toBe(5);
    run.select(run.choices[0].id);
    run.tick(6, false);
    expect(run.rageRemaining).toBe(0);
    run.finish(false);
    run.gainMana(100);
    expect(run.activateRage()).toBe(false);
  });
});
