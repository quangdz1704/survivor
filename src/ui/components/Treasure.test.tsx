// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { RunModel, newProfile, xpRequired } from "../../core/game";
import { RELICS } from "../../core/relics";
import { bridge, emptySnapshot } from "../../game/bridge";
import { useUI } from "../store";
import { Treasure, RelicInventory } from "./Treasure";
import { GameHUD } from "./GameHUD";

it("selects real treasure through the bridge, updates HUD and resumes a deferred level-up", () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const run = new RunModel(newProfile(), () => 0);
  run.elites["slime-king"] = "defeated";
  run.openTreasure("slime-king");
  run.gainXp(xpRequired(run.level));
  const state = useUI.getState();
  const sync = () => {
    state.setStats({ ...emptySnapshot(), relics: [...run.relics] });
    state.setChoices([...run.choices]);
    state.setRelicChoices([...run.relicChoices]);
  };
  sync();
  const chosen = run.relicChoices[0];
  const remove = bridge.on("relic", (id) => {
    expect(run.selectRelic(id)).toBe(true);
    sync();
  });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  try {
    act(() =>
      root.render(
        <>
          <Treasure />
          <GameHUD pause={() => undefined} />
          <RelicInventory />
        </>,
      ),
    );
    expect(useUI.getState().mode).toBe("treasure");
    expect(host.querySelectorAll(".relic-card")).toHaveLength(3);
    expect(document.activeElement).toBe(host.querySelector(".relic-card"));
    act(() => host.querySelector<HTMLButtonElement>(".relic-card")!.click());
    expect(run.relics).toEqual([chosen]);
    expect(useUI.getState().mode).toBe("levelup");
    expect(
      host.querySelector(`[aria-label="${RELICS[chosen].name}"]`),
    ).not.toBeNull();
    expect(host.querySelector(".relic-inventory")!.textContent).toContain(
      RELICS[chosen].description,
    );
    act(() =>
      state.setResult({
        id: run.id,
        victory: false,
        time: 10,
        kills: 1,
        level: 2,
        gold: 6,
      }),
    );
    expect(useUI.getState().relicChoices).toEqual([]);
    expect(useUI.getState().choices).toEqual([]);
  } finally {
    act(() => root.unmount());
    host.remove();
    remove();
  }
});
