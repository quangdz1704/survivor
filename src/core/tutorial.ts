export type Onboarding = "new" | "done" | "skipped";
export type LessonStage =
  "move" | "fight" | "collect" | "upgrade" | "dodge" | "ready";
export const LESSON_STAGES: LessonStage[] = [
  "move",
  "fight",
  "collect",
  "upgrade",
  "dodge",
  "ready",
];

/** Milestones come from actual engine actions; elapsed time never completes a step. */
export class TutorialLesson {
  stage: LessonStage = "move";
  distance = 0;
  attempts = 0;
  observe(distance: number, kills: number, level: number, choosing: boolean) {
    if (this.stage === "move") {
      this.distance += Math.max(0, distance);
      if (this.distance >= 100) this.stage = "fight";
    }
    if (this.stage === "fight" && kills > 0) this.stage = "collect";
    if (this.stage === "collect" && level > 1) this.stage = "upgrade";
    if (this.stage === "upgrade" && level > 1 && !choosing)
      this.stage = "dodge";
  }
  resolveDodge(intersected: boolean) {
    if (this.stage !== "dodge") return;
    this.attempts++;
    if (!intersected) this.stage = "ready";
  }
}
