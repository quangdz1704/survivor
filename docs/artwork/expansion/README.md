# Expansion artwork

Eleven original raster assets generated individually with the built-in OpenAI `image_gen` tool on 2026-10-30. No CLI/API fallback, stock assets, or third-party character references were used. Existing Survivor Mini artwork was visually inspected for the painted cartoon style; generation prompts describe that style in text. No existing runtime asset was overwritten.

`prompts.json` records every exact generation prompt, original generated location, retained source, runtime path, dimensions, alpha validation, and processing settings. Full generated PNGs remain in `sources/`; runtime WebP copies are under `public/assets/expansion/`. Sources retain original generation provenance metadata. These are AI-generated project assets; this record makes no claim of exclusive copyright.

- Ground: `ashlands`, `glacier`, 512 × 512 opaque low-contrast repeating tiles.
- Enemies: `ash-imp`, `ember-beetle`, `frost-wolf`, `ice-wisp`, 256 × 256 with genuine transparency.
- Bosses: `ember-drake`, `frost-warden`, 384 × 384 with genuine transparency.
- Companions: `fox`, `owl`, `sprout`, 256 × 256 with genuine transparency.

Sprites preserve whole-body anatomy. Alpha trimming removes empty margins; uniform aspect-preserving resizing and 12px transparent outer padding produce centered runtime squares. No body-part segmentation or synthetic pose assembly was applied. WebP quality 90, alpha quality 100. The ground tiles use only uniform downsampling.

All generated outputs and the final `contact-sheet.png` were visually inspected. Alpha was checked from decoded pixels, and each ground was viewed in a repeated 2 × 2 arrangement. Runtime files total 399,102 bytes. Gameplay animation, on-map scale, hitboxes, boss attacks, and companion behavior belong to the application integration and are not validated by this artwork-only task.
