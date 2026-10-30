// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { it, expect, vi } from "vitest";
import { CampaignChooser } from "./CampaignChooser";
import { RageControl } from "./RageControl";
import { GameHUD } from "./GameHUD";
import { useUI } from "../store";
import { newProfile } from "../../core/game";
import { profileRepository } from "../../core/profile";
import { bridge, emptySnapshot } from "../../game/bridge";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it("gates map/difficulty controls, saves the latest campaign, and locks pending selection", async () => {
  const profile = newProfile();
  profile.campaign.completed = ["forest:normal"];
  useUI.setState({ profile });
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r)),
    close = vi.fn();
  const save = vi
    .spyOn(profileRepository, "update")
    .mockImplementation(async (mutate) => {
      await gate;
      return mutate({ ...profile, gold: 777 });
    });
  const host = document.createElement("div"),
    root = createRoot(host);
  try {
    act(() => root.render(<CampaignChooser close={close} />));
    const cards = host.querySelectorAll<HTMLButtonElement>(".campaign-card");
    expect(cards[1].disabled).toBe(false);
    expect(cards[2].disabled).toBe(true);
    act(() => cards[1].click());
    const options = host.querySelectorAll<HTMLButtonElement>(
      ".difficulty-options button",
    );
    expect(options[0].disabled).toBe(false);
    expect(options[1].disabled).toBe(true);
    act(() => host.querySelector<HTMLButtonElement>(".play-button")!.click());
    expect([...host.querySelectorAll("button")].every((b) => b.disabled)).toBe(
      true,
    );
    expect(close).not.toHaveBeenCalled();
    await act(async () => {
      release();
      await gate;
    });
    expect(useUI.getState().profile.campaign.map).toBe("ashlands");
    expect(useUI.getState().profile.gold).toBe(777);
    expect(close).toHaveBeenCalledTimes(1);
  } finally {
    act(() => root.unmount());
    save.mockRestore();
  }
});
it("selects the owned rage through the weapon rack and sends exactly one activation per click when full", () => {
  const host = document.createElement("div"),
    root = createRoot(host),
    stats = emptySnapshot();
  stats.weapons.frost = 1;
  useUI.setState({ stats, mode: "playing" });
  const rage = vi.fn(),
    select = vi.fn(),
    off = bridge.on("rage", rage),
    offSelect = bridge.on("rageWeapon", select);
  try {
    act(() =>
      root.render(
        <>
          <GameHUD pause={vi.fn()} />
          <RageControl />
        </>,
      ),
    );
    expect(
      host.querySelector<HTMLButtonElement>(".rage-button")!.disabled,
    ).toBe(true);
    act(() =>
      host.querySelectorAll<HTMLButtonElement>(".active-weapon")[1].click(),
    );
    expect(select).toHaveBeenCalledExactlyOnceWith("frost");
    act(() => useUI.setState({ stats: { ...stats, mana: 100 } }));
    act(() => host.querySelector<HTMLButtonElement>(".rage-button")!.click());
    expect(rage).toHaveBeenCalledTimes(1);
    act(() => useUI.setState({ mode: "levelup" }));
    expect(
      host.querySelector<HTMLButtonElement>(".rage-button")!.disabled,
    ).toBe(true);
  } finally {
    act(() => root.unmount());
    off();
    offSelect();
  }
});
