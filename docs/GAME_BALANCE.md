# Balance configuration

Source of truth: `src/core/game.ts`, `game/rules.ts`, `game/ForestScene.ts`. These are initial playable values, not a claim of broad player playtesting.

| Player parameter             |                          Value |
| ---------------------------- | -----------------------------: |
| Starting HP / base damage    |                       100 / 10 |
| Movement                     |                 180 world px/s |
| Critical chance / multiplier |                      5% / 1.5× |
| XP pickup radius             |                             60 |
| Contact invulnerability      |                          0.8 s |
| XP to next level             |         floor(20 × level^1.35) |
| Boss warning time            | 5:00, then 2.2 s spawn warning |
| Total active enemies         |                            150 |

| Enemy    |   HP | Contact |                Speed |  XP |
| -------- | ---: | ------: | -------------------: | --: |
| Slime    |   20 |       5 | 37, modulated by hop |   5 |
| Bat      |   12 |       4 |                   65 |   4 |
| Skeleton |   40 |       8 |                   56 |   8 |
| Orc      |  100 |      15 |                   34 |  18 |
| Golem    | 1500 |      25 |                   40 | 100 |

| Minute      | Composition                                | Spawn interval |
| ----------- | ------------------------------------------ | -------------: |
| 0–1         | Slime                                      |         1.05 s |
| 1–2         | Slime weighted 2:1 against Bat             |          0.8 s |
| 2–3         | Slime, Bat, Skeleton weighted 1:1:2        |         0.59 s |
| 3–4         | Slime, Bat, Skeleton, Orc                  |         0.43 s |
| 4–5         | Slime, Bat, Skeleton, Orc weighted 1:1:1:2 |         0.31 s |
| Boss active | Same last composition                      |          1.4 s |

Ordinary HP scales by `1 + max(0,time−60)/600`; speed by `1 + min(0.18,time/1800)`. Boss stays at base stats and gains 25% movement below 35% HP. A one-second fixed-location stomp telegraph precedes a 25 damage area hit, radius104, now shared by the fixed-size warning boundary and damage check; it respects contact invulnerability. The bomb-style visual does not change damage or cooldown.

## Weapons and upgrades

| Weapon at rank 1 | Damage | Cooldown | Range | Projectile speed |
| ---------------- | -----: | -------: | ----: | ---------------: |
| Sword            |     14 |   0.65 s |   270 |              440 |
| Fireball         |     24 |    1.8 s |   340 |              285 |
| Lightning        |     21 |    2.1 s |   330 |          instant |

Each weapon has 6 ranks. Damage multiplier per rank: `1 + (rank−1)×0.28`; cooldown multiplier `0.93^(rank−1) / attackSpeed`. Sword/Fireball gain a projectile at ranks 3/6; sword pierces 2 targets at rank 4. Fireball radius is 44 +9×rank, projectile speed grows 8% per extra rank. Lightning has 1 +floor(rank/2) targets and chains up to 165 distance from rank 4.

Passive caps: damage 5 (+10% base each), haste 5 (+15% each), speed 4 (+10% each), magnet 4 (+20% each), critical 5 (+5 percentage points each), health 5 (+20 maximum/current HP each). Health pickups can drop from kills. No maxed or duplicate cards.

Permanent upgrades cap at 10: health +15, damage +2, speed +3.5% each rank. Costs: floor(base ×1.65^currentRank), base 80/100/90 respectively. Gold: floor(0.5×seconds +1.5×kills +100 for victory).

The QA bot starts without permanent upgrades and can defeat the boss through ordinary movement/upgrade choices. Its accelerated simulation is a regression check, not proof that every build wins or that the difficulty suits all players.

## Version 1.1 content

Kang remains unchanged. Dun: 85 HP, base damage 9, speed 189, pickup 75; starts Frost rank1. Shared permanent bonuses apply to both heroes.

| Weapon rank1 |         Base damage on Kang | Interval | Range | Speed | Special                                     |
| ------------ | ------------------------: | -------: | ----: | ----: | ------------------------------------------- |
| Frost        | 11.5 before rounding/crit |    0.95s |   310 |   390 | 31.5% slow for1.4s                          |
| Leaf         | 16.5 before rounding/crit |    1.45s |   210 |   350 | Outward0.48s, returning flight,5-hit budget |

Frost: `1 + floor(rank/2)` shards, pierce2 at rank4, duration `1.4 + (rank−1)×0.16`, slow `0.3 + rank×0.015`. Slow does not stack; boss halves strength and shortens duration to70%. Leaf: `1 + floor(rank/3)` leaves, hit budget `4 + rank`; each target at most once per flight,2.2s maximum flight lifetime. Common damage/cooldown rank multipliers still apply to both. Five weapons can be combined; all content is open without a purchase. These values need human balance feedback.


## Weapon evolution / 1.2

| Evolution | Recipe | New behavior |
| --- | --- | --- |
| Kiếm trận | Sword6 + Haste2 | Four orbiting blades at86px. Contact within enemy radius+20. Damage = Sword6 damage×1.7; per-target immunity0.28s/attackSpeed. Replaces ordinary sword shots. |
| Bão tuyết | Frost6 + Magnet2 | Following158px area. Tick0.38s/attackSpeed, damage = Frost6 damage×1.25. Slow48% for1.8s; boss receives existing half-strength/70%-duration resistance. Replaces frost projectiles. |
| Lốc lá | Leaf6 + Speed2 | Eight leaves per volley,420px/s,300px activation range; damage = Leaf6×1.35, interval = Leaf6×0.85. Outward arc0.7s at2.8rad/s, then homes to moving caster;2.2s lifetime and ten-target pierce budget per leaf. Each target hit once per flight. |

All formulas use current stats, including the companion passive. Evolving keeps the passive bonus and costs one level-up choice. Area/contact checks include enemy radius. Sword-array immunity entries expire and are removed; recycled actors get a new enemy ID. The normal96-projectile pool bounds all returning leaves, with four extra reusable sword sprites and one aura Graphics for continuous evolutions. Reduced effects changes decoration, not hit logic. These values are a first balance pass pending physical-phone play feedback.


## Mid-run elites and relics /1.3

| Elite | Spawn | HP | Contact | Speed | XP | Special |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Slime vương |60s |340 |10 |48 |40 |90px fixed pulse,0.85s warning,12 damage;3s initial/4s subsequent cooldown |
| Đội trưởng Orc |180s |850 |18 |47 |80 |210px dash over0.5s,0.75s locked warning,18 damage;3s initial/4.5s subsequent cooldown |

Orc dash collision is a swept capsule with radius32.5+13=45.5px; warning uses the same91px width and circular caps. Attacks start only within290px. Contact and special damage share the player's existing0.8s immunity. Elites receive half-strength/70%-duration slow and light knockback. Their HP/speed are fixed, not wave-scaled. They share the150-enemy cap, with priority spawn reserving space by retiring a normal actor; elites/Golem cannot be evicted.

Relics are unique, chosen from three compatible unowned options, maximum2 per run. Root multiplies current damage by1.35 after1s without displacement; moving clears it. Rage multiplies attackSpeed by1.3 at<=40% maximum HP. Heart uses current damage×3 in a140px area (includes enemy radius); each collected heal pickup triggers once, even at full HP. Selecting Heart drops three8HP hearts80px around the player. Rime multiplies damage against an already-chilled target by1.25; Fang multiplies elite/Golem damage by1.4; these combine before critical rounding. Return multiplies only returning-leaf hits by1.5, keeping one-hit-per-target-per-flight immunity. Projectile damage otherwise retains its normal launch-time stats; continuous attacks use current stats.

These are initial tuning values. Three default-profile accelerated bot wins establish attainable builds and reward flow, not human difficulty or phone performance certification.

## Campaign expansion /2.0

`core/campaign.ts`, `equipment.ts`, `mastery.ts` and the scene are now the source of truth for these additions. Values below are initial balancing, not broad human playtesting.

| Difficulty | Enemy HP | Damage | Speed | Spawn interval | Group size | Actor cap | Reward |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Normal | ×1 | ×1 | ×1 | ×1 |1 |150 |×1 |
| Hard | ×1.6 | ×1.4 | ×1.12 | ×0.7 |2 |280 |×1.7 |
| Nightmare | ×2.7 | ×2 | ×1.22 | ×0.45 |4 |480 |×2.8 |

Map HP multiplier: forest1, ashlands1.15, glacier1.3. Ordinary wave HP/speed scaling still applies; boss HP is independent of elapsed time. New enemy base HP/contact/speed/XP: Ash Imp28/9/62/7; Ember Beetle145/20/30/20; Frost Wolf60/12/78/12; Ice Wisp32/10/48/7. Imp/Wisp launch warned ranged shots every3.3/4s; Wolf/Beetle periodically sprint×1.7. Ranged difficulty damage applies once. Bosses: Ember Drake2300HP/34contact/44speed/180XP; Frost Warden2900/38/36/220. Their base attack damage27–40 scales with difficulty. They cycle warned clusters, fans and400px lanes every3s; below40%HP cooldown1.65s and added hazards. Fans warn0.65s, clusters0.95s+, lanes1.1s. Golem alternates its existing stomp with9 stone shots and five58px blast circles; first attack remains the stomp. Global0.8s immunity prevents stacking simultaneous hazards. Hostile caps:24 zones,16 pending fans,128 projectiles, swept projectile collision; zones use the exact warned radius.

After evolution, the original Sword/Frost/Leaf may reach11. Sword/Frost add one support projectile per rank above6; evolved Leaf gains one leaf per rank (8 at6 through13 at11). Separate mastery cards give+15% evolution/support damage per rank, cap20, and+8% radius/range per rank, cap5. Base rank damage/cooldown calculations stay capped6. Blizzard's visuals expand with its actual range.

Mana cap100, +2 per ordinary kill/+10 elite or boss, passive+0.4/s outside rage. Rage consumes100 once, lasts6s, grants×1.5 damage/×1.35 attack speed and0.3s initial immunity; no mana gain while active. Timers freeze on pause/choices. Sword10 orbit blades; Fireball two targeted100px meteors every0.28s after0.45s travel; Lightning up to8 targets every0.32s; Frost255px pulse every0.6s plus65% slow with boss resistance; Leaf24 spiral leaves. All reset on result/home/new run.

Gear:6 slots/12 items, ranks1–20, bonus factor1+0.22×(rank−1). Initial six rare items are owned but unequipped. Craft300gold/15essence; upgrade50+40×rank gold and2+floor(rank/2) essence. Pet fox starts owned at1 but unselected; unlock other pets240gold/12essence, upgrade90+70×rank gold and4+rank essence, cap10. Fox gains2% crit/rank and dash bite; Owl8% pickup/rank plus slowing beam; Sprout5HP/rank plus heal3+2×rank every8s and a damage pulse. All pet damage scales with rank and player damage. Equipment bonuses apply to all weapons and preserve each hero's starting weapon.

Runs lasting60s or winning drop one item selected deterministically from the run ID. Already-owned drops grant5essence. Base essence=floor((time/20+kills/30+10 if victory)×reward multiplier). Gold uses the existing formula×difficulty reward. Settlement is idempotent by run ID. Win Normal unlocks the next map and the completed map's Hard; winning Hard unlocks its Nightmare.

## Current tuning /2.1 —2026-11-02

This section supersedes the historical values above. Source: `core/combatBalance.ts`, `campaign.ts`, `encounters.ts`, `game.ts`. The user requested meaningful collectible equipment, visible attacking pets and stronger late-game resistance.

| Evolution at unlock | Range | Damage/cadence | Growth |
| --- | ---: | --- | --- |
| Sword array |60px orbit, previously86 |Sword6×1.05, target immunity0.44s/attackSpeed (was×1.7/0.28s) |+12% damage/mastery, cap20; +12% range/mastery, cap5 (96px final orbit) |
| Blizzard |100px, previously158 |Frost6×0.7 every0.65s/attackSpeed (was×1.25/0.38s), slow32%/1.25s |Range reaches160px at5 area ranks; damage increases12% per power rank |
| Leaf vortex |180px activation,330px/s,4 leaves |Leaf6×0.9, interval×1.05 (was8 leaves/300px/420px/s/×1.35/×0.85) |Ranks7–11 add one leaf each; same12% damage/range mastery |

Rage lasts3s (was6); global damage×1.18/attack speed×1.12 (was1.5/1.35), at most2 activations per run. Ordinary kill gives0.15mana (was2), elite/boss4 (was10), passive0.1/s (was0.4). No gain while active or after the second use; pause/choice freezes time. A300s/600-kill simulation with two elites activates once; dense6000-kill simulation is capped at2, even if mana is manually refilled. This is a tuning target, not a guarantee every player earns a charge.

Ultimate base power is0.85×current damage×(1+0.18×weapon rank). Sword retains10 blades at72±22px with0.3s target immunity and×1.2 hit power. Leaf16 spiral leaves spread32–197px with the same immunity/power. Fireball one65px meteor every0.45s,×2.5 power. Lightning6 targets/0.48s,×1.8. Ice Age165px pulse/0.75s,×1.25 and45% slow/1.4s with boss resistance. Ice Age now renders wind/crystals and eight faceted ice spires; Blizzard wind/ice contrast increased while its damage area shrank.

| Boss | Old → new base HP | Old → new contact | New special damage |
| --- | ---: | ---: | --- |
| Slime King |340 →900 |10 →22 |28 pulse |
| Orc Captain |850 →2200 |18 →34 |42 dash |
| Golem |1500 →4200 |25 →38 |42 stomp /34 fan /44 clusters |
| Ember Drake |2300 →6200 |34 →48 |46 cluster /42 fan /54 lane |
| Frost Warden |2900 →7600 |38 →54 |48 cluster /40 fan /52 lane |

Hard now has×1.9HP/×1.55damage/×1.16speed; Nightmare×3.4/×2.3/×1.28. Normal values unchanged. Existing map HP factors, attack warnings and0.8s hit immunity remain. No faster/invisible boss telegraphs were introduced. Extra enraged cross-lane damage46 before difficulty scaling.

Equipment: new profiles own only the gifted Dawnblade1 and start with Fox1 selected. Existing saved equipment ranks/selections are preserved (an explicit old pet-null stays unselected; the menu now links directly to companion selection). Unowned gear cannot be crafted/upgraded; obtain it from the camp draw, a mini-boss bag or the existing60s/completion reward. Draw costs200 in-game gold:75% rare/25% epic, uniform within each tier. Owned duplicates give5essence without lowering level. Draw payment checks the latest queued profile and reuses its RNG sample if storage falls back/retries. No real money is used.

Each of the two mini-bosses drops a separate equipment bag beside its relic chest. Two reserved sprite/text slots avoid XP-pool eviction. Drop positions clamp to reachable player bounds; walking within38px collects it. Gear is added to the permanent collection at result settlement, including defeat; abandoning the run still forfeits its pending rewards. Result settlement combines up to2 collected pieces and the completion piece once per run ID. Item bonuses take effect when equipped in the profile and apply from the next run.
