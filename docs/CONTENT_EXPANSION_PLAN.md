# Content expansion: Dun, Frost and Returning Leaf

User selected new playable content after confirming mobile play works.

1. Domain and saves: five rank-6 weapons; Kang retains current stats/sword, Dun starts Frost with 85 HP, 9 base damage, 189 speed and 75 pickup radius. Persist selected hero with backward-compatible v1 defaults. Verify old saves, hero stats, legal cards and new weapon scaling.
2. Combat: Frost projectiles apply temporary non-stacking slow, with boss resistance. Returning Leaf pierces on its outward arc and returns to the moving player; each target can take one hit per flight. Reuse the bounded projectile pool. Verify status expiry, pause behavior, return steering and hit deduplication.
3. Characters: original generated Dun full-body portrait and whole-body walk frames; the first separated rig was rejected and replaced. Add a hero chooser at camp; block start/close during its save to prevent stale selection. Verify reload and both hero starts in browser.
4. Polish and verification: new icons/colors/SFX, readable five-weapon HUD, gallery for hero/weapon review, full bot run with each hero, lint/typecheck/tests/build and PWA precache verification. Review changes and document real evidence/limits.

No new map in this increment. No automatic commit, push or deployment.

Automated checks:45 tests across9 files, lint and TypeScript pass. Independent review found no Critical/Important issue. The original Dun rig review missed serious proportion/joint problems, subsequently reported by the user;13/14 are rejected historical evidence. The replacement is reviewed against the original portrait in20/21; Dun full engine run won at334.23s with588 kills, level11,1149 gold, then produced a natural standing defeat. Saw all five weapons, frost slow and leaf returning. The original expansion PWA build had54 precache entries; the animation repair replaces eight rejected runtime cutouts with one walk strip. Further UI and Kang observations are recorded in TESTING.md.

Kang also completed the expanded engine run:317.09s,580kills,level14,1128gold, then standing defeat. Hero selection survived browser reload and SW update, and Dun ran offline after the preview server was stopped. All four implementation slices are complete.
