import { describe, expect, it } from "vitest";
import {
  RunModel,
  UPGRADE_LIMITS,
  buyPermanent,
  damageAfterArmor,
  newProfile,
  permanentCost,
  rewardFor,
  rolledDamage,
  settleResult,
  waveAt,
  weaponConfig,
  xpRequired,
} from "./game";
import type { UpgradeId, RunResult } from "./game";
import { seededRandom } from "../game/rules";
const run = () => new RunModel(newProfile(), seededRandom(25), "test-run");
describe("damage and weapon levels", () => {
  it("applies crit and armor without zero/negative damage", () => {
    const stats = run().stats;
    expect(rolledDamage(20, stats, () => 0)).toEqual({
      damage: 30,
      critical: true,
    });
    expect(rolledDamage(20, stats, () => 1)).toEqual({
      damage: 20,
      critical: false,
    });
    expect(damageAfterArmor(5, 99)).toBe(1);
  });
  it("limits HP at zero", () => {
    const r = run();
    r.hurt(200);
    expect(r.hp).toBe(0);
  });
  it("improves each weapon and reduces its cooldown with haste", () => {
    const r = run();
    for (const id of ["sword", "fireball", "lightning"] as const) {
      const first = weaponConfig(id, 1, r.stats),
        last = weaponConfig(id, 6, r.stats);
      expect(last.damage).toBeGreaterThan(first.damage);
      expect(last.interval).toBeLessThan(first.interval);
      expect(last.count).toBeGreaterThan(first.count);
    }
    const base = weaponConfig("sword", 1, r.stats);
    r.ranks.haste = 3;
    expect(weaponConfig("sword", 1, r.stats).interval).toBeLessThan(
      base.interval,
    );
    expect(weaponConfig("sword", 4, r.stats).pierce).toBe(2);
  });
});
describe("XP and upgrades", () => {
  it("uses XP required for the next level and pauses the clock", () => {
    const r = run();
    r.gainXp(19);
    expect(r.level).toBe(1);
    r.gainXp(1);
    expect(r.level).toBe(2);
    expect(r.xp).toBe(0);
    expect(r.pending).toBe(true);
    r.tick(2, false);
    expect(r.time).toBe(0);
    r.tick(2, true);
    expect(r.time).toBe(0);
  });
  it("offers unique legal choices and an unowned weapon", () => {
    const r = run();
    r.gainXp(20);
    expect(r.choices).toHaveLength(3);
    expect(new Set(r.choices.map((c) => c.id)).size).toBe(3);
    expect(
      r.choices.some((c) => c.id === "fireball" || c.id === "lightning"),
    ).toBe(true);
    expect(r.select("not-real" as UpgradeId)).toBe(false);
    const choice = r.choices[0];
    expect(r.select(choice.id)).toBe(true);
    expect(r.rank(choice.id)).toBe(choice.next);
    r.tick(1, false);
    expect(r.time).toBe(1);
  });
  it("retains overflow and requires one choice for each gained level", () => {
    const r = run();
    r.gainXp(20 + xpRequired(2) + 3);
    expect(r.level).toBe(2);
    expect(r.select(r.choices[0].id)).toBe(true);
    expect(r.level).toBe(3);
    expect(r.pending).toBe(true);
    expect(r.xp).toBe(3);
    r.select(r.choices[0].id);
    expect(r.pending).toBe(false);
  });
  it("never offers max rank or duplicate cards when only two upgrades remain", () => {
    const r = run();
    for (const id of Object.keys(UPGRADE_LIMITS) as UpgradeId[]) {
      if (id in r.weapons)
        r.weapons[id as keyof typeof r.weapons] = UPGRADE_LIMITS[id];
      else r.ranks[id as keyof typeof r.ranks] = UPGRADE_LIMITS[id];
    }
    r.ranks.health = 4;
    r.ranks.critical = 4;
    r.gainXp(20);
    expect(r.choices.map((c) => c.id).sort()).toEqual(["critical", "health"]);
  });
  it("heals correctly when maximum HP is chosen", () => {
    const r = run();
    r.hp = 5;
    r.ranks.health = 4;
    for (const id of ["sword", "fireball", "lightning"] as const)
      r.weapons[id] = 6;
    for (const id of [
      "damage",
      "haste",
      "speed",
      "magnet",
      "critical",
    ] as const)
      r.ranks[id] = UPGRADE_LIMITS[id];
    r.gainXp(20);
    r.select("health");
    expect(r.stats.maxHp).toBe(200);
    expect(r.hp).toBe(25);
  });
  it("does not accept XP or a second result after finish", () => {
    const r = run();
    expect(r.finish(true)?.victory).toBe(true);
    r.gainXp(1000);
    r.tick(5, false);
    expect(r.level).toBe(1);
    expect(r.time).toBe(0);
    expect(r.finish(false)).toBeNull();
  });
});
describe("five-minute waves and rewards", () => {
  it("introduces enemies on the exact boundaries and boss at five minutes", () => {
    expect(waveAt(59.99).composition).toEqual(["slime"]);
    expect(waveAt(60).composition).toContain("bat");
    expect(waveAt(120).composition).toContain("skeleton");
    expect(waveAt(180).composition).toContain("orc");
    expect(waveAt(299.99).boss).toBe(false);
    expect(waveAt(300).boss).toBe(true);
    expect(waveAt(240).interval).toBeLessThan(waveAt(0).interval);
  });
  it("settles gold and records once, even if the finish event repeats", () => {
    const result: RunResult = {
      id: "unique",
      victory: true,
      time: 305,
      kills: 200,
      level: 10,
      gold: 0,
    };
    const expected = rewardFor(305, 200, true);
    const saved = settleResult(newProfile(), result);
    expect(saved.gold).toBe(expected);
    expect(saved.totalRuns).toBe(1);
    expect(saved.wins).toBe(1);
    expect(settleResult(saved, result)).toBe(saved);
  });
  it("purchases exactly once per cost and respects insufficient gold/max rank", () => {
    let profile = newProfile();
    expect(buyPermanent(profile, "damage")).toBe(profile);
    const cost = permanentCost("damage", 0);
    profile = { ...profile, gold: cost };
    const bought = buyPermanent(profile, "damage");
    expect(bought.gold).toBe(0);
    expect(bought.upgrades.damage).toBe(1);
    expect(permanentCost("damage", 1)).toBeGreaterThan(cost);
    const maxed = {
      ...bought,
      gold: 999999,
      upgrades: { ...bought.upgrades, damage: 10 },
    };
    expect(buyPermanent(maxed, "damage")).toBe(maxed);
  });
});
