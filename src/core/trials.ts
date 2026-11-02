import type { GearId } from "./equipment";

export const TRIAL = {
  times: [90, 210],
  offerDuration: 45,
  duration: 45,
  radius: 80,
  maxCollectedGear: 4,
} as const;
export type TrialPhase = "dormant" | "available" | "active" | "won" | "skipped";
/** Simulation time only: callers freeze this with pause, card choices and results. */
export class Trial {
  round = 0;
  phase: TrialPhase = "dormant";
  remaining = 0;
  reward: GearId | null = null;
  open = false;
  noticeUntil = 0;
  tick(time: number, dt: number) {
    if (this.phase === "active") {
      this.remaining = Math.max(0, this.remaining - dt);
      if (this.remaining <= 0.000001) {
        this.remaining = 0;
        this.phase = "won";
        this.noticeUntil = time + 6;
        return true;
      }
    }
    if (this.phase === "available") {
      this.remaining = Math.max(
        0,
        TRIAL.times[this.round - 1] + TRIAL.offerDuration - time,
      );
      if (this.remaining <= 0) this.phase = "skipped";
    }
    if (
      this.phase !== "active" &&
      this.phase !== "available" &&
      this.round < TRIAL.times.length &&
      time >= TRIAL.times[this.round]
    ) {
      this.round++;
      this.phase = "available";
      this.reward = null;
      this.remaining = Math.max(
        0,
        TRIAL.times[this.round - 1] + TRIAL.offerDuration - time,
      );
      if (!this.remaining) this.phase = "skipped";
    }
    return false;
  }
  inspect(nearby: boolean) {
    if (!nearby || this.phase !== "available" || this.open) return false;
    this.open = true;
    return true;
  }
  decide(action: "accept" | "skip" | "close") {
    if (!this.open || this.phase !== "available") return false;
    this.open = false;
    if (action !== "close")
      this.phase = action === "accept" ? "active" : "skipped";
    if (action === "accept") this.remaining = TRIAL.duration;
    return true;
  }
}
