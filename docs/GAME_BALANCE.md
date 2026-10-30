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

Ordinary HP scales by `1 + max(0,time−60)/600`; speed by `1 + min(0.18,time/1800)`. Boss stays at base stats and gains 25% movement below 35% HP. A one-second fixed-location stomp telegraph precedes a 25 damage area hit, about radius 104; it respects contact invulnerability.

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
