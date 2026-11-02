# Risk shrines and boss counterplay

Approved scope: optional risk/reward events and readable boss retaliation windows.

1. Trial rules: two optional cursed shrines, offered at90s/210s for45s. Inspect explicitly within80px; the decision pauses gameplay. Accept doubles regular spawn attempts for45s within existing actor caps. Survive to receive one random piece of equipment in pending run rewards; skip/ignore gives no penalty. Death/abandon before completion gives no trial reward. Pause/level-up freezes trial time. Four collected items max (two elite bags plus two trials), settled once using the existing run ID.
   Verification: timing, expiry, pause, once-only rewards, death, settlement/duplicates.
2. Boss counterplay: dodge Golem's heavy explosion, campaign bosses' heavy lane, or mini-boss pulse/dash to expose the core. Final windows1.8s/1.6s, mini1.35s; damage×1.5 and boss stays still. Being inside the attack geometry (including invincibility) prevents the damage bonus and only gives short recovery. Other attacks remain unchanged.
   Verification: warning→miss/hit→recovery, damage multiplier, reset/death, all three final bosses and both elites.
3. Production UI and visual pass: inspect/accept/skip controls, countdown and shrine direction, earned-item feedback, gold core markers/counter timers, guide copy. Reuse procedural graphics; no assets/dependencies or personal-save schema changes.
   Verification: React interactions/focus and gameplay integration, Chrome QA at mobile dimensions, tests/lint/typecheck/build, source review and commits. Physical-phone performance and broad human balance remain separate acceptance work.

Implementation order: rules + regression checks → engine/visual/UI event slice → boss slice → browser evidence/docs. No deployment or remote push requested for this turn.


Completion checkpoint: rules, engine integration, world markers, production UI, regression coverage and independent read-only source review are complete.138 tests/26 files, lint, TypeScript and production build pass. Review fixes cover hostile-zone saturation and focus restoration. The prepared QA fixture uses an isolated save and clearly labeled prefills. Browser visual acceptance remains pending: broad native Chrome reads were rejected for private unrelated tabs; task-scoped browser host unavailable. Explicit permission for a separate Chrome QA window has been requested; do not infer approval from elapsed time. No visual2.2 verification, physical-device FPS or normal human victory is claimed. No remote push/deployment.
