# Ship Frames — Project Neon Fleet

9 ship chassis across 3 weight classes. Each ship has raw base stats, two tag layers, unique special tags, and class synergy ratings.

**Two tag layers:**
- **Hardware Tags** — tag counts pre-loaded into the TagAggregator at loadout (affect keystone prerequisites)
- **Tag Weighting** — draft bias weights (1 low → 5 core); these tags appear more frequently in upgrade card drafts

**Stat units:** HULL/SHIELD in points · ARMOR in % reduction · speeds in units/s or °/s · SHIELD_DELAY in seconds (lower = faster regen) · HEAT_DISSIPATION in heat/s · REPAIR_RATE in HP/s

**Synergy ratings:** S = exceptional · A = good · B = workable · C = poor

---

## Light Class

### Sidewinder — The Agile Scout
*Role: Pure evasion and speed. Glass cannon. Best paired with phase/dodge-oriented classes.*

| Stat | Value |
|---|---|
| HULL | 900 HP |
| ARMOR | 3% |
| SHIELD_MAX | 800 SP |
| SHIELD_REGEN | 120 SP/s |
| SHIELD_DELAY | 4.0s |
| TOP_SPEED | 580 u/s |
| ACCELERATION | 560 u/s² |
| TURN_SPEED | 340 °/s |
| EVASION | 15% |
| MASS | 1 |
| SLOT_SMALL | 3 |
| SLOT_MEDIUM | 1 |
| SLOT_LARGE | 0 |
| SLOT_XL | 0 |
| CARGO_CAPACITY | 60 |
| HEAT_DISSIPATION | 28 h/s |
| ENERGY_GRID | 120 |
| REPAIR_RATE | 8 HP/s |

**Hardware Tags:** EVASION×2 · TOP_SPEED×2 · TURN_SPEED×2

**Tag Weighting:**
```
EVASION      5  (core)
TOP_SPEED    5  (core)
TURN_SPEED   4
ACCELERATION 4
PHASE        3
BLINK        3
SHIELD_REGEN 2
SHIELD_DELAY 2
```

**Special Tags:** `PHASE` — innate dimensional shift affinity; unlocks phase-based upgrade paths earlier

**Class Synergies**

| Class | Rating |
|---|---|
| Phase Weaver | S |
| Chrono Architect | S |
| Resonance Bard | S |
| Vector Specialist | S |
| Graviton Weaver | A |
| Quantum Entangler | A |
| Nanite Swarm Controller | B |
| Hyper-Conductor | C |
| Scrap Salvager | C |

---

### Cobra — The Multi-Role Speedster
*Role: Balanced all-rounder. No hard weaknesses. Fits any class comfortably.*

| Stat | Value |
|---|---|
| HULL | 1,200 HP |
| ARMOR | 6% |
| SHIELD_MAX | 1,100 SP |
| SHIELD_REGEN | 130 SP/s |
| SHIELD_DELAY | 2.5s |
| TOP_SPEED | 490 u/s |
| ACCELERATION | 450 u/s² |
| TURN_SPEED | 260 °/s |
| EVASION | 8% |
| MASS | 2 |
| SLOT_SMALL | 2 |
| SLOT_MEDIUM | 2 |
| SLOT_LARGE | 1 |
| SLOT_XL | 0 |
| CARGO_CAPACITY | 90 |
| HEAT_DISSIPATION | 24 h/s |
| ENERGY_GRID | 180 |
| REPAIR_RATE | 14 HP/s |

**Hardware Tags:** SHIELD_MAX×2 · TOP_SPEED×1 · SLOT_MEDIUM×1

**Tag Weighting:**
```
SHIELD_MAX   4  (core)
SHIELD_REGEN 3
TOP_SPEED    3
ACCELERATION 3
TURN_SPEED   3
ENERGY_GRID  2
HULL         2
EVASION      2
```

**Special Tags:** `ADAPTIVE_LOADOUT` — no slot-type restrictions on module placement

**Class Synergies**

| Class | Rating |
|---|---|
| Chrono Architect | A |
| Quantum Entangler | A |
| Hyper-Conductor | A |
| Phase Weaver | A |
| Resonance Bard | A |
| Vector Specialist | A |
| Graviton Weaver | B |
| Nanite Swarm Controller | B |
| Scrap Salvager | B |

---

### Mamba — The Dragster Interceptor
*Role: Fastest ship in the game. Heat-optimised forward runner. Terrible turning radius.*

| Stat | Value |
|---|---|
| HULL | 850 HP |
| ARMOR | 3% |
| SHIELD_MAX | 600 SP |
| SHIELD_REGEN | 90 SP/s |
| SHIELD_DELAY | 5.0s |
| TOP_SPEED | 620 u/s |
| ACCELERATION | 600 u/s² |
| TURN_SPEED | 130 °/s |
| EVASION | 6% |
| MASS | 2 |
| SLOT_SMALL | 2 |
| SLOT_MEDIUM | 2 |
| SLOT_LARGE | 1 |
| SLOT_XL | 0 |
| CARGO_CAPACITY | 60 |
| HEAT_DISSIPATION | 55 h/s |
| ENERGY_GRID | 260 |
| REPAIR_RATE | 6 HP/s |

**Hardware Tags:** HEAT_DISSIPATION×3 · TOP_SPEED×2 · RESOURCE_FEED×1

**Tag Weighting:**
```
TOP_SPEED        5  (core)
ACCELERATION     5  (core)
HEAT_DISSIPATION 5  (core)
ENERGY_GRID      4
HEAT_GEN         3
RESOURCE_FEED    3
VOLTAGE          2
ON_OVERHEAT      2
```

**Special Tags:** `HEAT_VENTING` — automatically purges heat at 80% threshold, triggering a speed burst

**Class Synergies**

| Class | Rating |
|---|---|
| Resonance Bard | S |
| Hyper-Conductor | A |
| Phase Weaver | A |
| Vector Specialist | A |
| Chrono Architect | B |
| Quantum Entangler | B |
| Graviton Weaver | B |
| Nanite Swarm Controller | C |
| Scrap Salvager | C |

---

## Medium Class

### Krait — The Strike Carrier
*Role: Drone platform. Dedicated drone bays give it unique construct capacity no other ship has.*

| Stat | Value |
|---|---|
| HULL | 2,500 HP |
| ARMOR | 12% |
| SHIELD_MAX | 1,400 SP |
| SHIELD_REGEN | 110 SP/s |
| SHIELD_DELAY | 2.0s |
| TOP_SPEED | 380 u/s |
| ACCELERATION | 300 u/s² |
| TURN_SPEED | 170 °/s |
| EVASION | 3% |
| MASS | 5 |
| SLOT_SMALL | 2 |
| SLOT_MEDIUM | 2 |
| SLOT_LARGE | 1 |
| SLOT_XL | 0 |
| **DRONE_BAYS** | **2** |
| CARGO_CAPACITY | 110 |
| HEAT_DISSIPATION | 22 h/s |
| ENERGY_GRID | 200 |
| REPAIR_RATE | 18 HP/s |

**Hardware Tags:** DRONE_COUNT×3 · DRONE_SPEED×1

**Tag Weighting:**
```
DRONE_COUNT      5  (core)
DRONE_DAMAGE     4
DRONE_SPEED      4
DRONE_HULL       3
RESPAWN_RATE     3
REPAIR_SWARM     2
NANITE           2
TARGETING_BEACON 2
```

**Special Tags:** `DRONE_COMMAND` — dedicated drone hardpoints that do not consume standard weapon slots

**Class Synergies**

| Class | Rating |
|---|---|
| Nanite Swarm Controller | S |
| Scrap Salvager | S |
| Chrono Architect | A |
| Hyper-Conductor | A |
| Graviton Weaver | A |
| Resonance Bard | A |
| Quantum Entangler | B |
| Phase Weaver | B |
| Vector Specialist | B |

---

### Chieftain — The Kinetic Brawler
*Role: High-armour brawler with surprising agility. Built around collision damage and absorbing hits.*

| Stat | Value |
|---|---|
| HULL | 3,500 HP |
| ARMOR | 22% |
| SHIELD_MAX | 700 SP |
| SHIELD_REGEN | 70 SP/s |
| SHIELD_DELAY | 3.5s |
| TOP_SPEED | 350 u/s |
| ACCELERATION | 360 u/s² |
| TURN_SPEED | 200 °/s |
| EVASION | 4% |
| MASS | 7 |
| SLOT_SMALL | 2 |
| SLOT_MEDIUM | 3 |
| SLOT_LARGE | 1 |
| SLOT_XL | 0 |
| CARGO_CAPACITY | 100 |
| HEAT_DISSIPATION | 20 h/s |
| ENERGY_GRID | 160 |
| REPAIR_RATE | 22 HP/s |

**Hardware Tags:** ARMOR×2 · IMPACT×2 · MASS×1

**Tag Weighting:**
```
ARMOR       5  (core)
HULL        4
MASS        4
IMPACT      4
TURN_SPEED  3
KINETIC     3
REPAIR_RATE 2
CORROSIVE   2
```

**Special Tags:** `IMPACT_DRIVE` — collision damage scales with current velocity × mass

**Class Synergies**

| Class | Rating |
|---|---|
| Graviton Weaver | S |
| Scrap Salvager | S |
| Quantum Entangler | A |
| Phase Weaver | A |
| Chrono Architect | B |
| Nanite Swarm Controller | B |
| Resonance Bard | B |
| Hyper-Conductor | C |
| Vector Specialist | C |

---

### Python — The Heavy Gunship
*Role: Maximum firepower platform. More hardpoints than any other ship. Slow but devastating.*

| Stat | Value |
|---|---|
| HULL | 3,200 HP |
| ARMOR | 15% |
| SHIELD_MAX | 2,200 SP |
| SHIELD_REGEN | 130 SP/s |
| SHIELD_DELAY | 2.0s |
| TOP_SPEED | 280 u/s |
| ACCELERATION | 200 u/s² |
| TURN_SPEED | 110 °/s |
| EVASION | 2% |
| MASS | 7 |
| SLOT_SMALL | 3 |
| SLOT_MEDIUM | 3 |
| SLOT_LARGE | 3 |
| SLOT_XL | 1 |
| CARGO_CAPACITY | 130 |
| HEAT_DISSIPATION | 16 h/s |
| ENERGY_GRID | 160 |
| REPAIR_RATE | 15 HP/s |

**Hardware Tags:** SLOT_LARGE×2 · SHIELD_MAX×1 · RATE_OF_FIRE×1

**Tag Weighting:**
```
SLOT_LARGE    5  (core)
SLOT_MEDIUM   4
SHIELD_MAX    4
RATE_OF_FIRE  4
ENERGY_GRID   3
AMMO_CAPACITY 3
PIERCE        2
TETHER        2
```

**Special Tags:** `WEAPONS_PLATFORM` — bonus damage when 3+ weapons fire simultaneously in the same tick

**Class Synergies**

| Class | Rating |
|---|---|
| Quantum Entangler | S |
| Hyper-Conductor | S |
| Chrono Architect | A |
| Graviton Weaver | A |
| Scrap Salvager | A |
| Vector Specialist | A |
| Nanite Swarm Controller | B |
| Phase Weaver | B |
| Resonance Bard | B |

---

## Heavy Class

### Anaconda — The Flying Fortress
*Role: Balanced fortress. Best combined hull+shield total. Anchor ship, long-range team support.*

| Stat | Value |
|---|---|
| HULL | 7,500 HP |
| ARMOR | 22% |
| SHIELD_MAX | 4,000 SP |
| SHIELD_REGEN | 180 SP/s |
| SHIELD_DELAY | 2.5s |
| TOP_SPEED | 200 u/s |
| ACCELERATION | 130 u/s² |
| TURN_SPEED | 60 °/s |
| EVASION | 1% |
| MASS | 9 |
| SLOT_SMALL | 2 |
| SLOT_MEDIUM | 3 |
| SLOT_LARGE | 2 |
| SLOT_XL | 1 |
| CARGO_CAPACITY | 180 |
| HEAT_DISSIPATION | 26 h/s |
| ENERGY_GRID | 280 |
| REPAIR_RATE | 30 HP/s |

**Hardware Tags:** HULL×2 · SHIELD_MAX×2 · RANGE×1

**Tag Weighting:**
```
HULL         5  (core)
SHIELD_MAX   5  (core)
REPAIR_RATE  4
RANGE        4
SHIELD_REGEN 3
ENERGY_GRID  3
AURA_RADIUS  2
BROADCAST    2
```

**Special Tags:** `LONG_RANGE_TARGETING` — all weapon range values increased by 40%

**Class Synergies**

| Class | Rating |
|---|---|
| Chrono Architect | S |
| Phase Weaver | S |
| Resonance Bard | S |
| Quantum Entangler | A |
| Hyper-Conductor | A |
| Graviton Weaver | A |
| Scrap Salvager | A |
| Nanite Swarm Controller | B |
| Vector Specialist | B |

---

### Cutter — The Shield Dreadnought
*Role: Maximum shields. Uses mass and momentum as an offensive tool. Front-line tank.*

| Stat | Value |
|---|---|
| HULL | 6,000 HP |
| ARMOR | 18% |
| SHIELD_MAX | 5,500 SP |
| SHIELD_REGEN | 220 SP/s |
| SHIELD_DELAY | 2.0s |
| TOP_SPEED | 250 u/s |
| ACCELERATION | 160 u/s² |
| TURN_SPEED | 70 °/s |
| EVASION | 1% |
| MASS | 12 |
| SLOT_SMALL | 2 |
| SLOT_MEDIUM | 3 |
| SLOT_LARGE | 2 |
| SLOT_XL | 1 |
| CARGO_CAPACITY | 140 |
| HEAT_DISSIPATION | 20 h/s |
| ENERGY_GRID | 300 |
| REPAIR_RATE | 22 HP/s |

**Hardware Tags:** SHIELD_MAX×3 · MASS×2 · IMPACT×1

**Tag Weighting:**
```
SHIELD_MAX   5  (core)
SHIELD_REGEN 5  (core)
MASS         4
IMPACT       3
ENERGY_GRID  3
HULL         3
VOLTAGE      2
INVULNERABILITY 2
```

**Special Tags:** `MOMENTUM_DRIVE` — ramming damage scales with mass × velocity · `SHIELD_WALL` — front-arc incoming damage reduced by an additional 15%

**Class Synergies**

| Class | Rating |
|---|---|
| Hyper-Conductor | S |
| Phase Weaver | S |
| Chrono Architect | A |
| Resonance Bard | A |
| Vector Specialist | A |
| Quantum Entangler | B |
| Graviton Weaver | B |
| Scrap Salvager | B |
| Nanite Swarm Controller | C |

---

### Type-10 — The Heavy Ordnance Array
*Role: Immovable fortress. Maximum armor and hull. 360° turret coverage. Completely status immune.*

| Stat | Value |
|---|---|
| HULL | 10,000 HP |
| ARMOR | 32% |
| SHIELD_MAX | 1,800 SP |
| SHIELD_REGEN | 80 SP/s |
| SHIELD_DELAY | 3.0s |
| TOP_SPEED | 150 u/s |
| ACCELERATION | 100 u/s² |
| TURN_SPEED | 45 °/s |
| EVASION | 0% |
| MASS | 12 |
| SLOT_SMALL | 2 |
| SLOT_MEDIUM | 2 |
| SLOT_LARGE | 3 |
| SLOT_XL | 2 |
| CARGO_CAPACITY | 160 |
| HEAT_DISSIPATION | 24 h/s |
| ENERGY_GRID | 320 |
| REPAIR_RATE | 35 HP/s |

**Hardware Tags:** ARMOR×3 · HULL×2 · STATUS_IMMUNITY×1

**Tag Weighting:**
```
ARMOR       5  (core)
HULL        5  (core)
SLOT_LARGE  4
SLOT_XL     4
ENERGY_GRID 3
REPAIR_RATE 3
GRAVITY     2
SALVAGE     2
```

**Special Tags:** `STATUS_IMMUNE` — immune to FREEZE, BURN, and EMP debuffs · `TURRET_ARRAY` — all equipped weapons gain 360° targeting arc

**Class Synergies**

| Class | Rating |
|---|---|
| Graviton Weaver | S |
| Scrap Salvager | S |
| Vector Specialist | S |
| Chrono Architect | A |
| Quantum Entangler | A |
| Nanite Swarm Controller | A |
| Resonance Bard | A |
| Phase Weaver | B |
| Hyper-Conductor | C |

---

## Quick Comparison

| Ship | Class | HULL | ARMOR | SHIELD | SPEED | TURN | EVASION | Slots (S/M/L/XL) |
|---|---|---|---|---|---|---|---|---|
| Sidewinder | Light | 900 | 3% | 800 | 580 | 340° | 15% | 3/1/0/0 |
| Cobra | Light | 1,200 | 6% | 1,100 | 490 | 260° | 8% | 2/2/1/0 |
| Mamba | Light | 850 | 3% | 600 | 620 | 130° | 6% | 2/2/1/0 |
| Krait | Medium | 2,500 | 12% | 1,400 | 380 | 170° | 3% | 2/2/1/0 + 2 drone bays |
| Chieftain | Medium | 3,500 | 22% | 700 | 350 | 200° | 4% | 2/3/1/0 |
| Python | Medium | 3,200 | 15% | 2,200 | 280 | 110° | 2% | 3/3/3/1 |
| Anaconda | Heavy | 7,500 | 22% | 4,000 | 200 | 60° | 1% | 2/3/2/1 |
| Cutter | Heavy | 6,000 | 18% | 5,500 | 250 | 70° | 1% | 2/3/2/1 |
| Type-10 | Heavy | 10,000 | 32% | 1,800 | 150 | 45° | 0% | 2/2/3/2 |
