# Architecture

## Boundaries

| Module                                     | Responsibility                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `core/game.ts`                             | Pure typed domain: run/stats, XP, legal upgrades, weapon configs, wave director inputs, reward/shop/settlement |
| `core/profile.ts`                          | IndexedDB v 1 `state/profile`, validation, atomic queued read/modify/write, memory fallback                    |
| `game/ForestScene.ts`                      | Run lifecycle, movement, steering/contact, wave spawning, boss telegraph, snapshots                            |
| `game/ForestMap.ts`                        | Seeded terrain/decorations and composed opening clearing                                                       |
| `game/PlayerActor.ts`, `PlayerMotion.ts`   | Kang layered joints, Dun whole-body frames and exact exponential acceleration/displacement                           |
| `game/EnemyActor.ts`                       | Five enemy kinds, frost status, shared pool lifecycle, per-kind gait/flap/hop/hit/death                        |
| `game/ReturningFlight.ts`, `SlowEffect.ts` | Pure pooled leaf flight and refreshing timed slow, tested independently                                        |
| `game/CombatSystem.ts`                     | Modular weapon dispatch, projectile pool, piercing, explosions and chaining                                    |
| `game/Pickups.ts`, `Effects.ts`            | Bounded XP/heal items, particles, damage labels, rings                                                         |
| `game/SpatialGrid.ts`                      | Reused cell buckets; live-target predicate checked at rebuild and query                                        |
| `game/bridge.ts`                           | Typed commands/events and aggregate HUD snapshots; no React dependency                                         |
| `ui/App.tsx`, components                   | Menu, HUD, level selection, shop, records, result, settings, PWA prompt                                        |
| `ui/Joystick.tsx`                          | Floating origin, analog pointer capture, dead zone, cancel/blur cleanup                                        |
| `ui/store.ts`                              | Zustand UI state and aggregate profile/settings/snapshots; no entity positions                                 |
| `audio/AudioManager.ts`                    | Web Audio synthesized themes/SFX, gesture unlock, bounded voices, mute/volume/rung                             |
| `pwa.ts`, `vite.config.ts`                 | Prompted SW updates, local precache, Vietnamese portrait manifest/icons                                        |

## Lifecycle and timing

React registers bridge listeners before Phaser creation and removes them on unmount. Scene removes subscriptions on shutdown. A run starts from a profile snapshot; completion emits one result only. IDB settlement is idempotent over the last 64 run IDs. UI retry/home waits until settlement returns, including memory fallback. Purchases and settings use latest stored profile rather than stale read snapshots.

Elapsed active play time is consumed in collision-safe simulation slices no larger than 1/30 second, with a 250 ms cap for exceptional stalls. Movement, waves, cooldowns, XP attraction and the survival clock therefore stay aligned at low FPS. Manual pause and level selection stop the clock, movement and tweens. UI visibility/blur also pauses; no background progress.

## Rendering and budgets

Phaser AUTO uses WebGL with Canvas fallback. DPR is capped at 2, or 1.5 on devices reporting at most four CPU cores; camera zoom uses the same scale. ResizeObserver updates dimensions, camera follows with damping and world bounds. Depth is based on ground position, foliage can fade near player. Static grass/path/stone graphics are baked once into four 1200×1200 terrain textures, avoiding replay of thousands of drawing commands every frame. Entity simulation stays outside React; HUD publishes at 10 Hz.

Budgets: 150 active enemies including boss, 96 projectiles, 240 pickups (overflow XP merges into an existing item), 130 particles, 36 labels and 8 lightning graphics. Inactive actors reuse textures and containers; different kinds can replace an inactive slot. If the boss needs a slot at full capacity, the farthest ordinary actor is retired. Spatial queries recheck living state so deaths earlier in a tick cannot consume a later weapon cooldown.

## Storage and offline

IDB schema version 1 stores a single validated profile object. Unsupported schemas/corruption reset to defaults; failed/blocked storage falls back to memory and the UI displays a notice. Queued mutations preserve concurrent purchases and settings. Late open after timeout is closed.

No backend, analytics, secrets or runtime CDN dependencies. All runtime artwork is local WebP. Music/SFX are synthesized locally. Production Workbox precaches app code, icons and textures; prompt updates only at camp. IDB persists across SW updates. QA HTML/scripts and source artwork under docs are excluded from dist.

## Backward-compatible hero selection

Display names are Kang (formerly An) and Dun (formerly Linh). Internal IDs stay `"an"`/`"linh"` so existing selected heroes, saved progress and asset paths keep working. Profile v1 includes `hero: "an" | "linh"`. Validation defaults missing/unknown values to Kang while preserving old gold/settings/upgrades/records; no destructive IDB version reset. The chooser writes only hero inside the same queued transaction mechanism and blocks its close/confirm/cards until save returns. RunModel chooses initialWeapons and base stats from HEROES; temporary ranks never leak across runs. PlayerActor retains Kang’s approved rig. Dun uses the original whole-body idle portrait and a four-pose painted walk strip, with uniform scale, shared sole baseline and distance-driven frame advancement; her artwork faces right before mirroring. No Dun limb is scaled independently.


## Golem blast rendering

`GolemBlast.ts` is owned by `Effects`: two reused Graphics objects and fourteen preallocated debris descriptors, with analytic age-based drawing. No per-impact game objects or textures. `clearRun` clears the effect; active pause/level-up freezes it with simulation. After a result, only Effects continues updating so the final blast can finish behind the result panel. `GOLEM_BLAST_RADIUS` is shared by the warning, impact outline and scene damage test. `AudioManager` uses a cached half-second noise buffer, low-pass decay and two descending tones; temporary audio nodes disconnect on end.


## Weapon evolution / 1.2

`core/game.ts` owns the three recipes, eligible cards, per-run evolution flags and build-aware offer priority. Profile v1 is unchanged; old hero IDs remain compatible. `RunModel.select` rechecks eligibility and handles the evolution before the base weapon/passive branches; XP overflow keeps the next choice paused. After base ranks are capped, remaining evolutions are still offered before fallback healing.

`game/EvolutionCombat.ts` owns one reused aura Graphics and four orbit sprites. CombatSystem delegates the continuous sword/blizzard paths, suppresses their base shots, and dispatches evolved leaf volleys through the existing96-slot projectile pool. ReturningFlight computes the outward curve analytically before its normal moving-caster return. Damage goes through ForestScene.hitEnemy, preserving crits, death, XP, boss finish and slow resistance. Snapshot publishes ranks/evolutions at the existing10Hz HUD rate. EvolutionRecipes, LevelUp and GameHUD render progress/cards/icons from that state; entities stay outside React.

Audio attack colors and the evolution chord use existing synthesis. Hit/death/XP SFX are independently coalesced over35ms so large blizzard/pickup bursts do not consume the voice budget before boss/result cues.


## Mid-run encounters and rewards /1.3

`core/encounters.ts` defines the60/180s schedule and elite configuration. RunModel owns the waiting/active/defeated/claimed ledger, relic inventory, compatible three-card offers and stationary/low-HP stats. `pending` includes relic choices, so XP overflow and chest collection serialize with ordinary level-up. No new profile fields or IDB migration.

`EliteEncounters` owns two fixed slots, one ground Graphics and one crown/chest Graphics; its simulation timer drives warnings/dash and chest decoration. EnemyActor scales complete bodies uniformly and resets elite metadata on reuse. ForestScene protects active elites when reserving pool capacity, sends actual damage through shared immunity/hit/death paths, and drops one chest without finishing the run. Segment collision prevents dash tunneling. The pickup callback dispatches Heart area hits; ReturningFlight's phase controls the leaf bonus without resetting hit IDs.

Bridge publishes at the existing10Hz rate; only two elite/chest records and two relic IDs cross into React. `treasure` event/`relic` command wire the modal, store and validated model selection. HUD points to the nearest chest; pause/result show relic descriptions. Begin/home clear both pending event channels, preventing stale cards across runs. Effects now reuses eight rings with simulation-time expiry and reset cleanup instead of allocating a new tween/circle for each burst.


### Blizzard rendering repair

`BlizzardVisual.ts` adds two reusable Graphics owned by EvolutionCombat: ground haze/range fragments and airborne wind/snow. Deterministic phases avoid frame-dependent random emission and per-frame game-object creation.32 snow motes/full mode or9/reduced mode and four two-pass ribbons bound the geometry. The existing158px hit radius, frost cadence, damage and slow still run in EvolutionCombat/ForestScene.

`CombatSystem.stop()` hides pooled attack visuals while retaining the run attack counter; `reset()` also clears that counter. ForestScene calls stop before result effects, so snow cannot freeze behind the result panel. A per-sword ended guard handles a hit finishing the run reentrantly while orbit blades are being positioned. Result effects continue through the existing Effects update path.

## Campaign, armory, companions and rage /2.0

Profile version remains1. New `loadout` and `campaign` fields migrate from missing fields without losing the original currencies/settings/hero/upgrades. Sanitization validates known gear slots/ownership, rank bounds, selected pets, map/difficulty and completion IDs. Old profiles with wins receive Forest Normal completion. Armory/campaign mutations use the existing serialized IDB updater; purchase feedback checks actual mutation success rather than rendered affordability. Foreground panels manage keyboard focus; opening another panel closes Armory.

RunModel owns temporary mastery ranks, mana and selected rage/duration. Mastery cards and support ranks are gated behind evolution; focused-card offers include continued progression. Snapshot adds campaign/mana/rage fields; the HUD weapon buttons select rage and the manual control/SPACE activates it. Simulation freezes these clocks with existing pending/manual pause gates.

CampaignWorld retains and toggles display objects for three cached terrains; new ground uses512px generated repeating textures plus sparse procedural landmarks. Hidden forest foliage is skipped outside that map. New monsters/bosses use intact transparent whole-body images with movement-driven bob/lean; no generated limb segmentation. Enemy pose updates are culled outside an expanded camera rectangle while chase, status, attacks and death timing continue.

RageCombat owns24 reused images/one Graphics,16 meteor descriptors max, bounded target cooldowns and ephemeral beam segments. PetActor owns one image/one beam layer and one dash target. HostileAttacks owns one Graphics and caps24 zones/16 warned fans/128 bullets; segment distance provides swept collision and capsule checks. ForestScene routes damage through the existing immunity, crit, XP and boss-result paths. Generation guards stop hostile/elite callbacks after a reentrant result clears arrays; rage and base weapon loops stop immediately after a winning hit. Begin/home/results clear combat, pet, rage, hostile and elite visuals. Effects may finish the final celebratory hit after result as before.

Actor cap is difficulty-dependent150/280/480, including elites/final boss. Priority reservation retires the farthest ordinary actor; bosses/elites are protected. Camera-edge spawning remains unchanged.96 ordinary projectiles,240 pickups,130 particles,36 numbers and eight pooled rings remain bounded. Additional runtime artwork is399,102bytes and included in production precache; source PNGs/QA tools remain outside dist.
