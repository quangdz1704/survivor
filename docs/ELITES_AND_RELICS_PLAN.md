# Mini-bosses, treasure and relics

User-approved scope: two mid-run elites, treasure with three selectable rewards, six run-only relics. Commit verified increments; publishing remains separate.

1. Domain and reward rules (core/relics.ts, core/game.ts, tests). Six distinct effects; unique, compatible three-card offers; only defeated elites grant chests; duplicate/stale choice rejection; level-up overflow and treasure pause cannot overlap. Verify time boundaries, reward lifecycle, modifiers and fresh-run reset.
2. Encounter runtime (core/encounters.ts, game/EliteEncounters.ts, EnemyActor, ForestScene). Crowned Slime at60s with a warned pulse; Orc captain at180s with a warned dash. Distinct scale/crown/HP bar; each drops a visible chest, proximity opens it. Preserve150-actor cap, immunity/pause/reset and boss victory semantics. Verify hit boundaries and lifecycle in a real engine QA fixture.
3. Relic combat integration (ForestScene, CombatSystem, Pickups). Root: +35% damage after1s stationary; Rage: +30% attack speed at<=40% HP; Heart: heal pickups trigger140-radius shockwave; Rime: +25% damage against chilled targets; Return: +50% returning leaf damage; Fang: +40% damage against elites/Golem. Preserve existing per-flight hit dedup and avoid recursive shockwaves. Verify actual hit paths.
4. Player flow (bridge/store, Treasure UI, HUD, App/styles). Three readable touch cards, existing relic inspection, elite status and offscreen chest direction/distance; no overlap with level-up, no stale choices after home/result. Verify actual production React choice flow and small portrait layout.
5. Review and evidence. Relevant tests, lint/build, independent read-only review, normal-profile full engine run plus targeted QA. Record fixtures separately from normal gameplay, phone/perceptual limits and commit hashes. No new external assets/dependencies required.

Dependencies:2/3/4 depend on1; final review follows all slices. Existing saves and hero IDs remain compatible because new state lives only in RunModel.
