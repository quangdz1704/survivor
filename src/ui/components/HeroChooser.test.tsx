// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { HeroChooser } from "./HeroChooser";
import { useUI } from "../store";
import { newProfile } from "../../core/game";
import { profileRepository } from "../../core/profile";
describe("hero selection", () => {
  it("waits for the latest profile save before closing and locks controls during it", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    useUI.setState({ profile: newProfile() });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const save = vi
      .spyOn(profileRepository, "update")
      .mockImplementation(async (mutator) => {
        await gate;
        return mutator({
          ...newProfile(),
          gold: 300,
          upgrades: { health: 2, damage: 0, speed: 0 },
        });
      });
    const host = document.createElement("div"),
      root = createRoot(host),
      close = vi.fn();
    const click = (node: Element) =>
      act(() => {
        node.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    try {
      act(() => root.render(<HeroChooser close={close} />));
      click(host.querySelectorAll(".hero-option")[1]);
      expect(useUI.getState().profile.hero).toBe("an");
      click(host.querySelector(".play-button")!);
      expect(close).not.toHaveBeenCalled();
      expect(
        [...host.querySelectorAll("button")].every((button) => button.disabled),
      ).toBe(true);
      await act(async () => {
        release();
        await gate;
      });
      expect(useUI.getState().profile.hero).toBe("linh");
      expect(useUI.getState().profile.gold).toBe(300);
      expect(useUI.getState().profile.upgrades.health).toBe(2);
      expect(close).toHaveBeenCalledTimes(1);
      expect(save).toHaveBeenCalledTimes(1);
    } finally {
      act(() => root.unmount());
      save.mockRestore();
    }
  });
});
