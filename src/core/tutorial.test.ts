import { describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { TutorialLesson } from "./tutorial";
import { ProfileRepository, sanitizeProfile } from "./profile";
import { newProfile, newPracticeProfile } from "./game";

describe("first adventure milestones and saves", () => {
  it("creates a standard safe lesson without altering either hero's saved campaign and equipment", () => {
    for (const hero of ["an", "linh"] as const) {
      const saved = newProfile();
      saved.hero = hero;
      saved.gold = 900;
      saved.campaign.map = "glacier";
      saved.upgrades.damage = 10;
      saved.loadout.inventory.frostcrown = 5;
      const before = structuredClone(saved),
        practice = newPracticeProfile(saved);
      expect(practice).toMatchObject({
        hero,
        gold: 0,
        upgrades: { damage: 0 },
        campaign: { map: "forest", difficulty: "normal" },
        loadout: { pet: null },
      });
      expect(practice.loadout.inventory.frostcrown).toBe(0);
      practice.settings.music = 0;
      expect(saved).toEqual(before);
    }
  });
  it("requires movement, an actual kill, pickup/level-up, selection and a successful dodge", () => {
    const lesson = new TutorialLesson();
    lesson.observe(0, 0, 1, false);
    expect(lesson.stage).toBe("move");
    lesson.observe(99, 0, 1, false);
    expect(lesson.stage).toBe("move");
    lesson.observe(1, 0, 1, false);
    expect(lesson.stage).toBe("fight");
    lesson.observe(0, 1, 1, false);
    expect(lesson.stage).toBe("collect");
    lesson.observe(0, 1, 2, true);
    expect(lesson.stage).toBe("upgrade");
    lesson.observe(0, 1, 2, false);
    expect(lesson.stage).toBe("dodge");
    lesson.resolveDodge(true);
    expect(lesson.stage).toBe("dodge");
    lesson.resolveDodge(false);
    expect(lesson.stage).toBe("ready");
    expect(lesson.attempts).toBe(2);
    lesson.resolveDodge(true);
    expect(lesson.attempts).toBe(2);
  });
  it("does not force old players through the tutorial or reset their existing progress", () => {
    const old = {
      version: 1,
      totalRuns: 4,
      gold: 900,
      upgrades: { damage: 3 },
      wins: 1,
    };
    expect(sanitizeProfile(old).onboarding).toBe("done");
    expect(sanitizeProfile(old).gold).toBe(900);
    expect(sanitizeProfile({ version: 1 }).onboarding).toBe("new");
    expect(sanitizeProfile({ ...old, onboarding: "skipped" }).onboarding).toBe(
      "skipped",
    );
  });
  it("retains completion or skip on reload while queued writes keep current gold", async () => {
    const factory = new IDBFactory(),
      repo = new ProfileRepository(factory, "tutorial");
    await repo.update((p) => ({ ...p, gold: 700 }));
    await Promise.all([
      repo.update((p) => ({ ...p, onboarding: "done" })),
      repo.update((p) => ({ ...p, gold: p.gold + 10 })),
    ]);
    repo.close();
    const reload = new ProfileRepository(factory, "tutorial");
    expect(await reload.load()).toMatchObject({
      onboarding: "done",
      gold: 710,
      totalRuns: 0,
    });
    await reload.update((p) => ({ ...p, onboarding: "skipped" }));
    reload.close();
    const last = new ProfileRepository(factory, "tutorial");
    expect((await last.load()).onboarding).toBe("skipped");
    last.close();
  });
});
