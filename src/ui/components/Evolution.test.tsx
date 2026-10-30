// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { RunModel, newProfile } from "../../core/game";
import { bridge, emptySnapshot } from "../../game/bridge";
import { useUI } from "../store";
import { LevelUp } from "./Progression";
import { GameHUD } from "./GameHUD";

it("selects the evolution card through the bridge and reflects the evolved weapon in HUD and recipes", () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const run = new RunModel(newProfile(), () => 0, "ui-evolution");
  run.weapons.sword = 6;
  run.ranks.haste = 2;
  run.gainXp(20);
  const snapshot = () => ({
    ...emptySnapshot(),
    level: run.level,
    weapons: { ...run.weapons },
    ranks: { ...run.ranks },
    evolutions: { ...run.evolutions },
  });
  useUI.setState({ stats: snapshot(), choices: run.choices });
  const chosen = vi.fn();
  const remove = bridge.on("choose", (id) => {
    chosen(id);
    expect(run.select(id)).toBe(true);
    useUI.setState({ stats: snapshot(), choices: run.choices });
  });
  const host = document.createElement("div"),
    root = createRoot(host);
  try {
    act(() =>
      root.render(
        <>
          <LevelUp />
          <GameHUD pause={() => undefined} />
        </>,
      ),
    );
    const card = host.querySelector<HTMLButtonElement>(".evolution-upgrade")!;
    expect(card.textContent).toContain("TIẾN HÓA VŨ KHÍ");
    expect(card.textContent).toContain("Kiếm trận");
    expect(host.querySelector(".evolution-recipes")!.textContent).toContain(
      "Nhịp chiến đấu 2/2",
    );
    act(() => card.click());
    expect(chosen).toHaveBeenCalledExactlyOnceWith("sword-array");
    expect(
      host.querySelector('[aria-label="Kiếm trận đã tiến hóa"]'),
    ).not.toBeNull();
    expect(host.querySelector('[aria-label="Kiếm phép cấp 6"]')).toBeNull();
    expect(host.textContent).toContain("Đã tiến hóa");
    expect(run.weapons.sword).toBe(6);
  } finally {
    act(() => root.unmount());
    remove();
  }
});
