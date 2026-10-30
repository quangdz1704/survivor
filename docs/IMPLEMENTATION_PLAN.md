# Survivor Mini — full game implementation

Visual style and player animation approved by user; user requested the next phases and animation for all enemies. The user subsequently authorized committing and pushing this project to `https://github.com/quangdz1704/survivor`. Production deployment remains outside current authorization.

1. [x] Domain foundations: typed run model, modular weapon configs, XP/upgrade selection, waves, rewards and permanent upgrades. Verify pure rule tests.
2. [x] Enemy art/animation: original Skeleton/Orc/Golem cutout rigs and separate bat wings. Preserve approved forest art. Build reusable animation actors with per-kind walk/hop/flap/hit/death; verify browser animation gallery.
3. [x] Complete playable run: 3 weapons, pooled entities, XP magnet/pickup, paused level selection, progressive 5-minute waves and telegraphed boss; victory/defeat. Verify full simulation and browser UI.
4. [x] Meta/audio/UI: IndexedDB versioned saves with validation/fallback, gold, shop, records, persisted settings; locally synthesized music/SFX after user gesture; results and settings. Verify reload, purchases, rewards and sound controls.
5. [x] PWA/performance: manifest/icons, precache assets, offline and update handling; quality controls, bounded effects, spatial queries and 150-enemy cap. Verify service worker cache list/build and production/offline browser checks where available.
6. [x] Final quality gate: lint, TypeScript, domain/storage/integration tests, production build, browser screenshots and honest testing report; update documentation and Vercel instructions.

Architecture: keep Phaser entity simulation outside React; React/Zustand receive snapshots at 10Hz and discrete typed events. Split domain, assets/actors, combat and persistence by responsibility. Progress should be saved atomically and a completed run rewarded at most once.

All implementation phases are present. Actual verification evidence and remaining physical-device limits are recorded in TESTING.md. Production deployment is outside current authorization.
