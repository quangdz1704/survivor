# Weapon evolution implementation

Approved scope: three evolutions with distinct attacks, visuals and sound. Preserve current hero IDs/saves and the pending Golem explosion change. Local implementation; no automatic commit, push or deployment.

Completed locally: all four steps below.61 tests, lint, TypeScript/build, independent review,20 browser lifecycle checks and normal-profile evolution/victory runs passed. Evidence and device/balance limits are recorded in TESTING.md.

1. **Rules and cards** (`core/game.ts`, domain tests). Sword6+Haste2 → Kiếm trận; Frost6+Magnet2 → Bão tuyết; Leaf6+Speed2 → Lốc lá. Require selecting an eligible card on level-up, prioritize at least one available evolution, prevent duplicates/stale selections, retain XP overflow, and reset every run. Existing profiles stay unchanged. Verify gating, offer priority, cap/exhaustion and reset.
2. **Attacks** (`EvolutionCombat.ts`, `CombatSystem.ts`, `ReturningFlight.ts`, combat/motion tests). Four orbiting swords with per-target hit cooldown; persistent snowstorm with periodic area hits/slow; eight curved piercing leaves returning to the moving caster. Preserve bounded pools; cancel on reset; avoid duplicate damage. Verify FPS-independent flight, area bounds, hit cadence and base-weapon replacement.
3. **Player flow** (Progression, HUD, SkillIcon, recipe component, scene/bridge/audio). Visible recipes/progress, distinct evolution cards and evolved HUD names/badges; selection feedback and individual attack SFX. Verify real UI selection and that pause/reset/reduced effects work. Keep simulation outside React.
4. **Verification and record**. Run relevant tests, lint/typecheck/build, independent code review and actual browser galleries/UI. Record setup-injected QA separately from normal gameplay; document mechanics, balance and remaining phone/balance limits.
