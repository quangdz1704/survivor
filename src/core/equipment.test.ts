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
    expect(saved.loadout.pet).toBe("fox");
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

it("draws gear only after paying, applies its bonus when equipped, and never crafts unowned gear", async () => {
  const { drawEquipment, EQUIPMENT_DRAW_COST } = await import("./equipment");
  const poor = newProfile();
  let rolls = 0;
  expect(
    drawEquipment(poor, () => {
      rolls++;
      return 0.76;
    }).profile,
  ).toBe(poor);
  expect(rolls).toBe(0);
  const wealthy = {
    ...poor,
    gold: EQUIPMENT_DRAW_COST,
    loadout: { ...poor.loadout, essence: 100 },
  };
  const rich = { ...wealthy, gold: 1000 };
  expect(improveGear(rich, "cinderwand")).toBe(rich);
  const drawn = drawEquipment(wealthy, () => 0.76);
  expect(drawn.item).toBe("cinderwand");
  expect(drawn.profile.gold).toBe(0);
  expect(drawn.duplicate).toBe(false);
  expect(new RunModel(drawn.profile).stats.damage).toBe(10);
  const equipped = equipGear(drawn.profile, "cinderwand");
  expect(new RunModel(equipped).stats.damage).toBe(12);
  const again = drawEquipment(
    { ...equipped, gold: EQUIPMENT_DRAW_COST },
    () => 0.76,
  );
  expect(again.duplicate).toBe(true);
  expect(again.profile.loadout.essence).toBe(105);
  expect(again.profile.loadout.inventory.cinderwand).toBe(1);
});
it("settles picked-up gear together with the completion reward once and preserves upgraded duplicates", () => {
  const profile = newProfile();
  profile.loadout.inventory.cinderwand = 4;
  const result = {
    id: "picked",
    victory: false,
    time: 80,
    kills: 50,
    level: 4,
    gold: 0,
    essence: 3,
    collectedGear: ["cinderwand", "frostcrown"] as const,
  };
  const settled = settleResult(profile, {
    ...result,
    collectedGear: [...result.collectedGear],
  });
  expect(settled.loadout.inventory.cinderwand).toBe(4);
  expect(settled.loadout.inventory.frostcrown).toBe(1);
  expect(settled.loadout.essence).toBe(8);
  expect(
    settleResult(settled, {
      ...result,
      collectedGear: [...result.collectedGear],
    }),
  ).toBe(settled);
});
it("serializes two equipment draws so one affordable payment gives exactly one item", async () => {
  const { drawEquipment, EQUIPMENT_DRAW_COST } = await import("./equipment");
  const db = new IDBFactory(),
    repo = new ProfileRepository(db, "draw-atomic");
  await repo.update((p) => ({ ...p, gold: EQUIPMENT_DRAW_COST }));
  await Promise.all([
    repo.update((p) => drawEquipment(p, () => 0.76).profile),
    repo.update((p) => drawEquipment(p, () => 0.99).profile),
  ]);
  repo.close();
  const reload = new ProfileRepository(db, "draw-atomic"),
    saved = await reload.load();
  expect(saved.gold).toBe(0);
  expect(saved.loadout.inventory.cinderwand).toBe(1);
  expect(saved.loadout.inventory.mooncharm).toBe(0);
  reload.close();
});

it("starts with one gift weapon, keeps rare loot discoverable, and preserves existing collections", async () => {
  const { GEAR, GEAR_IDS, rollGear } = await import("./equipment");
  const fresh = newProfile();
  expect(GEAR_IDS.filter((id) => fresh.loadout.inventory[id] > 0)).toEqual([
    "dawnblade",
  ]);
  expect(fresh.loadout.pet).toBe("fox");
  const rare = rollGear(() => 0.2);
  expect(GEAR[rare].tier).toBe("rare");
  expect(fresh.loadout.inventory[rare]).toBe(0);
  const old = newProfile();
  for (const id of GEAR_IDS)
    old.loadout.inventory[id] = GEAR[id].tier === "rare" ? 3 : 0;
  const saved = sanitizeProfile(old);
  for (const id of GEAR_IDS.filter((id) => GEAR[id].tier === "rare"))
    expect(saved.loadout.inventory[id]).toBe(3);
});
