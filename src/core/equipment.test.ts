import { describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { newProfile, RunModel, settleResult } from "./game";
import {
  equipGear,
  equipPet,
  gearCost,
  improveGear,
  improvePet,
  MAX_GEAR_LEVEL,
} from "./equipment";
import { difficultyUnlocked, mapUnlocked, selectCampaign } from "./campaign";
import { ProfileRepository, sanitizeProfile } from "./profile";
describe("permanent equipment, pets and campaign", () => {
  it("migrates a real legacy save while preserving gold, hero and previous upgrades", () => {
    const legacy = {
      ...newProfile(),
      gold: 700,
      wins: 2,
      hero: "linh",
      upgrades: { health: 3, damage: 2, speed: 1 },
      loadout: undefined,
      campaign: undefined,
    };
    const saved = sanitizeProfile(legacy);
    expect(saved.gold).toBe(700);
    expect(saved.hero).toBe("linh");
    expect(saved.upgrades.health).toBe(3);
    expect(saved.campaign.completed).toContain("forest:normal");
    expect(mapUnlocked(saved, "ashlands")).toBe(true);
    expect(saved.loadout.inventory.dawnblade).toBe(1);
    expect(saved.loadout.pet).toBeNull();
  });
  it("rejects invalid slot IDs, unowned pets and corrupt ranks without wiping valid inventory", () => {
    const saved = sanitizeProfile({
      ...newProfile(),
      loadout: {
        inventory: { dawnblade: 100, barkhood: -3 },
        equipped: { coat: "dawnblade", weapon: "dawnblade", ring: "__proto__" },
        pets: { fox: 99, owl: 0 },
        pet: "owl",
        essence: Infinity,
      },
      campaign: {
        map: "glacier",
        difficulty: "nightmare",
        completed: ["forest:unknown", "bogus", 5],
      },
    });
    expect(saved.loadout.inventory.dawnblade).toBe(MAX_GEAR_LEVEL);
    expect(saved.loadout.equipped).toEqual({ weapon: "dawnblade" });
    expect(saved.loadout.pet).toBeNull();
    expect(saved.loadout.pets.fox).toBe(10);
    expect(saved.loadout.essence).toBe(0);
    expect(saved.campaign.map).toBe("forest");
    expect(saved.campaign.difficulty).toBe("normal");
  });
  it("equips and upgrades owned gear exactly once per payment and applies only equipped bonuses", () => {
    let profile = newProfile();
    const base = new RunModel(profile).stats;
    profile = equipGear(profile, "dawnblade");
    expect(new RunModel(profile).stats.damage).toBe(base.damage + 1.5);
    const cost = gearCost(1);
    profile = {
      ...profile,
      gold: cost.gold,
      loadout: { ...profile.loadout, essence: cost.essence },
    };
    const next = improveGear(profile, "dawnblade");
    expect(next.loadout.inventory.dawnblade).toBe(2);
    expect(next.gold).toBe(0);
    expect(next.loadout.essence).toBe(0);
    expect(improveGear(next, "dawnblade")).toBe(next);
    expect(profile.loadout.inventory.dawnblade).toBe(1);
    expect(new RunModel(next).stats.damage).toBeCloseTo(
      base.damage + 1.5 * 1.22,
    );
    expect(equipGear(next, "cinderwand")).toBe(next);
  });
  it("unlocks pets, saves the selection and scales their passive bonus", () => {
    let profile = { ...newProfile(), gold: 1000 };
    profile.loadout.essence = 100;
    expect(equipPet(profile, "owl")).toBe(profile);
    profile = improvePet(profile, "owl");
    profile = equipPet(profile, "owl");
    expect(profile.loadout.pet).toBe("owl");
    expect(new RunModel(profile).stats.pickupRadius).toBeCloseTo(60 * 1.08);
    profile = improvePet(profile, "owl");
    expect(new RunModel(profile).stats.pickupRadius).toBeCloseTo(60 * 1.16);
    expect(equipPet(profile, null).loadout.pet).toBeNull();
  });
  it("settles scaled gold, essence, gear and map completion once, including duplicate loot conversion", () => {
    const run = new RunModel(newProfile(), () => 0.5, "loot-forest");
    run.time = 320;
    run.kills = 300;
    const result = run.finish(true)!;
    const first = settleResult(newProfile(), result);
    expect(first.gold).toBe(result.gold);
    expect(first.loadout.essence).toBeGreaterThan(0);
    expect(first.loadout.inventory[result.gearDrop!]).toBeGreaterThan(0);
    expect(settleResult(first, result)).toBe(first);
    expect(mapUnlocked(first, "ashlands")).toBe(true);
    expect(difficultyUnlocked(first, "forest", "hard")).toBe(true);
    expect(difficultyUnlocked(first, "forest", "nightmare")).toBe(false);
    const hardProfile = selectCampaign(first, "forest", "hard");
    const hardRun = new RunModel(hardProfile, () => 0.5, "hard");
    hardRun.time = 320;
    hardRun.kills = 300;
    const hardResult = hardRun.finish(true)!;
    expect(hardResult.gold).toBeGreaterThan(result.gold);
    const next = settleResult(hardProfile, hardResult);
    expect(next.gold - hardProfile.gold).toBe(hardResult.gold);
    expect(difficultyUnlocked(next, "forest", "nightmare")).toBe(true);
    expect(
      selectCampaign(newProfile(), "glacier", "nightmare").campaign.map,
    ).toBe("forest");
  });
  it("serializes an equipment upgrade with a pet selection and survives reload", async () => {
    const factory = new IDBFactory(),
      repo = new ProfileRepository(factory, "armory-save");
    await repo.update((p) => ({
      ...p,
      gold: 90,
      loadout: { ...p.loadout, essence: 2 },
    }));
    await Promise.all([
      repo.update((p) => improveGear(p, "dawnblade")),
      repo.update((p) => improveGear(p, "dawnblade")),
      repo.update((p) => equipPet(p, "fox")),
    ]);
    repo.close();
    const reload = new ProfileRepository(factory, "armory-save"),
      saved = await reload.load();
    expect(saved.loadout.inventory.dawnblade).toBe(2);
    expect(saved.gold).toBe(0);
    expect(saved.loadout.pet).toBe("fox");
    reload.close();
  });
});
