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

Fast pursuit unit. Individually trivial, dangerous in swarms. Maintains ~100u engagement distance and fires energy pulses. Retreats automatically when it overruns the target.

| Stat | Value |
|---|---|
| HULL | 30 HP |
| ARMOR | 0% |
| SHIELD_MAX | 35 SP |
| SHIELD_REGEN | 20 SP/s |
| SHIELD_DELAY | 3.0s |
| SPEED | 120 u/s |
| ACCELERATION | 95 u/s² |
| COLLISION_RADIUS | 12px |
| XP Value | 3 |

**Weapon:** `pulse_laser` — ENERGY · 6 dmg/pulse · 2.0 shots/s · 380u range · **30° firing arc**
Drones can only fire when the target is within ±15° of their facing direction.
**Drops:** 8–16 credits
**Vulnerable:** KINETIC · EMP
**Immune:** —

---

### Attack Drone  `M` · CHASE · Tier 1

Heavier combat unit. Slower than the scout but harder to kill. Kinetic chaingun is more damaging per shot and fires in a stricter forward arc — it must face the target to engage.

| Stat | Value |
|---|---|
| HULL | 50 HP |
| ARMOR | 0% |
| SHIELD_MAX | 55 SP |
| SHIELD_REGEN | 15 SP/s |
| SHIELD_DELAY | 4.0s |
| SPEED | 85 u/s |
| ACCELERATION | 70 u/s² |
| COLLISION_RADIUS | 18px |
| XP Value | 6 |

**Weapon:** `chaingun` — KINETIC · 18 dmg/shot · 6.0 shots/s · 380u range · **25° firing arc**
**Drops:** 16–28 credits
**Vulnerable:** EMP · CORROSIVE
**Immune:** —

---

### Sector Turret  `S` · STATIC · Tier 1

Hardwired stationary defence platform. No shields — built entirely from reinforced armour plating. Fires a precision railgun burst. Does not pursue. EMP has no effect on its hardwired systems. The narrow 10° firing arc means it must be almost exactly facing the target to fire — but it always rotates to face the nearest player.

| Stat | Value |
|---|---|
| HULL | 80 HP |
| ARMOR | 6% |
| SHIELD_MAX | 0 |
| SPEED | 0 (stationary) |
| COLLISION_RADIUS | 22px |
| XP Value | 8 |

**Weapon:** `railgun` — KINETIC · high dmg/shot · slow rate · 1000u range · **10° firing arc**
Turret always faces nearest player — arc restriction exists but is effectively always met.
**Drops:** 24–40 credits
**Vulnerable:** EXPLOSIVE · KINETIC
**Immune:** EMP

---

## Quick Reference

| Enemy | Size | Tier | Behavior | HULL | ARMOR | SHIELD | Speed | Weapon | Arc | XP |
|---|---|---|---|---|---|---|---|---|---|---|
| Asteroid XL | XL | 1 | DRIFT | 500 | 0% | 0 | 8 | — | — | 10 |
| Asteroid Large | L | 1 | DRIFT | 200 | 0% | 0 | 12 | — | — | 6 |
| Asteroid Medium | M | 1 | DRIFT | 85 | 0% | 0 | 18 | — | — | 3 |
| Asteroid Small | S | 1 | DRIFT | 28 | 0% | 0 | 28 | — | — | 1 |
| Scout Drone | S | 1 | CHASE | 30 | 0% | 35 SP | 120 | pulse_laser | 30° | 3 |
| Attack Drone | M | 1 | CHASE | 50 | 0% | 55 SP | 85 | chaingun | 25° | 6 |
| Sector Turret | S | 1 | STATIC | 80 | 6% | 0 | — | railgun | 10° | 8 |
