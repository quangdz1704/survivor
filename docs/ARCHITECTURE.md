# Architecture

## Boundaries

| Module                                     | Responsibility                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `core/game.ts`                             | Pure typed domain: run/stats, XP, legal upgrades, weapon configs, wave director inputs, reward/shop/settlement |
| `core/profile.ts`                          | IndexedDB v 1 `state/profile`, validation, atomic queued read/modify/write, memory fallback                    |
| `game/ForestScene.ts`                      | Run lifecycle, movement, steering/contact, wave spawning, boss telegraph, snapshots                            |
| `game/ForestMap.ts`                        | Seeded terrain/decorations and composed opening clearing                                                       |
| `game/PlayerActor.ts`, `PlayerMotion.ts`   | An layered joints, Linh whole-body frames and exact exponential acceleration/displacement                           |
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

Profile v1 now includes `hero: "an" | "linh"`. Validation defaults missing/unknown values to An while preserving old gold/settings/upgrades/records; no destructive IDB version reset. The chooser writes only hero inside the same queued transaction mechanism and blocks its close/confirm/cards until save returns. RunModel chooses initialWeapons and base stats from HEROES; temporary ranks never leak across runs. PlayerActor retains An’s approved rig. Linh uses the original whole-body idle portrait and a four-pose painted walk strip, with uniform scale, shared sole baseline and distance-driven frame advancement; her artwork faces right before mirroring. No Linh limb is scaled independently.
