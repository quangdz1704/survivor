// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { App } from "./App";
import { bridge, emptySnapshot } from "../game/bridge";
import { newProfile } from "../core/game";
import type { Profile } from "../core/game";
import { ProfileRepository, profileRepository } from "../core/profile";
import { useUI } from "./store";

vi.mock("../game/createGame", async () => {
  const { bridge } = await import("../game/bridge");
  return {
    createGame: () => {
      bridge.ready();
      return { destroy: vi.fn() };
    },
  };
});
vi.mock("../pwa", () => ({
  observeUpdate: () => () => {},
  applyUpdate: vi.fn(),
}));
vi.mock("../audio/AudioManager", () => ({
  audioManager: {
    configure: vi.fn(),
    unlock: vi.fn(),
    play: vi.fn(),
    suspend: vi.fn(),
  },
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => vi.restoreAllMocks());
async function setup(profile = newProfile()) {
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  const repository = new ProfileRepository(new IDBFactory(), "app-story");
  await repository.update(() => profile);
  vi.spyOn(profileRepository, "load").mockImplementation(() =>
    repository.load(),
  );
  vi.spyOn(profileRepository, "update").mockImplementation((mutate) =>
    repository.update(mutate),
  );
  useUI.setState({
    mode: "menu",
    ready: false,
    profileReady: false,
    stats: emptySnapshot(),
    choices: [],
    relicChoices: [],
    trialOpen: false,
  });
  const host = document.createElement("div"),
    root = createRoot(host),
    starts: Profile[] = [],
    practices: Profile[] = [];
  document.body.append(host);
  const offStart = bridge.on("start", (p) => {
    starts.push(p);
    bridge.snapshot(emptySnapshot());
  });
  const offPractice = bridge.on("practice", (p) => {
    practices.push(p);
    bridge.snapshot({
      ...emptySnapshot(),
      tutorial: { stage: "move", distance: 0, attempts: 0, target: null },
    });
  });
  await act(async () => {
    root.render(<App />);
  });
  await act(async () => {
    await repository.load();
  });
  return {
    host,
    repository,
    starts,
    practices,
    close() {
      act(() => root.unmount());
      host.remove();
      repository.close();
      offStart();
      offPractice();
    },
  };
}
it("first Play tells the story, closes back to its opener, teaches, saves once and starts a clean real run", async () => {
  const qa = await setup();
  try {
    const play = qa.host.querySelector<HTMLButtonElement>(
      ".menu-bottom > .play-button",
    )!;
    play.focus();
    act(() => play.click());
    expect(qa.host.textContent).toContain("Đêm khu rừng im tiếng");
    expect(qa.starts).toHaveLength(0);
    act(() =>
      qa.host
        .querySelector<HTMLButtonElement>('[aria-label="Đóng câu chuyện"]')!
        .click(),
    );
    expect(document.activeElement).toBe(play);
    expect((await qa.repository.load()).onboarding).toBe("new");
    act(() => play.click());
    act(() =>
      qa.host
        .querySelector(".story-screen")!
        .dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        ),
    );
    expect(qa.host.querySelector(".story-screen")).toBeNull();
    expect(document.activeElement).toBe(play);
    act(() => play.click());
    act(() =>
      qa.host
        .querySelector<HTMLButtonElement>(".story-controls .play-button")!
        .click(),
    );
    expect(qa.host.textContent).toContain("Người mang đốm sáng");
    act(() =>
      qa.host
        .querySelector<HTMLButtonElement>(".story-controls .play-button")!
        .click(),
    );
    expect(qa.host.querySelectorAll(".story-seals > span")).toHaveLength(3);
    act(() =>
      qa.host
        .querySelector<HTMLButtonElement>(".story-controls .play-button")!
        .click(),
    );
    expect(qa.practices).toHaveLength(1);
    expect(qa.host.textContent).toContain("Bước chân đầu tiên");
    expect(qa.host.querySelector(".weapon-rack")).toBeNull();
    expect((await qa.repository.load()).onboarding).toBe("new");
    act(() =>
      bridge.snapshot({
        ...emptySnapshot(),
        tutorial: { stage: "ready", distance: 100, attempts: 1, target: null },
      }),
    );
    const finish = qa.host.querySelector<HTMLButtonElement>(
      ".tutorial-ready .play-button",
    )!;
    await act(async () => {
      finish.click();
      finish.click();
      await qa.repository.load();
    });
    expect(qa.starts).toHaveLength(1);
    expect(qa.starts[0]).toMatchObject({
      onboarding: "done",
      gold: 0,
      totalRuns: 0,
    });
    expect(qa.host.querySelector(".tutorial-ready")).toBeNull();
    expect((await qa.repository.load()).onboarding).toBe("done");
    act(() =>
      qa.host
        .querySelector<HTMLButtonElement>('[aria-label="Tạm dừng"]')!
        .click(),
    );
    act(() =>
      [...qa.host.querySelectorAll<HTMLButtonElement>("button")]
        .find((b) => b.textContent?.includes("Về trại"))!
        .click(),
    );
    act(() =>
      qa.host
        .querySelector<HTMLButtonElement>(".menu-bottom > .play-button")!
        .click(),
    );
    expect(qa.starts).toHaveLength(2);
    expect(qa.host.querySelector(".story-screen")).toBeNull();
  } finally {
    qa.close();
  }
});
it.each(["new", "done"] as const)(
  "can skip/replay a %s profile without resetting its hero, gear or currency",
  async (onboarding) => {
    const profile = newProfile();
    profile.onboarding = onboarding;
    profile.hero = "linh";
    profile.gold = 800;
    profile.loadout.inventory.frostcrown = 3;
    const qa = await setup(profile);
    try {
      act(() =>
        qa.host
          .querySelector<HTMLButtonElement>(".menu-actions button")!
          .click(),
      );
      await act(async () => {
        qa.host.querySelector<HTMLButtonElement>(".story-skip")!.click();
        await qa.repository.load();
      });
      expect(qa.practices).toHaveLength(0);
      expect(qa.starts).toHaveLength(1);
      expect(qa.starts[0]).toMatchObject({
        hero: "linh",
        gold: 800,
        onboarding: onboarding === "done" ? "done" : "skipped",
      });
      expect(qa.starts[0].loadout.inventory.frostcrown).toBe(3);
    } finally {
      qa.close();
    }
  },
);
it.each([false, true])(
  "respects Pause and Home while a skip is saving (returnHome=%s)",
  async (returnHome) => {
    const qa = await setup();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    try {
      act(() =>
        qa.host
          .querySelector<HTMLButtonElement>(".menu-bottom > .play-button")!
          .click(),
      );
      for (let i = 0; i < 3; i++)
        act(() =>
          qa.host
            .querySelector<HTMLButtonElement>(".story-controls .play-button")!
            .click(),
        );
      vi.mocked(profileRepository.update).mockImplementation(async (mutate) => {
        await gate;
        return qa.repository.update(mutate);
      });
      act(() =>
        qa.host
          .querySelector<HTMLButtonElement>(".tutorial-coach > button")!
          .click(),
      );
      act(() =>
        qa.host
          .querySelector<HTMLButtonElement>('[aria-label="Tạm dừng"]')!
          .click(),
      );
      if (returnHome)
        act(() =>
          [...qa.host.querySelectorAll<HTMLButtonElement>("button")]
            .find((b) => b.textContent?.includes("Về trại"))!
            .click(),
        );
      await act(async () => {
        release();
        await Promise.resolve();
        await qa.repository.load();
      });
      expect(useUI.getState().mode).toBe(returnHome ? "menu" : "paused");
      expect(qa.starts).toHaveLength(returnHome ? 0 : 1);
      expect((await qa.repository.load()).onboarding).toBe("skipped");
    } finally {
      release();
      qa.close();
    }
  },
);
