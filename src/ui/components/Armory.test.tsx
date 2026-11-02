// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { Armory } from "./Armory";
import { useUI } from "../store";
import { newProfile } from "../../core/game";
import { profileRepository } from "../../core/profile";
import { audioManager } from "../../audio/AudioManager";
it("locks purchases while saving and reports an intervening spend honestly", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const profile = newProfile();
  profile.gold = 1000;
  profile.loadout.essence = 100;
  useUI.setState({ profile });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const update = vi
    .spyOn(profileRepository, "update")
    .mockImplementation(async (mutator) => {
      await gate;
      return mutator({ ...profile, gold: 0 });
    });
  const sound = vi.spyOn(audioManager, "play");
  const host = document.createElement("div"),
    root = createRoot(host);
  try {
    act(() =>
      root.render(
        <Armory close={vi.fn()} chooseHero={vi.fn()} permanent={vi.fn()} />,
      ),
    );
    act(() => host.querySelector<HTMLButtonElement>(".forge-button")!.click());
    expect([...host.querySelectorAll("button")].every((b) => b.disabled)).toBe(
      true,
    );
    await act(async () => {
      release();
      await gate;
    });
    expect(useUI.getState().profile.gold).toBe(0);
    expect(useUI.getState().profile.loadout.inventory.dawnblade).toBe(1);
    expect(host.querySelector('[role="status"]')!.textContent).toContain(
      "Hành trang đã thay đổi",
    );
    expect(sound).not.toHaveBeenCalledWith("level");
  } finally {
    act(() => root.unmount());
    update.mockRestore();
    sound.mockRestore();
  }
});

it("reveals a paid draw after saving and only adds its stats after equipping", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  let profile = { ...newProfile(), gold: 400 };
  useUI.setState({ profile });
  const rng = vi.spyOn(Math, "random").mockReturnValue(0.76);
  const update = vi
    .spyOn(profileRepository, "update")
    .mockImplementation(async (mutate) => {
      profile = mutate(profile);
      return profile;
    });
  const host = document.createElement("div"),
    root = createRoot(host);
  try {
    act(() =>
      root.render(
        <Armory close={vi.fn()} chooseHero={vi.fn()} permanent={vi.fn()} />,
      ),
    );
    await act(async () =>
      host.querySelector<HTMLButtonElement>(".equipment-draw button")!.click(),
    );
    expect(useUI.getState().profile.gold).toBe(200);
    expect(useUI.getState().profile.loadout.inventory.cinderwand).toBe(1);
    expect(host.querySelector('[role="status"]')!.textContent).toContain(
      "Trượng hỏa tâm mới",
    );
    expect(host.querySelector(".armory-stat-grid")!.textContent).toContain(
      "10.0",
    );
    await act(async () =>
      host
        .querySelector<HTMLButtonElement>(
          ".gear-detail-actions .secondary-button",
        )!
        .click(),
    );
    expect(useUI.getState().profile.loadout.equipped.weapon).toBe("cinderwand");
    expect(host.querySelector(".armory-stat-grid")!.textContent).toContain(
      "12.0",
    );
  } finally {
    act(() => root.unmount());
    rng.mockRestore();
    update.mockRestore();
  }
});
