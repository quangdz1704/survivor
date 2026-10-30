# Art style — approved direction

## Identity

A small guardian exploring an ancient, welcoming forest. Chibi adventurer Kang wears teal with an amber-orange scarf. Enemy silhouettes remain cute but readable: lime leaf slime and plum bat. Illustrated HD cartoon with clean dark outlines, warm highlights and three-quarter top-down viewpoint. No pixel art, existing copyrighted game characters or emoji sprites.

## Palette

- Deep pine `#173e34`: panels and outlines.
- Forest grass `#629c64`: arena floor.
- Warm cream `#fff4d5`: main copy.
- Honey gold `#f4c46c`: primary action, decorative sparks.
- Coral peach `#db8070` → `#ffc3a0`: health.
- Plum: bat silhouette.

## UI tokens

14px action radius, 22px modal radius, 44px minimum icon target. Georgia display title + local Trebuchet/Arial body fonts. Warm beveled action buttons, thin low-contrast gold borders, restrained shadows. Vietnamese text. Play and pause take priority. Phone stage 390×844 reference, responsive to viewport and safe areas.

## Animation

Menu breathing and sparks through CSS. Kang uses eight separate illustrated layers: head, torso, sword arm, free arm, two legs, scarf tail and collar. Legs step alternately from actual travel distance with inverse arm swing; torso bounce stays under 1.4px and head counters torso rotation. Scarf rotation follows with a delay. No whole-player texture stretching. Damage feedback is a brief tint with a mild invulnerability pulse; death folds the body and fades. Horizontal facing still uses mirroring; back-facing art remains pending. Slime uses squash-hop timed to ground movement. Bat has separate wing pivots. Skeleton, Orc and Golem use six-part rigs with distance-driven stride and opposite arm swing; Golem lifts both arms before a stomp. All enemies flash on hit and tilt/fade on death. Reduced effects disables particles/shake; CSS honors prefers-reduced-motion.

## Approval

The user approved the visual/player-motion direction and requested full development plus enemy animation. Preserve palette, silhouettes and lighting across new artwork. Player movement works in all directions, with horizontal sprite mirroring; a distinct back-facing sheet is not included.

## Control revision

Following user feedback, use a floating joystick at the initial touch location anywhere in the play surface; hide it when idle. Keep HUD buttons above the touch surface.

## Dun / version1.1

Second playable silhouette: ivory bob, violet hood and tunic, icy-cyan scarf and compact crystal wand. The first cutout assembly was rejected by the user: head too large, legs too short, and visible neck/shoulder joints. Dun now uses the exact intact portrait at rest and four whole-body painted contact/passing poses while moving. Both legs alternate; only uniform whole-frame scaling and baseline translation are allowed. Do not reuse Kang’s joint measurements for Dun. Kang retains his approved artwork. Frost uses cool cyan faceted shards, chilled enemies get a light blue tint. Leaf uses a green/gold organic projectile spinning out and home. Both remain readable against forest grass and reuse the bounded effects budget. Hero chooser uses illustrated portraits and gold selected borders, with no additional map or art style introduced.


## Golem blast

Replace the small generic burst/ring with an original procedural cartoon explosion: short cream star flash, merged orange fire lobes, expanding gold pressure wave, low dust skirt, fourteen rotating stone fragments with gravity, and warm smoke fading over1.15s. Keep the warning fixed at the actual104px hit radius for its full one-second charge. Reduced effects keeps the warning and a brief impact outline, without fire, debris, smoke or camera shake. The flash stays local to the blast rather than covering the whole screen.


## Evolution effects

Kiếm trận: four full-sized cream/gold blades, faint gold orbit trails. Bão tuyết: a translucent icy-cyan158px area, drifting ice glints and rotating wind segments; keep the hero and enemies readable. Lốc lá: eight green/gold leaves following curved outward arcs and homing back, with a small rotating leaf-wind mark around the caster. Activation uses a gold ring/chime. Evolved cards get a restrained gold background/border; HUD uses dedicated Orbit/CloudSnow/Tornado icons and a✦ badge. Reduced effects retains functional blades/leaves and a faint snowstorm range boundary while omitting decorative trails/snow. No new bitmap character art is introduced.


## Elite treasure /1.3

Reuse Slime/Orc artwork with uniform1.5/1.3 body scaling, a small procedural gold crown and warm HP bar. Do not change individual joint proportions. Fixed pale-gold/orange pulse and full-width capsule warnings remain visible with reduced effects. Chests use warm wood, a gold lid/clasp and restrained sparkle; the HUD gold arrow remains readable when loot is offscreen. Three treasure cards follow the existing green/gold forest panels, readable effect descriptions and smaller synergy hints. Relic icons use pale green, red, pink, ice blue and gold; conditional effects light their HUD border. Native browser evidence is retained, not generated previews.


## Blizzard visual repair after user feedback

Replace the hard cyan circle and cross/triangle snow symbols with a cool ground haze, broken frost accents at158px, four tapered wind ribbons, drifting snow streaks and small two-face ice crystals. Ground and airborne details use separate depths; the center stays open for the hero silhouette. Wind follows gently uneven paths with a soft outer stroke and a brighter narrow core. All animation uses simulation time, including a0.4s entrance. Reduced effects keeps the ground/range accents and9 small snow streaks, omitting the ribbons and crystals. The HUD/card icon is an original SVG snowflake inside two swirling arrows. Browser captures38/39 show the implemented replacement; aesthetic acceptance remains the user's decision.
