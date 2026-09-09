# Enemies — Project Neon Fleet

**Tier 1 — 7 enemies.** The first sector. Primarily environmental hazards (asteroids) and basic automated drones.

---

## Design notes

Enemies share the same stat vocabulary as ships: HULL, ARMOR, SHIELD_MAX, SHIELD_REGEN, SHIELD_DELAY. Asteroids have zero shields. Drones have light shields that recharge quickly when not under fire, making sustained fire more effective than burst fire against them.

**Behavior types:**
- `DRIFT` — constant velocity in one direction, no active movement
- `STATIC` — stationary, never moves
- `CHASE` — actively pursues the nearest player ship

**Vulnerability / immunity** tags determine which weapon types and status effects are effective or useless against each enemy type.

**Breakdown** — when the enemy is destroyed it spawns child enemies. Used for the asteroid cascade.

---

## Asteroids

All asteroids: no shields, immune to EMP/FREEZE/BURN/BIOLOGICAL (no electronic systems or organic matter), vulnerable to EXPLOSIVE and KINETIC.

### Asteroid — XL  `XL` · DRIFT · Tier 1

The sector's primary hazard. Slow-moving, extremely durable. Breaking one releases two Large asteroids — leaving one alive long enough is risky.

| Stat | Value |
|---|---|
| HULL | 800 HP |
| ARMOR | 5% |
| SHIELD_MAX | 0 |
| SPEED | 35 u/s |
| COLLISION_RADIUS | 80px |
| XP Value | 10 |

**Drops:** 25–40 credits · debris (feeds Scrap Salvager)
**Breakdown:** → 2× Asteroid Large

---

### Asteroid — Large  `L` · DRIFT · Tier 1

A large fragment moving faster than its parent. Still takes multiple hits to destroy.

| Stat | Value |
|---|---|
| HULL | 320 HP |
| ARMOR | 5% |
| SHIELD_MAX | 0 |
| SPEED | 55 u/s |
| COLLISION_RADIUS | 50px |
| XP Value | 6 |

**Drops:** 10–18 credits · debris
**Breakdown:** → 2× Asteroid Medium

---

### Asteroid — Medium  `M` · DRIFT · Tier 1

A tumbling fragment. A few shots clear it. Still generates two small asteroids.

| Stat | Value |
|---|---|
| HULL | 110 HP |
| ARMOR | 0% |
| SHIELD_MAX | 0 |
| SPEED | 85 u/s |
| COLLISION_RADIUS | 30px |
| XP Value | 3 |

**Drops:** 4–8 credits
**Breakdown:** → 2× Asteroid Small

---

### Asteroid — Small  `S` · DRIFT · Tier 1

The final fragment. Fast, light, destroyed by a single hit from most weapons. No further breakdown.

| Stat | Value |
|---|---|
| HULL | 30 HP |
| ARMOR | 0% |
| SHIELD_MAX | 0 |
| SPEED | 130 u/s |
| COLLISION_RADIUS | 15px |
| XP Value | 1 |

**Drops:** 1–4 credits

---

**Cascade breakdown — one XL asteroid fully cleared:**
```
1× XL  →  2× L  →  4× M  →  8× S
Total: 15 enemies, 15× XP per chain + all credit drops
```

---

## Drones

Basic automated combat units. All drones have light shielding that recharges after a few seconds without taking damage — sustained fire is more effective than burst.

### Scout Drone  `S` · CHASE · Tier 1

Fast pursuit unit. Individually trivial, dangerous in swarms. Weak energy pulses — shield drops quickly under any sustained fire.

| Stat | Value |
|---|---|
| HULL | 75 HP |
| ARMOR | 0% |
| SHIELD_MAX | 50 SP |
| SHIELD_REGEN | 20 SP/s |
| SHIELD_DELAY | 3.0s |
| SPEED | 220 u/s |
| ACCELERATION | 180 u/s² |
| COLLISION_RADIUS | 12px |
| XP Value | 3 |

**Weapon:** ENERGY · 8 damage · 4.0 shots/s · 200u range
**Drops:** 5–10 credits
**Vulnerable:** KINETIC · EMP (disables shields and targeting)
**Immune:** —

---

### Attack Drone  `M` · CHASE · Tier 1

Standard combat unit. More durable than the scout, fires kinetic rounds that hit harder but slower. Light shielding — strip it with EMP or sustained fire, then armour takes over.

| Stat | Value |
|---|---|
| HULL | 150 HP |
| ARMOR | 5% |
| SHIELD_MAX | 80 SP |
| SHIELD_REGEN | 15 SP/s |
| SHIELD_DELAY | 4.0s |
| SPEED | 140 u/s |
| ACCELERATION | 100 u/s² |
| COLLISION_RADIUS | 18px |
| XP Value | 6 |

**Weapon:** KINETIC · 22 damage · 1.5 shots/s · 280u range
**Drops:** 10–20 credits
**Vulnerable:** EMP (disrupts weapon system) · CORROSIVE (strips 5% armor)
**Immune:** —

---

### Sector Turret  `S` · STATIC · Tier 1

A hardwired stationary defence platform. No shields — built entirely from reinforced armour plating. Fires a continuous energy beam. Does not move or pursue. EMP has no effect on its hardwired, non-networked systems.

| Stat | Value |
|---|---|
| HULL | 220 HP |
| ARMOR | 12% |
| SHIELD_MAX | 0 |
| SPEED | 0 (stationary) |
| COLLISION_RADIUS | 22px |
| XP Value | 8 |

**Weapon:** ENERGY · 25 DPS · continuous beam · 380u range
**Drops:** 18–30 credits
**Vulnerable:** EXPLOSIVE (structural) · KINETIC
**Immune:** EMP

---

## Quick Reference

| Enemy | Size | Tier | Behavior | HULL | ARMOR | SHIELD | Speed | XP |
|---|---|---|---|---|---|---|---|---|
| Asteroid XL | XL | 1 | DRIFT | 800 | 5% | 0 | 35 | 10 |
| Asteroid Large | L | 1 | DRIFT | 320 | 5% | 0 | 55 | 6 |
| Asteroid Medium | M | 1 | DRIFT | 110 | 0% | 0 | 85 | 3 |
| Asteroid Small | S | 1 | DRIFT | 30 | 0% | 0 | 130 | 1 |
| Scout Drone | S | 1 | CHASE | 75 | 0% | 50 SP | 220 | 3 |
| Attack Drone | M | 1 | CHASE | 150 | 5% | 80 SP | 140 | 6 |
| Sector Turret | S | 1 | STATIC | 220 | 12% | 0 | — | 8 |
