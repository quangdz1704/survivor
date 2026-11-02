# Story and first-play tour

Scope: opening story tied to Kang/Dun and the existing three regions; a short interactive first-play lesson; skip, replay and persistence. No new maps, progression rewards or balance changes.

1. Story/save foundation: three short illustrated scenes establish the darkened Forest Heart and three corrupted seals. New profiles have onboarding=new; old profiles with completed runs default to done; explicit done/skipped survives reload. Chapter victories continue the narrative. Verify migration and queued save preservation.
2. Safe practice slice: actual player controls, automatic starting weapon, a harmless Slime, real XP pickup and actual level-up cards, then a warned area to dodge. Observe movement/kill/XP/selection/geometry; never advance on a timer alone. Pausing and choices freeze simulation. Retry a missed dodge. Practice cannot award gold, loot, wins or normal results, and the real run starts fresh with the player's original profile/map. Verify engine lifecycle, both heroes, pause, skip/restart and reward isolation.
3. Presentation: first Play opens story when onboarding=new; menu can replay it. Previous/next/close/skip, keyboard focus, readable mobile layout, progress coach and ready panel. Complete/skip persists once before starting the real run; close/leave practice does not falsely mark completion. Reuse existing portraits/map art and procedural graphics. Verify React flows, full tests/lint/build and attempt task-scoped browser QA. Prior Chrome QA authorization persists; do not ask again for it.

Work in small commits, retain old saves, no push/deployment. Record actual verification and any browser tool limitation honestly.


Completion: story/save foundation, safe engine practice, illustrated mobile UI, skip/replay and result narrative are implemented.151 tests/28 files, lint, TypeScript and build pass; source recheck resolves long-practice event leakage and delayed-save navigation races. Close/Escape restore focus; compact coach and scrollable story/ready panels support short screens without requiring timed reading. QA fixture HTML/module servedHTTP200. Browser visual acceptance is unverified because the task-scoped Chrome host is unavailable; user authorization persists, no repeat permission needed. No physical-device performance claim, remote push or deployment.
