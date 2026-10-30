import { describe, expect, it } from "vitest";
import {
  EVOLUTION_IDS,
  EVOLUTIONS,
  PASSIVES,
  RunModel,
  UPGRADE_LIMITS,
  WEAPONS,
  newProfile,
  xpRequired,
} from "./game";
import { seededRandom } from "../game/rules";

describe("weapon evolution progression", () => {
  it("keeps a newly selected leaf build attainable after unlocking other weapons", () => {
    for (let seed = 0; seed < 100; seed++) {
      const run = new RunModel(newProfile(), seededRandom(seed), String(seed));
      for (let i = 0; i < 12 && !run.evolutions["leaf-vortex"]; i++) {
        run.gainXp(xpRequired(run.level));
        const choice = run.weapons.leaf
          ? run.weapons.leaf < 6
            ? "leaf"
            : run.ranks.speed < 2
              ? "speed"
              : "leaf-vortex"
          : (run.choices.find((c) => c.id === "leaf")?.id ??
            run.choices.find((c) => c.weapon && c.current === 0)!.id);
        expect(run.choices.some((c) => c.id === choice)).toBe(true);
        expect(run.select(choice)).toBe(true);
      }
      expect(run.evolutions["leaf-vortex"]).toBe(true);
    }
  });
  it.each(["an", "linh"] as const)(
    "lets %s evolve their starting weapon in eight focused choices",
    (hero) => {
      for (let seed = 0; seed < 30; seed++) {
        const run = new RunModel(
          { ...newProfile(), hero },
          seededRandom(seed),
          String(seed),
        );
        const id = hero === "an" ? "sword-array" : "blizzard";
        const recipe = EVOLUTIONS[id];
        for (let i = 0; i < 8; i++) {
          run.gainXp(xpRequired(run.level));
          const choice =
            run.weapons[recipe.weapon] < 6
              ? recipe.weapon
              : run.ranks[recipe.passive] < 2
                ? recipe.passive
                : id;
          expect(run.choices.some((c) => c.id === choice)).toBe(true);
          expect(run.select(choice)).toBe(true);
        }
        expect(run.evolutions[id]).toBe(true);
      }
    },
  );
  it.each(EVOLUTION_IDS)(
    "gates %s on both ingredients and requires an explicit choice",
    (id) => {
      const run = new RunModel(newProfile(), () => 0, id),
        recipe = EVOLUTIONS[id];
      run.weapons[recipe.weapon] = recipe.weaponRank - 1;
      run.ranks[recipe.passive] = recipe.passiveRank;
      expect(run.validUpgrades()).not.toContain(id);
      run.weapons[recipe.weapon]++;
      run.ranks[recipe.passive]--;
      expect(run.validUpgrades()).not.toContain(id);
      run.ranks[recipe.passive]++;
      expect(run.validUpgrades()).toContain(id);
      expect(run.evolutions[id]).toBe(false);
      expect(run.select(id)).toBe(false);
      run.gainXp(20);
      expect(run.choices.some((c) => c.id === id && c.evolution)).toBe(true);
      expect(run.select(id)).toBe(true);
      expect(run.evolutions[id]).toBe(true);
      expect(run.weapons[recipe.weapon]).toBe(6);
      expect(run.validUpgrades()).not.toContain(id);
      expect(run.select(id)).toBe(false);
    },
  );
  it("guarantees a ready evolution and an unowned weapon without duplicate cards across random seeds", () => {
    for (let seed = 0; seed < 100; seed++) {
      const run = new RunModel(newProfile(), seededRandom(seed), String(seed));
      run.weapons.sword = 6;
      run.ranks.haste = 2;
      run.gainXp(20);
      expect(run.choices.some((c) => c.id === "sword-array")).toBe(true);
      expect(run.choices.some((c) => c.weapon && c.current === 0)).toBe(true);
      expect(new Set(run.choices.map((c) => c.id)).size).toBe(3);
    }
  });
  it("rejects stale ingredients and keeps overflow paused for the next legal choice", () => {
    const run = new RunModel(newProfile(), () => 0, "overflow");
    run.weapons.frost = 6;
    run.ranks.magnet = 2;
    run.gainXp(20 + xpRequired(2) + 3);
    run.ranks.magnet = 1;
    expect(run.select("blizzard")).toBe(false);
    run.ranks.magnet = 2;
    expect(run.select("blizzard")).toBe(true);
    expect(run.level).toBe(3);
    expect(run.xp).toBe(3);
    expect(run.pending).toBe(true);
    expect(run.choices.some((c) => c.id === "blizzard")).toBe(false);
    run.tick(2, false);
    expect(run.time).toBe(0);
  });
  it("offers remaining evolutions after base caps, then heals after every upgrade is exhausted", () => {
    const run = new RunModel(newProfile(), () => 0, "max");
    for (const id of WEAPONS) run.weapons[id] = UPGRADE_LIMITS[id];
    for (const id of PASSIVES) run.ranks[id] = UPGRADE_LIMITS[id];
    run.gainXp(20);
    expect(run.choices.map((c) => c.id).sort()).toEqual(
      [...EVOLUTION_IDS].sort(),
    );
    for (const id of EVOLUTION_IDS) {
      expect(run.select(id)).toBe(true);
      run.gainXp(xpRequired(run.level));
    }
    expect(run.pending).toBe(false);
    run.hp = 1;
    run.gainXp(xpRequired(run.level));
    expect(run.hp).toBe(21);
  });
  it("does not save temporary evolutions or carry them into the next run", () => {
    const profile = newProfile(),
      run = new RunModel(profile, () => 0, "first");
    run.weapons.leaf = 6;
    run.ranks.speed = 2;
    run.gainXp(20);
    run.select("leaf-vortex");
    const next = new RunModel(profile, () => 0, "next");
    expect(next.evolutions["leaf-vortex"]).toBe(false);
    expect(next.weapons.leaf).toBe(0);
    expect(next.ranks.speed).toBe(0);
    expect(profile).toEqual(newProfile());
  });
});
