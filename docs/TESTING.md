# Verification — 2026-10-30

## Automated checks

- `npm test`: **33 tests passed across 6 files** (Vitest 5.0.5).
- Domain: damage/critical/armor/HP floor; all three weapon ranks/cooldown/haste/pierce; next-level XP curve, overflow and one choice per level; unique legal/non-maxed choices; waves and five-minute boss boundary; reward, affordable/maxed permanent purchases and idempotent settlement.
- Persistence using fake-indexeddb: save/load/reload, settings and records, concurrent atomic purchases, corrupt/unavailable storage, no duplicate reward.
- Spatial grid: equivalent to scan near cell/world edges; corpses excluded immediately even if they died after rebuild.
- Player motion: held-input distance at 30/60/120 FPS, responsive acceleration/braking, analog input and reset.
- Joystick React/jsdom integration: floating origins including edges, pointer capture, travel clamp/dead zone, sensitivity, release/cancel/lost capture/blur, multitouch isolation and right-click filtering.
- `npm run lint`: passed. `npm run build`: TypeScript and production build passed.
- PWA build:45 precache entries, approximately 3740 KiB; manifest, SW and Workbox generated. Phaser is a separate 1.2 MB raw/332 KB gzip chunk; Vite's >500 KB warning remains a bundle-size warning.
- Audit: production dependencies have 0 findings. Full dependency audit has 4 linked low findings in the build-only Workbox→deepmerge chain, no moderate/high/critical. Latest deepmerge from npm is 4.3.1, no compatible patch available at this check; see DEPLOYMENT.md.

## Browser: actual full engine

Firefox native browser, real Phaser render and update loop, dev QA 390×844 stage. `dev/run-verification.html` adds 24 simulation steps of 16.67 ms per rendered frame; bot sends ordinary movement/choose bridge commands. No HP/XP/damage/boss-time injections in the victory or defeat attempts, no permanent upgrades. The same engine as the app produces both results. This checks gameplay systems independently of the React UI.

- Encountered all 5 types: Slime, Bat, Skeleton, Orc, Golem; up to 25 active enemies observed in the final bot run (150 in the separate stress check).
- Victory example after review fixes:321.13 s, 584 kills, level 14, 1136 gold.
- Standing defeat example:151.78 s, 177 kills, level 4, HP 0.
- 16 level selections across those attempts; choices paused the clock. Manual pause checked after 10 s.
- Low FPS regression: 15 actual scene updates of 66.67 ms advance the run clock 1.00 s; small simulation slices keep spawning, movement and cooldowns aligned. The same check asserts spawnClock = 1 s and player travel >150 world pixels.
- Results saved through ProfileRepository to a separate QA database, duplicate settlement left gold unchanged, a new repository reloaded the saved value. Complete status is shown only after these assertions.
- Evidence: `screenshots/11-run-verification.jpg`, `screenshots/run-verification.txt`. The AX text truncates the long result JSON; screenshot and individual assertions retain the context.

## Browser: UI and offline

Viewed production preview on localhost 5181 with Firefox Responsive Design Mode 390×844 CSS pixels, DPR 2 and touch simulation. Actual viewport downloads are 780×1688 PNGs.

| Flow                     | Observed result                                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menu/start               | Artwork, gold, shop/records/actions render; start enters forest with HP 100 and sword                                                                                                                               |
| Keyboard movement/combat | Held WASD in actual app; camera/character moved, sword hit for 14, kills and contact damage updated                                                                                                                 |
| XP/level choice          | Moving through dropped orbs opened real three-card level 2 screen at 00:22; clock paused                                                                                                                            |
| Shop                     | All 3 permanent upgrades render; purchase controls disabled at 0 gold; atomic purchase/next-run stats covered by tests                                                                                              |
| Pause                    | Changing focus/tab pauses; resume restores play; ESC and UI controls wired through same bridge                                                                                                                      |
| Audio                    | Gesture activates Web Audio and Firefox indicates an audio-playing tab; mix listening and device vibration remain manual checks                                                                                     |
| Offline                  | Loaded production once, stopped preview server, reloaded same origin successfully; started a run, reached level 2 at 00:27 with 18 kills and 80 HP. Direct HTTP request failed to connect while game ran from cache |
| Responsive               | Menu/HUD/level cards/shop viewed at 390×844; safe-area CSS and small-height adaptations present                                                                                                                     |

Evidence:08-full-menu.png,09-levelup.png,10-offline-levelup.png. These are actual browser screenshots, not generated mockups. Earlier 01–03 captures are historical prototype images with the former fixed joystick;04–05 show the approved player rig QA gallery. Do not use those older images to infer current feature scope.

## Enemy animation and performance

`dev/enemy-animation.html` imports production EnemyActor: Slime hop/squash, independent bat wings, opposite legs/arms on Skeleton/Orc, Golem heavy stride and raised-arm charge. Actual rendered gallery inspected for silhouette, transparency and joint placement.06-enemy-gallery.jpg is a browser image.07-enemy-animation.webp is 36 consecutive browser captures over 2.56 s, cropped to the gallery with recorded frame delays; it is an animation review view, not footage of a balanced run.

`dev/load-verification.html` is explicitly an artificial stress scene:150 live enemy actors around the player with very high HP and player invulnerability, standard simulation/combat/render, all 5 kinds. It checks the ordinary spawn cap and boss insertion remain 150, then measures real rendered frames for 20 seconds. Before terrain bake:27.8 FPS average. After baking static terrain into 4×1200 textures:110.9 FPS average on this desktop Firefox instance; min/max count 150 throughout. Evidence 12-load-150.jpg and load-before.txt/load-after.txt. This is not a mobile benchmark or a guarantee of sustained 120 FPS.

## Review corrections

Independent code review identified corpse targeting, shop-close/save race and match-clock slowdown at low FPS. All 3 corrected and covered by relevant regression checks. Terrain bake removes repeated static drawing work; reduced particles/shake and device-aware DPR cap bound lower-end rendering work.

## Verification limits

- Native coordinate drag automation sometimes fails with ScreenCaptureKit/noWindowsAvailable. Pointer lifecycle tests pass, but sustained joystick usability has not been verified on physical touch hardware.
- No physical iOS Safari/Android Chrome installation, audio mixing, vibration, battery, long-session memory or mid-range mobile FPS certification. These need device testing before production promotion.
- PWA cached reload/play was observed. OS installation prompts and a full installed-app update lifecycle have not been certified across browsers.
- No complete browser-console/network automation connection was available. Real flows ran without a visible crash; this does not establish absence of every console warning.
- Exceptionally long frames are capped at 250 ms to avoid a large catch-up after a stall. Normal 15/30/60 FPS frames consume their full elapsed time through small simulation slices.
- Character supports movement in all directions using front three-quarter cutout art and horizontal mirroring; no separate back-facing artwork.
- Local save only; clearing site data loses progress. The currently running match is not restored after reload.
- Broad human difficulty testing remains future balancing work. No production deployment has occurred.

## Version1.1 — new heroes and weapons

The user reports the original release plays well on a phone and has deployed main to Vercel. This increment was verified locally on `feature/heroes-and-weapons`. During the animation repair, an external Git operation placed the current implementation on main at977c7ac; this agent did not perform that commit/push.

- **45 tests across9 files pass**, plus lint, TypeScript and production build. Added backward-compatible hero-save validation and concurrent purchase/selection tests, hero starting stats/loadout tests, timed non-stacking slow and boss resistance, returning flight at30/60/120FPS, real CombatSystem dispatch/collision/dedup/reset using stubbed rendering primitives, and React chooser lock-until-save coverage. Only renderer primitives are stubbed in the CombatSystem tests, not the production weapon loop.
- Independent read-only review found no Critical/Important issues in current hero selection, persistence, weapons, pooling or status integration. React state remains aggregate-only; no new frame-by-frame React updates.
- The first assembled Linh rig was incorrectly judged acceptable. The user rejected its oversized head, short legs and disconnected neck/shoulders.13-linh-rig.jpg and14-linh-animation.webp are retained as rejected historical evidence; they do not demonstrate an approved visual result.
- Actual Chrome engine QA ran both heroes from default profiles, with the same movement/level-choice bot and no HP/XP/time/stat injections. Both runs saw all5 weapons, all5 enemies, frost tint/slow and leaf return. Manual/levelup pause and15FPS clock/spawn/movement regression still pass; result persistence and duplicate-reward checks complete.

| Hero | Victory time | Kills | Level | Gold | Standing defeat            |
| ---- | -----------: | ----: | ----: | ---: | -------------------------- |
| An   |      317.09s |   580 |    14 | 1128 | 140.3s,157kills,level3,0HP |
| Linh |      334.23s |   588 |    11 | 1149 | 135.6s,150kills,level4,0HP |

Evidence15-linh-run.jpg/linh-run.txt and16-an-expansion-run.jpg/an-expansion-run.txt. These are accelerated actual engine runs, not a physical mobile FPS/difficulty certification. The React hero chooser was also viewed in the production preview's portrait game stage; both illustrated cards and the selected border render correctly (17-hero-chooser.jpg). Selecting Linh saved and returned to her portrait at camp. The chooser's pending-save controls are verified by a deferred repository response test.

The original expansion PWA build precached54 entries (~4051KiB), including the now-rejected Linh rig layers and portrait; verified directly against generated SW paths. New content has no additional runtime network or backend requirements. Existing physical-device limitations apply to the new release until it is published and tried on a phone.

The production UI preserved Linh after reload and after applying the menu SW update; the footer showed1.1. The preview server was then stopped and an escalated HTTP probe confirmed connection refused. Reload still opened Linh from cache, and an offline run started at85/85HP with Frost1, reached level2 at00:18 and showed65/85HP after contact. Evidence18-linh-menu.jpg,19-linh-offline.jpg and linh-offline.txt. New Chrome captures are cropped to the game/QA content to omit browser chrome and unrelated bookmarks. Native responsive width editing was unreliable, so chooser QA used the desktop portrait game stage rather than claiming a newly measured390×844 device emulation.


## Linh anatomy repair after user rejection

Replaced the separated Linh rig with the original whole-body idle portrait and four complete painted contact/passing poses. New source and prompt are retained; the extractor aligns soles without changing limb proportions. Two generated draft sheets were rejected because their legs did not alternate correctly. An’s original rig remains unchanged. New walk texture is1024×256 with four256×256 cells; frame rate follows actual displacement, and Linh’s horizontal facing matches her right-facing source.

Actual Chrome renderer comparison:20-linh-body-comparison.jpg, with original portrait/idle/slow/full-speed at one ground line.21-linh-body-animation.webp contains30 native browser captures over3.022s. Captures were cropped to the gallery; they show connected whole bodies and alternating leading legs. The four-pose cycle is intentionally compact; this visual review does not certify high-frame-count animation or a new phone performance measurement. Tests cover game logic, not aesthetic approval. User acceptance of this replacement is still pending.

45 existing tests, ESLint and TypeScript/production build pass after the actor replacement. Independent read-only review checked hero switching, facing, hit/death/reset and reproduced the strip byte for byte from the extractor; no material correctness issue found. Final build precaches47 entries (~3925.55KiB), including the intact idle portrait and new walk strip; generated SW contains no rejected Linh cutout paths.


Firefox manual smoke check after replacement: selected Linh through the real chooser, started at85/85HP with Frost1, moved right/left with keyboard, stopped into the intact idle pose, took enemy contact damage (70/85 at level2) and resumed after choosing an upgrade.22-linh-body-gameplay.jpg is a real combat screenshot at00:22,11 kills,68/85HP (idle pose during combat, not claimed movement footage). An also started with100/100HP and Sword1 with his existing rig. Code review covers death/reset; no new full victory/defeat bot run was necessary for this render-only repair. No new physical-device, offline or production deployment test is claimed for this repair.


## Golem explosion upgrade

45 tests across9 files, ESLint, TypeScript and production build pass. PWA output remains47 precached entries (~3929.68KiB); no new runtime image/audio downloads. Independent read-only review found no material lifecycle, resource cleanup or damage-radius issue.

`dev/golem-blast.html` uses the real ForestScene, actor, damage path and Effects. This development fixture spawns Golem immediately, removes ordinary enemies, disables player weapons and offers fixed-time poses; it is not a balanced match or production UI. Its9 checks passed in Firefox:25 damage inside the area; no damage just outside; expiry after1.15s; warning/match clock pause; blast pause; effect expiry after a result;30 replays with no additional game objects; home cleanup; and unchanged timing/damage with reduced effects. Evidence: `screenshots/golem-blast-checks.txt`.

`screenshots/23-golem-blast.webp` contains38 consecutive native Firefox captures over2.866s, cropped to Golem and the attack area. The warning, fire, debris, smoke and fade were inspected in actual browser rendering. The clip has no audio track; explosion sound is implemented via local synthesis, not claimed as an audio recording. No new physical-phone FPS measurement, full-match balance run or production deployment is claimed for this change.

## Version1.2 — weapon evolutions

**61 tests across12 files pass**, plus ESLint, TypeScript and production build. New coverage checks recipe gating/explicit selection, legal unique cards, overflow/exhaustion/reset, UI choice/HUD, continuous attack bounds/cadence/reset, curved returning flight at30/60/120FPS, and audio voice pressure. Thirty seeds per starting hero reach evolution in8 focused choices;100 seeds unlock Leaf among other weapons and reach Lốc lá within12 choices. The latest selected weapon receives the owned-build slot so extra owned weapons do not dilute that progression.

Independent read-only review found an audio saturation issue: mass area kills/pickups could consume the voice budget before the victory chord. Hit/death/XP synthesis now has a35ms per-sound throttle; the regression verifies150 simultaneous events preserve the result chord. Final review of combat, lifecycle and weapon-focus changes found no material correctness issue.

`dev/evolutions.html` uses the production scene, combat and React level-up/HUD. This fixture deliberately prefills recipe ingredients, increases target HP and disables XP; it is separate from normal gameplay. Its20 checks passed in Firefox: card eligibility, attack after selection, pause, stable object pools, home cleanup and next-run reset for all3 evolutions, plus actual Blizzard slow and leaf-return phase. Screenshot24 shows the recipe/card UI;25–27 are32 consecutive native frames per evolution over approximately2.2s;28 compares actual combat frames. Clips contain no recorded audio. Reduced effects preserve functional attacks and a readable snowstorm boundary.

Normal-profile bot runs use ordinary movement and card selection with no HP/XP/damage/boss-time injections. Each completed a victory followed by a separate standing defeat, all5 enemy types, level-up/manual pause, the15FPS clock/spawn/movement check, and reward/save/reload/duplicate checks.

| Build | Evolution time / level | Victory time | Kills | Level |
| --- | ---: | ---: | ---: | ---: |
| Kang / Kiếm trận |189.37s /9 |327.88s |577 |13 |
| Dun / Bão tuyết |263.21s /9 |348.90s |599 |15 |
| Kang / Lốc lá |225.55s /11 |321.69s |583 |15 |

An initial Leaf run won without evolving because the owned-weapon card was randomly shared among several weapons. That exposed the progression problem; the final focus correction and100-seed test address it. The Leaf row is the successful rerun after that fix. Sword/Blizzard gameplay captures precede this final offer change; their focused paths also pass the final domain regression. Evidence: screenshots29–31 and `screenshots/evolution-runs.txt`. Native AX truncates long reports and the Sword screenshot cuts off gold, so no Sword reward amount is claimed.

Production PWA output precaches47 entries (~3938.86KiB), with no new external runtime assets or dependencies. The existing Phaser chunk-size warning remains. No new physical-phone FPS, audio listening, offline lifecycle or human difficulty certification is claimed. Changes are local; this agent has not committed, pushed or deployed this increment.
