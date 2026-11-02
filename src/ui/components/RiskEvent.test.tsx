// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { bridge, emptySnapshot } from "../../game/bridge";
import { RunModel, newProfile } from "../../core/game";
import { useUI } from "../store";
import { RiskEventChoice, RiskEventStatus } from "./RiskEvent";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it("requires proximity, focuses a paused decision, accepts once and shows the earned item", () => {
  const run = new RunModel(newProfile(), () => 0.8);
  run.tick(90, false);
  const state = useUI.getState();
  const sync = (nearby: boolean) =>
    state.setStats({
      ...emptySnapshot(),
      time: run.time,
      trial: {
        phase: run.trial.phase,
        round: 1,
        remaining: run.trial.remaining,
        reward: run.trial.reward,
        x: 1300,
        y: 1300,
        nearby,
      },
    });
  useUI.setState({
    mode: "playing",
    trialOpen: false,
    choices: [],
    relicChoices: [],
  });
  sync(false);
  const off = bridge.on("trial", (action) => {
    if (action === "inspect") run.trial.inspect(true);
    else run.trial.decide(action);
    state.setTrialOpen(run.trial.open);
    sync(true);
  });
  function UI() {
    const mode = useUI((s) => s.mode);
    return (
      <>
        <RiskEventStatus />
        {mode === "trial" && <RiskEventChoice />}
      </>
    );
  }
  const host = document.createElement("div"),
    root = createRoot(host);
  document.body.append(host);
  try {
    act(() => root.render(<UI />));
    expect(host.querySelector("button")).toBeNull();
    act(() => sync(true));
    host.querySelector<HTMLButtonElement>(".trial-status button")!.focus();
    act(() =>
      host.querySelector<HTMLButtonElement>(".trial-status button")!.click(),
    );
    expect(run.pending).toBe(true);
    expect(document.activeElement).toBe(host.querySelector(".trial-close"));
    expect(host.querySelector('[role="dialog"]')).not.toBeNull();
    act(() => host.querySelector<HTMLButtonElement>(".trial-close")!.click());
    expect(document.activeElement).toBe(
      host.querySelector(".trial-status button"),
    );
    act(() =>
      host.querySelector<HTMLButtonElement>(".trial-status button")!.click(),
    );
    act(() => host.querySelector<HTMLButtonElement>(".play-button")!.click());
    expect(run.pending).toBe(false);
    expect(useUI.getState().mode).toBe("playing");
    expect(host.textContent).toContain("45s");
    expect(run.trial.decide("accept")).toBe(false);
    act(() => {
      run.tick(45, false);
      sync(true);
    });
    expect(host.textContent).toContain("KHẾ ƯỚC HOÀN THÀNH");
    expect(run.collectedGear).toHaveLength(1);
    act(() => state.setResult(run.finish(false)!));
    expect(host.querySelector(".trial-status")).toBeNull();
  } finally {
    act(() => root.unmount());
    host.remove();
    off();
  }
});
