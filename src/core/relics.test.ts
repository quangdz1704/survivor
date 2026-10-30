import { describe, expect, it } from "vitest";
import { RunModel, newProfile, xpRequired } from "./game";
import { RELICS, relicHitMultiplier } from "./relics";
import { ELITE_IDS } from "./encounters";
import { seededRandom } from "../game/rules";

describe("elite rewards and relic builds", () => {
  it("schedules each elite once at 60/180 seconds and resets a fresh run", () => {
    const profile = newProfile(),
      run = new RunModel(profile);
    run.time = 59.99;
    expect(run.dueElites()).toEqual([]);
    run.tick(0.02, false);
    expect(run.dueElites()).toEqual(["slime-king"]);
    run.elites["slime-king"] = "active";
    run.time = 180;
    expect(run.dueElites()).toEqual(["orc-captain"]);
    expect(run.openTreasure("slime-king")).toBe(false);
    run.elites["slime-king"] = "defeated";
    expect(run.openTreasure("slime-king")).toBe(true);
    run.selectRelic(run.relicChoices[0]);
    const fresh = new RunModel(profile);
    expect(fresh.relics).toEqual([]);
    expect(fresh.elites["slime-king"]).toBe("waiting");
    expect(profile).toEqual(newProfile());
  });
  it("offers three unique compatible unowned rewards for both chests across seeds", () => {
    for (let seed = 0; seed < 100; seed++) {
      const run = new RunModel(newProfile(), seededRandom(seed));
      if (seed % 2) {
        run.weapons.leaf = 1;
        run.weapons.frost = 1;
      }
      for (const elite of ELITE_IDS) {
        run.elites[elite] = "defeated";
        expect(run.openTreasure(elite)).toBe(true);
        expect(new Set(run.relicChoices).size).toBe(3);
        for (const id of run.relicChoices) {
          expect(run.relics).not.toContain(id);
          const weapon = RELICS[id].weapon;
          if (weapon) expect(run.weapons[weapon]).toBeGreaterThan(0);
        }
        const chosen = run.relicChoices[0];
        expect(run.selectRelic(chosen)).toBe(true);
        expect(run.selectRelic(chosen)).toBe(false);
        expect(run.openTreasure(elite)).toBe(false);
      }
      expect(run.relics).toHaveLength(2);
    }
  });
  it("serializes chest choices, level-ups and XP overflow without losing either reward", () => {
    const run = new RunModel(newProfile(), () => 0);
    run.elites["slime-king"] = run.elites["orc-captain"] = "defeated";
    run.gainXp(20);
    expect(run.openTreasure("slime-king")).toBe(false);
    run.select(run.choices[0].id);
    expect(run.openTreasure("slime-king")).toBe(true);
    expect(run.openTreasure("orc-captain")).toBe(false);
    const time = run.time;
    run.tick(3, false);
    expect(run.time).toBe(time);
    run.gainXp(xpRequired(run.level) + 3);
    expect(run.choices).toEqual([]);
    expect(run.selectRelic("fang")).toBe(false); // not one of this seeded offer
    run.selectRelic(run.relicChoices[0]);
    expect(run.choices).toHaveLength(3);
    expect(run.xp).toBe(3);
    run.select(run.choices[0].id);
    expect(run.openTreasure("orc-captain")).toBe(true);
    run.finish(false);
    expect(run.selectRelic(run.relicChoices[0])).toBe(false);
  });
  it("applies stance and low-health bonuses once and removes them when conditions end", () => {
    const run = new RunModel(newProfile());
    const base = run.stats;
    run.relics = ["root", "rage"];
    run.trackMovement(0.5, 0);
    expect(run.stats.damage).toBe(base.damage);
    run.trackMovement(0.5, 0);
    expect(run.stats.damage).toBe(base.damage * 1.35);
    expect(run.stats.damage).toBe(base.damage * 1.35);
    run.trackMovement(1 / 60, 1);
    expect(run.stats.damage).toBe(base.damage);
    run.hp = 40;
    expect(run.stats.attackSpeed).toBe(base.attackSpeed * 1.3);
    run.hp = 41;
    expect(run.stats.attackSpeed).toBe(base.attackSpeed);
  });
  it("combines chilled-target and leader bonuses independently", () => {
    expect(relicHitMultiplier(["rime", "fang"], true, true)).toBeCloseTo(1.75);
    expect(relicHitMultiplier(["rime", "fang"], false, false)).toBe(1);
    expect(relicHitMultiplier(["fang"], true, true)).toBe(1.4);
    expect(relicHitMultiplier([], true, true)).toBe(1);
  });
});
