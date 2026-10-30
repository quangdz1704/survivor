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
