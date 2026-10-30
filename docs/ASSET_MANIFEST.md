# Asset manifest

## Research and selection

Research performed 2026-10-30. Kenney Tiny Dungeon: https://kenney.nl/assets/tiny-dungeon and https://kenney-assets.itch.io/tiny-dungeon — primary provider identifies CC0, commercial use allowed, attribution not required. Rejected because its pixel art conflicts with the requested HD cartoon style. itch.io CC0 top-down catalog https://itch.io/game-assets/assets-cc0/free/tag-top-down was also examined; no downloaded third-party art is included.

## Included assets

| Name                             | Category            | Source/method                           | Provider/author                          | License/status                                           | Commercial/attribution                                                                                       | Local path                                                                     |
| -------------------------------- | ------------------- | --------------------------------------- | ---------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| An, forest adventurer            | Player + menu hero  | Built-in image generation, atlas cell 0 | OpenAI image generation for this project | Generated output; not claimed CC0 or exclusive copyright | No third-party asset license attached; use subject to applicable OpenAI terms; no asset attribution required | `public/assets/forest-atlas.webp`; menu cutout `public/assets/adventurer.webp` |
| Leaf slime                       | Enemy, cell 1       | Same original generated atlas           | Same                                     | Same                                                     | Same                                                                                                         | Same                                                                           |
| Plum bat                         | Enemy, cell 2       | Same original generated atlas           | Same                                     | Same                                                     | Same                                                                                                         | Same                                                                           |
| Broadleaf tree                   | Environment, cell 3 | Same original generated atlas           | Same                                     | Same                                                     | Same                                                                                                         | Same                                                                           |
| Moss rune arch                   | Environment, cell 4 | Same original generated atlas           | Same                                     | Same                                                     | Same                                                                                                         | Same                                                                           |
| Flower/mushroom bush             | Environment, cell 5 | Same original generated atlas           | Same                                     | Same                                                     | Same                                                                                                         | Same                                                                           |
| Terrain/path/grass/rocks/flowers | Map                 | Original seeded Phaser Graphics code    | Project code authored in session         | Project source, no external artwork                      | No third-party asset attribution required                                                                    | `src/game/ForestMap.ts`                                                        |
| Magic sword/effects              | Weapon and combat   | Original Phaser Graphics, tweens        | Project code authored in session         | Same                                                     | Same                                                                                                         | `src/game/CombatSystem.ts`, `src/game/Effects.ts`                              |
| UI icons                         | Interface           | npm `lucide-react`                      | Lucide contributors                      | ISC; retain included license                             | Commercial allowed, preserve copyright/license notice                                                        | `node_modules/lucide-react/LICENSE`, `docs/LICENSES/lucide-react.txt`          |
| App favicon                      | Interface           | Original SVG                            | Project code authored in session         | No third-party artwork                                   | No third-party attribution                                                                                   | `public/favicon.svg`                                                           |
| Fonts                            | Interface           | Installed system font stack             | Platform font vendors                    | System fonts only, no redistributed font files           | No bundled font license needed                                                                               | `src/style.css`                                                                |

## Generation record

Built-in tool, not CLI/API fallback. First generation produced a 1536×1024 six-cell atlas. A background extraction edit produced the final transparent source. Alpha channel inspected with Sharp: transparent pixels present. An opaque green composite was inspected for edge cleanliness. Raw transparent generated source is retained at `docs/artwork/forest-atlas-source.png`. Runtime atlas is encoded as WebP (479KB); source PNGs remain under docs/artwork and are not shipped. The menu uses a dedicated cropped hero WebP. Technical slicing/padding is reproducible with `node scripts/prepare-assets.mjs`; regions are recorded in `docs/ATLAS_REGIONS.json`. No artwork was substituted with basic geometric character placeholders.

### Prompt 1

“Use case: stylized-concept. Asset type: production 2D mobile fantasy game sprite atlas, transparent PNG. Make ONE atlas with exactly 6 isolated assets in a strict 3-column by 2-row grid, each centered inside its cell with ample transparent padding, no overlap. Top row: (1) full body adorable young forest adventurer, huge expressive head, tousled chestnut hair, teal pointed hood lowered behind head, orange scarf, teal tunic, brown boots, small silver sword, facing three-quarter front; (2) friendly hostile lime green slime monster with amber eyes, glossy body, leaf on head; (3) little plum-purple bat monster with large ears and wings spread, amber eyes. Bottom row: (4) lush rounded emerald broadleaf tree with visible brown trunk; (5) small moss-covered broken stone arch ruin with tiny glowing turquoise rune; (6) lush bush cluster with cream flowers and little amber mushrooms. Premium-quality 2D cartoon fantasy mobile game assets, polished casual game illustration, three-quarter top-down perspective, vibrant harmonious colors, smooth clean dark teal outlines, soft shadows, detailed but readable silhouettes, professional HD mobile game artwork, consistent upper-left warm lighting. Clean hand-painted flat cartoon shading, not 3D renders, no pixel art. True transparent background, no ground planes except tiny soft contact shadows, no text, no watermark. All six items must be separated completely and equally spaced.”

### Prompt 2

“Remove the entire colored background from this game asset atlas. Produce actual alpha transparency, not dark background and not a checkerboard drawing. Preserve all six assets exactly, preserving the exact 1536x1024 canvas, exact positions, proportions, appearance and grid cells. The player, slime, bat, tree, ruin and bush should all be clean isolated cutouts on a 100% transparent canvas. Remove background glows and ground from around them. This is a technical background-extraction edit for a game sprite sheet. Do not add or redraw any content, no text.”

## Limitations

Generated artwork may not carry exclusive copyright protection. No claim is made that generated output is CC0. Character animation uses original cutout layers; there is no back-facing player sheet. Sound is synthesized locally rather than sourced from an audio pack.

## Animation revision: original cutout rig

New generated source: `docs/artwork/adventurer-rig-source.png`. Eight game-ready layer files under `public/assets/player/`: `head.webp`, `torso.webp`, `sword-arm.webp`, `free-arm.webp`, `leg-left.webp`, `leg-right.webp`, `scarf-tail.webp`, `scarf-collar.webp`. Provider: built-in OpenAI image generation, based on the project's original An reference. Same generated-output status and attribution notes as the original atlas; not claimed CC0 or exclusive copyright. Source retained, commercially usable only subject to applicable provider terms. No third-party character art added.

Technical extraction: `node scripts/prepare-player-rig.mjs` identifies eight alpha-connected components, preserves each component's pixels and exports individual WebP textures. Bounding regions recorded in `docs/PLAYER_RIG_REGIONS.json`. Runtime `PlayerActor` supplies joint animation; these images are layers, not AI-generated successive animation frames.

Prompt used (built-in tool; reference `docs/artwork/adventurer-reference.png`):

“Use case: precise-object-edit. Asset type: animation-ready cutout character rig sheet for a 2D game. Reference image: the established character An, preserve his chestnut hair, cute face, teal hood and tunic, orange scarf, leather belt, gloves and brown boots, silver sword, clean illustrated HD cartoon style. Primary request: decompose this exact character into EIGHT isolated complete overlapping body parts in a strict FOUR columns by TWO rows grid on a 1536x1024 canvas (each cell384x512). Each part fully contained and centered with transparent padding. Row 1 left to right: (1) complete big head, face, hair and teal hood, with tiny neck stub, no torso; (2) complete torso wearing teal tunic and belt, include under-tunic pelvis, shoulder stubs but NO head arms legs scarf; (3) complete sword arm from rounded shoulder through cream sleeve and brown glove holding original sword pointing diagonally upward, isolated; (4) complete other arm from rounded shoulder through cream sleeve to brown gloved hand, arm relaxed downward, isolated. Row 2: (5) one whole leg from rounded hip joint through olive trouser to brown boot, left leg; (6) matching whole right leg including boot; (7) orange flowing scarf tail alone, fabric stretching horizontally to the right with folds, wide at attachment left, no body; (8) orange scarf collar alone, curved wrap around neck, no face, torso or tail. These are real game rig layers, NOT eight complete characters, NOT animation poses. Extrapolate hidden anatomy slightly at joints so rotation leaves no holes. Consistent upper-left light, three-quarter front view, thick smooth dark outlines and original proportions. True transparent alpha background, absolutely no colored backgrounds, no shadow backdrop, no labels, no text, no checkerboard drawing, no extra objects. Do not change outfit design or switch to pixel art or 3D.”

## Enemy animation expansion — 2026-10-30

| Asset                           | Retained generated source              | Runtime layers                                                                           |
| ------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| Skeleton, six-part rig          | `docs/artwork/skeleton-rig-source.png` | `public/assets/enemies/skeleton/{head,torso,arm-left,arm-right,leg-left,leg-right}.webp` |
| Orc, six-part rig               | `docs/artwork/orc-rig-source.png`      | Same six names under `enemies/orc/`                                                      |
| Golem, six-part rig             | `docs/artwork/golem-rig-source.png`    | Same six names under `enemies/golem/`                                                    |
| Bat, independently hinged wings | `docs/artwork/bat-rig-source.png`      | `public/assets/enemies/bat/{body,wing-left,wing-right}.webp`                             |

Provider/method: built-in OpenAI image generation, original sheets made for this project, actual transparent alpha. Same generated-output status as An: not claimed CC0 or exclusive copyright, subject to applicable provider terms, no downloaded third-party character artwork.

Generation specification: preserve the approved premium HD fantasy cartoon style, three-quarter front perspective, warm upper-left lighting, dark smooth outlines and isolated overlapping joint anatomy on transparent background. Skeleton: expressive skull, worn hood, teal/earth clothing, curved blade. Orc: compact olive-green warrior with leather armor, large head and wooden spiked club. Golem: larger mossy stone guardian with turquoise rune and eyes, planted stone legs and substantial hands. Humanoids have exactly six isolated complete parts: head, torso, two arms, two legs. Bat uses the approved plum/amber identity with body and two separate wings. These notes record the design specifications, not a claim that the files contain animation frames.

Reproduction: `node scripts/prepare-enemy-rigs.mjs`, alpha component regions in `docs/ENEMY_RIG_REGIONS.json`. 21 enemy layer WebPs; runtime `EnemyActor.ts` animates joints, shadows and silhouettes. Slime reuses atlas cell1 with hopping/squash, hit flash and fading fall.

## Audio and PWA icons

Menu/game music motifs and button/weapon/hit/death/XP/level/damage/boss/victory/defeat sounds are original synthesis code in `src/audio/AudioManager.ts` using Web Audio oscillators and envelopes. No sampled songs, downloaded audio files, external audio packs or attribution-bearing recordings are bundled.

PWA icons192/512/maskable derive from this project's generated An cutout with original pine backgrounds. Paths: `public/icons/`. Same generated-art status as the source hero. No external font files are shipped. Sources and QA images in docs are not runtime dependencies and are excluded from dist.

## Linh — original frost mage (version1.1)

Built-in OpenAI image generation produced one transparent nine-part sheet retained at `docs/artwork/linh-rig-source.png`. Nine connected cutouts: assembled full-body portrait, head, torso, wand arm, free arm, two legs, scarf tail, scarf collar. Ivory bob hair, amber eyes, violet/cream tunic and hood, icy-cyan scarf and a short crystal wand; same three-quarter illustration and warm upper-left lighting as An. No downloaded third-party art or audio.

Technical extraction: `node scripts/prepare-player-rig.mjs linh`. Regions: `docs/LINH_RIG_REGIONS.json`. Portrait: `public/assets/linh.webp`; the separated animation layers were rejected by the user and removed from runtime. This source and its region record are retained as design history. `prepare-player-rig.mjs linh` now extracts only the intact portrait. Same generated-output status as existing artwork: not claimed CC0/exclusive copyright, use subject to applicable provider terms. The portrait is cached by PWA. Prompt record: `docs/artwork/linh-generation-prompt.txt`.

Băng tinh and Lá xoáy projectile silhouettes are original Phaser Graphics code in CombatSystem, consistent with existing magical effects; UI icons Snowflake/Leaf reuse Lucide with its retained ISC notice. Frost/Leaf SFX are original local Web Audio synthesis.


### Linh animation repair

Built-in `image_gen` using the intact Linh portrait as the identity/proportion reference. Selected transparent sheet: `docs/artwork/linh-walk-source-v2.png`; exact prompt, selection and method: `docs/artwork/linh-animation-prompt-v2.txt`. The first and third generated drafts were rejected for repeating the same leading leg. From the selected six-pose sheet, only the first four complementary contact/passing poses are used. The last two repeat a leading leg and are excluded.

`node scripts/prepare-linh-animation.mjs` extracts complete cells, aligns boot soles through translation, and downsamples each entire frame uniformly to256×256. No limb edits, independent resizing or joint compositing. Runtime strip: `public/assets/player/linh-walk.webp`; slicing/baseline record: `docs/LINH_ANIMATION_REGIONS.json`. Idle uses the unchanged original `public/assets/linh.webp`. Same generated-art status/provider terms as the original; not claimed CC0 or exclusive copyright. Four poses are a compact stylized cycle, not a claim of eight-direction or high-frame-count animation.


## Golem bomb-style attack

Original procedural Phaser Graphics in `src/game/GolemBlast.ts`: fire/flash, pressure rings, dust, smoke and stone fragments. No downloaded or generated bitmap asset is added. Original local Web Audio explosion synthesis is in `src/audio/AudioManager.ts`; no audio sample license or runtime network dependency. Same source-code asset status as the existing procedural magic effects.


## Weapon evolution effects

Orbit blades and curved leaves reuse the project's procedural CombatSystem textures. Snowstorm ice/wind and orbit trails are original Phaser Graphics in EvolutionCombat, with no external raster assets. HUD/card icons Orbit, CloudSnow and Tornado come from the existing Lucide ISC dependency with its retained license. Evolution/attack sounds are original local Web Audio synthesis. No additional dependency or runtime network request.


## Elite treasure /1.3

Slime vương and Orc captain reuse local enemy textures with whole-body scaling; crowns, warning regions, chest shapes and sparkle are original procedural Graphics in EliteEncounters.ts. Relic/treasure icons use the existing Lucide ISC dependency (TreePine, Gem, HeartPulse, Snowflake, Wind, Skull, PackageOpen, Crown). Treasure chime uses original local Web Audio synthesis. No new external image/audio file, dependency or runtime download.


### Blizzard visual repair

Original procedural wind ribbons, frost accents, snow streaks and faceted ice in `src/game/BlizzardVisual.ts`; no added texture, image download or dependency. The snow-vortex glyph in SkillIcon.tsx is original inline SVG replacing the Lucide CloudSnow mapping. Existing Lucide icons remain used elsewhere under their retained license. Native browser screenshots/animation38–40 are QA evidence, not generated concept art.

## Campaign expansion /2026-10-30

11 original AI-generated runtime WebPs under `public/assets/expansion/`: ashlands/glacier512² opaque tiles; ash-imp/ember-beetle/frost-wolf/ice-wisp and fox/owl/sprout256² transparent whole bodies; ember-drake/frost-warden384² transparent bosses. Total399,102bytes. Exact prompts, retained source PNGs and processing/provenance notes: `docs/artwork/expansion/{prompts.json,README.md,sources/}`. Contact sheet visually inspected. No third-party character or segmented anatomical assembly. Gear uses existing Lucide SVG vocabulary rather than raster art. Runtime art is precached; source images are excluded from dist.
