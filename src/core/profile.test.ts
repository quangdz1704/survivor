import { describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { ProfileRepository, sanitizeProfile } from "./profile";
import { buyPermanent, newProfile, settleResult } from "./game";
describe("versioned saved progress", () => {
  it("upgrades old v1 saves without losing gold and persists hero selection alongside a purchase", async () => {
    const legacy = { ...newProfile(), gold: 250, hero: undefined };
    expect(sanitizeProfile(legacy).gold).toBe(250);
    expect(sanitizeProfile(legacy).hero).toBe("an");
    expect(sanitizeProfile({ ...legacy, hero: "unknown" }).hero).toBe("an");
    const factory = new IDBFactory(),
      repo = new ProfileRepository(factory, "heroes");
    await repo.update(() => ({ ...newProfile(), gold: 250 }));
    await Promise.all([
      repo.update((p) => ({ ...p, hero: "linh" })),
      repo.update((p) => buyPermanent(p, "damage")),
    ]);
    repo.close();
    const reopened = new ProfileRepository(factory, "heroes"),
      saved = await reopened.load();
    expect(saved.hero).toBe("linh");
    expect(saved.gold).toBe(150);
    expect(saved.upgrades.damage).toBe(1);
    reopened.close();
  });
  it("survives a new repository instance and serializes concurrent purchases", async () => {
    const factory = new IDBFactory(),
      repo = new ProfileRepository(factory, "persistence");
    await repo.update((p) => ({ ...p, gold: 100 }));
    const [first, second] = await Promise.all([
      repo.update((p) => buyPermanent(p, "damage")),
      repo.update((p) => buyPermanent(p, "damage")),
    ]);
    expect(first.upgrades.damage).toBe(1);
    expect(second.upgrades.damage).toBe(1);
    expect(second.gold).toBe(0);
    repo.close();
    const reopened = new ProfileRepository(factory, "persistence");
    expect((await reopened.load()).upgrades.damage).toBe(1);
    reopened.close();
  });
  it("persists settings, records and settlement IDs", async () => {
    const factory = new IDBFactory(),
      repo = new ProfileRepository(factory, "settings");
    await repo.update((p) => ({
      ...settleResult(p, {
        id: "r",
        time: 310,
        kills: 250,
        level: 12,
        victory: true,
        gold: 0,
      }),
      settings: { ...p.settings, music: 0, sensitivity: 1.4 },
    }));
    repo.close();
    const reload = new ProfileRepository(factory, "settings");
    const p = await reload.load();
    expect(p.settings.music).toBe(0);
    expect(p.settings.sensitivity).toBe(1.4);
    expect(p.bestKills).toBe(250);
    expect(p.bestTime).toBe(310);
    expect(p.settledRuns).toEqual(["r"]);
    reload.close();
  });
  it("normalizes corrupt and unsupported data safely", () => {
    expect(sanitizeProfile(null)).toEqual(newProfile());
    expect(sanitizeProfile({ version: 99, gold: 999 })).toEqual(newProfile());
    const p = sanitizeProfile({
      version: 1,
      gold: NaN,
      upgrades: { health: -4, damage: Infinity, speed: 100 },
      settings: { music: 3, sound: -1, sensitivity: 0 },
      settledRuns: [1, "valid"],
    });
    expect(p.gold).toBe(0);
    expect(p.upgrades).toEqual({ health: 0, damage: 0, speed: 10 });
    expect(p.settings.music).toBe(1);
    expect(p.settings.sound).toBe(0);
    expect(p.settings.sensitivity).toBe(0.6);
    expect(p.settledRuns).toEqual(["valid"]);
  });
  it("remains usable with storage unavailable and keeps one-run rewards idempotent", async () => {
    const repo = new ProfileRepository(undefined, "offline");
    const r = {
      id: "one",
      time: 30,
      kills: 10,
      level: 3,
      victory: false,
      gold: 0,
    };
    await repo.update((p) => settleResult(p, r));
    const saved = await repo.update((p) => settleResult(p, r));
    expect(repo.available).toBe(false);
    expect(saved.totalRuns).toBe(1);
    expect(saved.gold).toBe(30);
  });
});
