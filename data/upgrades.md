# Upgrade Pool — Project Neon Fleet

Upgrades are offered during a run based on the combined tag weightings of the player's ship and class. Higher-weighted tags produce those upgrade cards more frequently in the draft.

**Tiers & Rarities**
```
Tier 1 — Common     — Stat Mutators: flat stat boosts, often with trade-offs
Tier 2 — Uncommon   — Logic Triggers: IF/THEN automation modules
Tier 3 — Rare       — Converters: resource/mechanic conversion, playstyle shifts
Tier 4 — Epic       — Resonance: amplify every tag of a matching type you hold
Tier 5 — Legendary  — Keystones: unique class capstones, require deep tag investment
```

**Offering System**
Draft cards appear based on: ship tagWeighting + class tagWeighting + current TagAggregator pool.
Cards with prerequisiteTags that aren't met are hidden from the pool until unlocked.

---

## HULL Upgrades

**Hull Reinforcement** — T1 Common — StatMutator
Tags: HULL | Grants: HULL×1
+500 hull HP.

**Dense Alloy Plating** — T1 Common — StatMutator
Tags: HULL, ARMOR | Grants: HULL×2
+900 hull HP. Trade-off: -6% top speed.

**Reactive Hull Matrix** — T2 Uncommon — LogicTrigger
Tags: HULL, ON_HIT | Requires: HULL×1 | Grants: HULL×1
ON_HIT: 12% chance to restore 250 hull HP.

**Hull Resonance** — T4 Epic — Resonance
Tags: HULL | Requires: HULL×4 | Grants: HULL×1
For every HULL tag held, each HULL tag grants an additional +8% bonus HP.

---

## ARMOR Upgrades

**Composite Shielding** — T1 Common — StatMutator
Tags: ARMOR | Grants: ARMOR×1
+4% damage reduction.

**Ablative Plating** — T1 Common — StatMutator
Tags: ARMOR | Grants: ARMOR×2
+8% damage reduction. Trade-off: -4% evasion chance.

**Adaptive Armor** — T2 Uncommon — LogicTrigger
Tags: ARMOR, ON_HIT | Requires: ARMOR×1 | Grants: ARMOR×1
ON_HIT: temporarily gain +3% ARMOR for 4s (stacks up to 5 times).

**Armor Resonance** — T4 Epic — Resonance
Tags: ARMOR | Requires: ARMOR×4 | Grants: ARMOR×1
For every ARMOR tag held, each ARMOR tag grants an additional +2% damage reduction.

---

## SHIELD Upgrades

**Shield Cell Array** — T1 Common — StatMutator
Tags: SHIELD_MAX | Grants: SHIELD_MAX×1
+300 shield points.

**Overcharged Barrier** — T1 Common — StatMutator
Tags: SHIELD_MAX | Grants: SHIELD_MAX×2
+650 shield points. Trade-off: -30 energy grid capacity.

**Cascade Shielding** — T2 Uncommon — LogicTrigger
Tags: SHIELD_MAX, ON_SHIELD_DROP | Requires: SHIELD_MAX×1 | Grants: SHIELD_MAX×1
ON_SHIELD_DROP: immediately restore 20% of max shield. Cooldown: 15s.

**Shield Regen Coil** — T1 Common — StatMutator
Tags: SHIELD_REGEN | Grants: SHIELD_REGEN×1
+20 shield regeneration per second.

**Rapid-Cycle Emitter** — T1 Common — StatMutator
Tags: SHIELD_REGEN, SHIELD_DELAY | Grants: SHIELD_REGEN×1, SHIELD_DELAY×1
+30 shield regen/s and -0.5s regen delay.

---

## EVASION Upgrades

**Evasive Subroutines** — T1 Common — StatMutator
Tags: EVASION | Grants: EVASION×1
+3% dodge chance.

**Afterburner Protocol** — T1 Common — StatMutator
Tags: EVASION, TOP_SPEED | Grants: EVASION×2
+6% dodge chance. Trade-off: -10% weapon accuracy.

**Counter-Strike** — T2 Uncommon — LogicTrigger
Tags: EVASION, ON_HIT | Requires: EVASION×2 | Grants: EVASION×1
ON_DODGE: next weapon attack deals +60% bonus damage.

**Evasion Resonance** — T4 Epic — Resonance
Tags: EVASION | Requires: EVASION×4 | Grants: EVASION×1
For every EVASION tag held, each EVASION tag grants +1% additional dodge chance.

---

## SPEED & MOBILITY Upgrades

**Engine Overhaul** — T1 Common — StatMutator
Tags: TOP_SPEED | Grants: TOP_SPEED×1
+30 u/s maximum speed.

**Nitro Injection** — T1 Common — StatMutator
Tags: TOP_SPEED, HEAT_GEN | Grants: TOP_SPEED×2
+60 u/s maximum speed. Trade-off: +15% heat generated per shot.

**Kill Boost** — T2 Uncommon — LogicTrigger
Tags: TOP_SPEED, ON_KILL | Requires: TOP_SPEED×1 | Grants: TOP_SPEED×1
ON_KILL: +40% top speed for 3s.

**Gyro-Assist** — T1 Common — StatMutator
Tags: TURN_SPEED | Grants: TURN_SPEED×1
+20°/s turn speed.

**Inertial Dampeners** — T1 Common — StatMutator
Tags: TURN_SPEED, ACCELERATION | Grants: TURN_SPEED×1, ACCELERATION×1
+30°/s turn speed and +25 u/s² acceleration.

---

## HEAT & ENERGY Upgrades

**Cooling Vents** — T1 Common — StatMutator
Tags: HEAT_DISSIPATION | Grants: HEAT_DISSIPATION×1
+8 heat/s cooling rate.

**Cryogenic Sink** — T1 Common — StatMutator
Tags: HEAT_DISSIPATION | Grants: HEAT_DISSIPATION×2
+18 heat/s cooling. Trade-off: -5% fire rate.

**Heat Flush** — T2 Uncommon — LogicTrigger
Tags: HEAT_DISSIPATION, ON_OVERHEAT | Requires: HEAT_DISSIPATION×1 | Grants: HEAT_DISSIPATION×1
ON_OVERHEAT: instantly cool to 0% heat and gain +20% fire rate for 2s. Cooldown: 12s.

**Capacitor Array** — T1 Common — StatMutator
Tags: ENERGY_GRID | Grants: ENERGY_GRID×1
+40 energy grid capacity.

**High-Output Core** — T1 Common — StatMutator
Tags: ENERGY_GRID | Grants: ENERGY_GRID×2
+90 energy grid capacity. Trade-off: +8% energy cost per shot.

**Passive Repair Node** — T1 Common — StatMutator
Tags: REPAIR_RATE | Grants: REPAIR_RATE×1
+5 HP/s passive hull repair.

---

## WEAPON Upgrades

**Hardened Rounds** — T1 Common — StatMutator
Tags: KINETIC | Grants: KINETIC×1
+8% kinetic weapon damage.

**Depleted Core Shells** — T1 Common — StatMutator
Tags: KINETIC, ARMOR | Grants: KINETIC×2
+16% kinetic damage. Trade-off: -10% fire rate.

**Armor Breaker** — T2 Uncommon — LogicTrigger
Tags: KINETIC, CORROSIVE | Requires: KINETIC×1 | Grants: KINETIC×1, CORROSIVE×1
Kinetic hits have a 20% chance to apply one CORROSIVE stack.

**Plasma Cell Upgrade** — T1 Common — StatMutator
Tags: ENERGY | Grants: ENERGY×1
+8% energy weapon damage.

**Superheated Beam** — T1 Common — StatMutator
Tags: ENERGY, HEAT_GEN | Grants: ENERGY×2
+16% energy weapon damage. Trade-off: +20% heat generation per shot.

**Shaped Charges** — T1 Common — StatMutator
Tags: EXPLOSIVE, BLAST_RADIUS | Grants: EXPLOSIVE×1, BLAST_RADIUS×1
+8% explosive damage and +15% blast radius.

**Firing Actuator** — T1 Common — StatMutator
Tags: RATE_OF_FIRE | Grants: RATE_OF_FIRE×1
+12% fire rate for all weapons.

**Extended Magazine** — T1 Common — StatMutator
Tags: AMMO_CAPACITY, RATE_OF_FIRE | Grants: AMMO_CAPACITY×1
+4 shots before reload.

**Tungsten Core** — T2 Uncommon — StatMutator
Tags: PIERCE | Grants: PIERCE×1
+1 pierce — shots pass through one additional enemy.

**Ricochet Rounds** — T2 Uncommon — StatMutator
Tags: RICOCHET | Grants: RICOCHET×1
+1 ricochet — shots bounce once off a target or surface.

---

## STATUS EFFECT Upgrades

**Incendiary Payload** — T1 Common — StatMutator
Tags: BURN | Grants: BURN×1
Weapon hits apply BURN: +12 thermal DPS for 2s.

**Cryo Warhead** — T1 Common — StatMutator
Tags: FREEZE | Grants: FREEZE×1
Weapon hits apply FREEZE: -10% enemy speed for 2s.

**EMP Charge** — T2 Uncommon — StatMutator
Tags: EMP, VOLTAGE | Grants: EMP×1
Weapon hits apply EMP: disable target shields and routines for 0.8s.

**Targeting Processor** — T1 Common — StatMutator
Tags: CRITICAL_CHANCE | Grants: CRITICAL_CHANCE×1
+5% critical hit chance.

**Sustained Ignition** — T2 Uncommon — StatMutator
Tags: DOT_DURATION, BURN | Requires: BURN×1 | Grants: DOT_DURATION×1
+0.5s to all active status effect durations.

---

## CONSTRUCT Upgrades

**Drone Bay Expansion** — T1 Common — StatMutator
Tags: DRONE_COUNT | Grants: DRONE_COUNT×1
+1 maximum active drone.

**Combat Drone Mk.II** — T2 Uncommon — StatMutator
Tags: DRONE_COUNT, DRONE_DAMAGE | Requires: DRONE_COUNT×1 | Grants: DRONE_COUNT×1, DRONE_DAMAGE×1
+1 max drone. Drones deal +15% damage.

**Rapid Redeployment** — T2 Uncommon — StatMutator
Tags: RESPAWN_RATE, DRONE_COUNT | Requires: DRONE_COUNT×2 | Grants: RESPAWN_RATE×1
Destroyed drones respawn 1.5s faster.

**Repair Swarm Protocol** — T2 Uncommon — StatMutator
Tags: REPAIR_SWARM, DRONE_COUNT | Requires: DRONE_COUNT×1 | Grants: REPAIR_SWARM×1
Drones switch to repair mode: each active drone restores +8 HP/s to the team.

**Kamikaze Swarm** — T2 Uncommon — StatMutator
Tags: KAMIKAZE, DRONE_COUNT | Requires: DRONE_COUNT×2 | Grants: KAMIKAZE×1
Drones detonate on contact dealing AoE damage. +40% detonation damage. Trade-off: drones consumed on detonation.

---

## GRAVITY Upgrades

**Graviton Emitter** — T1 Common — StatMutator
Tags: GRAVITY | Grants: GRAVITY×1
+15% gravity pull force and +10% pull field radius.

**Singularity Core** — T2 Uncommon — StatMutator
Tags: SINGULARITY, GRAVITY | Requires: GRAVITY×1 | Grants: SINGULARITY×1, GRAVITY×1
Deploy a singularity lasting 2s. +0.8s duration and +12% singularity damage.

**Compression Field** — T2 Uncommon — StatMutator
Tags: COMPRESSION, GRAVITY | Requires: GRAVITY×2 | Grants: COMPRESSION×1
Enemies pulled by gravity are compressed: +15% bonus damage dealt to compressed clusters.

**Gravity Well Detonator** — T3 Rare — Converter
Tags: GRAVITY, EXPLOSIVE, COMPRESSION | Requires: GRAVITY×3, SINGULARITY×1 | Grants: GRAVITY×1, COMPRESSION×1
Singularities detonate at expiry, dealing EXPLOSIVE damage to every pulled enemy simultaneously.

---

## PHASE / BLINK Upgrades

**Phase Drive** — T1 Common — StatMutator
Tags: PHASE | Grants: PHASE×1
+0.3s phase duration, -0.8s phase cooldown.

**Emergency Phase Protocol** — T2 Uncommon — LogicTrigger
Tags: PHASE, ON_SHIELD_DROP | Requires: PHASE×1 | Grants: PHASE×1
ON_SHIELD_DROP: automatically enter phase state for 1.5s. Cooldown: 20s.

**Blink Drive** — T2 Uncommon — StatMutator
Tags: BLINK, PHASE | Requires: PHASE×1 | Grants: BLINK×1
Unlock blink repositioning: instant short-range teleport. -0.5s cooldown, +20u range.

**Phase Counter-Protocol** — T3 Rare — Converter
Tags: PHASE, INVULNERABILITY, EVASION | Requires: PHASE×2, EVASION×2 | Grants: PHASE×1, INVULNERABILITY×1
EVASION tags now count as PHASE tags for all prerequisite checks. Successful dodges can trigger phase entry.

---

## TETHER / CHAIN Upgrades

**Quantum Link** — T1 Common — StatMutator
Tags: TETHER | Grants: TETHER×1
+1 simultaneous tether link. +15% tether range.

**Force Tether** — T2 Uncommon — LogicTrigger
Tags: TETHER, DISPLACEMENT | Requires: TETHER×1 | Grants: TETHER×1, DISPLACEMENT×1
Tethered enemies cannot move more than 280u apart. Violating the link deals displacement damage.

**Chain Reaction** — T2 Uncommon — StatMutator
Tags: CHAIN, TETHER | Requires: TETHER×2 | Grants: CHAIN×1
+1 chain jump. Effects propagate along tether links retaining 70% damage per hop.

**Tether Detonation** — T3 Rare — Converter
Tags: TETHER, CHAIN, EXPLOSIVE | Requires: TETHER×2, CHAIN×1 | Grants: TETHER×1, CHAIN×1
Destroying a tethered target deals 30% EXPLOSIVE damage to all currently linked targets.

---

## VOLTAGE / OVERCLOCK Upgrades

**Voltage Capacitor** — T1 Common — StatMutator
Tags: VOLTAGE | Grants: VOLTAGE×1
+15% electrical damage output.

**Lightning Discharge** — T2 Uncommon — LogicTrigger
Tags: VOLTAGE, ON_OVERHEAT | Requires: VOLTAGE×1 | Grants: VOLTAGE×1
ON_OVERHEAT: release a VOLTAGE pulse in 200u radius, damage proportional to heat at time of overheat. Cooldown: 10s.

**Heat-to-Lightning Converter** — T3 Rare — Converter
Tags: VOLTAGE, HEAT_GEN, ON_OVERHEAT | Requires: VOLTAGE×2, HEAT_DISSIPATION×2 | Grants: VOLTAGE×2, OVERCLOCK×1
Convert 100% of weapon heat into VOLTAGE damage. Trade-off: -50% heat dissipation rate.

**Overclock Module** — T2 Uncommon — StatMutator
Tags: OVERCLOCK, ENERGY_GRID | Requires: VOLTAGE×1 | Grants: OVERCLOCK×1
+8% overclock burst magnitude and +0.3s duration. Trade-off: burns energy reserves.

---

## NANITE / INFESTATION Upgrades

**Nanite Swarm Mk.II** — T1 Common — StatMutator
Tags: NANITE | Grants: NANITE×1
+2 nanites deployed per pulse.

**Infectious Payload** — T2 Uncommon — LogicTrigger
Tags: NANITE, INFESTATION, BIOLOGICAL | Requires: NANITE×1 | Grants: NANITE×1, INFESTATION×1
Nanite hits apply BIOLOGICAL status. ON_KILL: infestation spreads to 1 nearby enemy.

**Replicator Protocol** — T3 Rare — Converter
Tags: NANITE, INFESTATION, DRONE_COUNT | Requires: NANITE×3, INFESTATION×1 | Grants: NANITE×2, INFESTATION×1
Nanite drones that destroy an enemy spawn 2 copies of themselves for 6s.

---

## REFLECTION / MIRROR / PRISM Upgrades

**Prismatic Lens** — T1 Common — StatMutator
Tags: REFLECTION | Grants: REFLECTION×1
+12% reflected damage multiplier on all incoming projectiles.

**Mirror Deployment** — T2 Uncommon — StatMutator
Tags: MIRROR, REFLECTION | Requires: REFLECTION×1 | Grants: MIRROR×1
Deploy +1 active mirror prism. Projectiles bounce off mirrors at a new angle.

**Split Beam** — T2 Uncommon — StatMutator
Tags: PRISM, MIRROR | Requires: MIRROR×1 | Grants: PRISM×1
Beams hitting a prism split into 2 copies, each dealing 60% of parent beam damage.

**Infinite Mirror** — T3 Rare — Converter
Tags: MIRROR, PRISM, REFLECTION | Requires: MIRROR×2, PRISM×1 | Grants: MIRROR×1, PRISM×1, REFLECTION×1
Reflected beams from mirrors can bounce again without damage decay.

---

## HARMONIC / BROADCAST / AMPLIFICATION Upgrades

**Resonance Coil** — T1 Common — StatMutator
Tags: HARMONIC | Grants: HARMONIC×1
+6% per-stack HARMONIC multiplier on all aura effects.

**Chord Cascade** — T2 Uncommon — LogicTrigger
Tags: HARMONIC, ON_KILL | Requires: HARMONIC×1 | Grants: HARMONIC×1
ON_KILL: instantly add 2 HARMONIC stacks.

**Broadcast Amplifier** — T2 Uncommon — StatMutator
Tags: BROADCAST, AMPLIFICATION, AURA_RADIUS | Grants: BROADCAST×1, AMPLIFICATION×1
+20u broadcast range and +8% stat amplification multiplier for all allies in range.

**Resonance Overflow** — T3 Rare — Converter
Tags: HARMONIC, AMPLIFICATION, BROADCAST | Requires: HARMONIC×3, BROADCAST×1 | Grants: HARMONIC×1, AMPLIFICATION×1
When HARMONIC reaches 10 stacks, pulse all current AMPLIFICATION buffs to all allies in 300u.

---

## SALVAGE / DEBRIS Upgrades

**Salvage Array** — T1 Common — StatMutator
Tags: SALVAGE | Grants: SALVAGE×1
+15% debris collected per enemy destroyed.

**Debris Barrier** — T2 Uncommon — StatMutator
Tags: DEBRIS_FIELD, SALVAGE | Requires: SALVAGE×1 | Grants: DEBRIS_FIELD×1
Deploy collected debris as a physical barrier. +1 piece, +15% barrier HP.

**Orbital Junk Belt** — T3 Rare — Converter
Tags: SALVAGE, DEBRIS_FIELD, ORBITAL | Requires: SALVAGE×2, DEBRIS_FIELD×1 | Grants: SALVAGE×1, DEBRIS_FIELD×1, ORBITAL×1
Salvaged debris orbits the ship as a rotating ring, blocking projectiles and dealing collision damage.

---

## TEMPORAL ECHO Upgrades

**Echo Circuit** — T2 Uncommon — StatMutator
Tags: TEMPORAL_ECHO | Requires: CHRONO×1 | Grants: TEMPORAL_ECHO×1
+12% chance for any triggered effect to duplicate after a 0.8s delay.

**Kill Echo** — T3 Rare — LogicTrigger
Tags: TEMPORAL_ECHO, ON_KILL | Requires: TEMPORAL_ECHO×1, CHRONO×2 | Grants: TEMPORAL_ECHO×1
ON_KILL: the kill event is echoed 0.8s later, re-triggering all ON_KILL logic modules a second time.

---

## CO-OP / UTILITY Upgrades

**Heat Siphon** — T2 Uncommon — StatMutator
Tags: RESOURCE_FEED, HEAT_DISSIPATION | Grants: RESOURCE_FEED×1
Transfer 12% of excess heat/s to the nearest ally as fuel for their systems.

---

## CONVERTER: Cross-Class

**Zero-Shield Fortress** — T3 Rare — Converter
Tags: ARMOR, SHIELD_MAX, HULL | Requires: ARMOR×3 | Grants: ARMOR×3
Convert all shield capacity into armor. +20% ARMOR. Trade-off: shield capacity becomes 0.

**Kinetic Mass Driver** — T3 Rare — Converter
Tags: MASS, KINETIC, IMPACT | Requires: MASS×2, KINETIC×2 | Grants: MASS×1, KINETIC×1, IMPACT×1
MASS tags now count as KINETIC tags for damage calculations. Trade-off: -15% turn speed.

---

## LOGIC TRIGGER Upgrades

**Crit Reload** — T2 Uncommon — LogicTrigger
Tags: ON_CRIT, CRITICAL_CHANCE, RELOAD_SPEED | Requires: CRITICAL_CHANCE×1 | Grants: ON_CRIT×1
ON_CRIT: instantly reload all weapons. Cooldown: 8s.

**Combat Triage** — T2 Uncommon — LogicTrigger
Tags: ON_KILL, REPAIR_RATE | Grants: ON_KILL×1
ON_KILL: restore 300 hull HP.

**Proximity Turret** — T2 Uncommon — LogicTrigger
Tags: PROXIMITY, ORBITAL | Grants: PROXIMITY×1
PROXIMITY (150u): automatically deploy an orbital defensive construct for 5s. Cooldown: 10s.

**Team Shield Relay** — T2 Uncommon — LogicTrigger
Tags: ALLY_LOW_HP, SHIELD_MAX | Grants: ALLY_LOW_HP×1
ALLY_LOW_HP: transfer 400 shield points to the teammate for 6s. Cooldown: 20s.

---

## CLASS KEYSTONES — Tier 5 Legendary

Each keystone requires deep investment in the class's signature tags and is restricted to that class only.

---

**Absolute Zero** — Chrono Architect only
Requires: CHRONO×5, EXECUTION_SPEED×3, TEMPORAL_ECHO×2
If hit would be fatal: expand time bubble to fill the entire arena for 5s. All allies act at 200% execution speed during this window. Cooldown: 120s.

---

**Entanglement Cascade** — Quantum Entangler only
Requires: TETHER×5, CHAIN×3, DAMAGE_SHARE×2
Destroying one tethered target instantly kills all other tethered targets below 30% HP. The kill chain can trigger repeatedly.

---

**Overload Event** — Hyper-Conductor only
Requires: VOLTAGE×5, OVERCLOCK×3, ON_OVERHEAT×2
Intentionally overheat to maximum to release a map-wide VOLTAGE pulse dealing 10× accumulated heat as damage. Trade-off: 30s cooldown after use.

---

**Event Horizon** — Graviton Weaver only
Requires: GRAVITY×5, SINGULARITY×3, COMPRESSION×2
Deploy a permanent singularity anchored to the arena. It grows 10% in pull radius per kill, eventually consuming the entire sector.

---

**Grey Goo Protocol** — Nanite Swarm Controller only
Requires: NANITE×5, INFESTATION×3, BIOLOGICAL×2
Nanites become self-sustaining. Each kill permanently creates 2 new nanite drones that exist until destroyed.

---

**Quantum Ghost** — Phase Weaver only
Requires: PHASE×5, INVULNERABILITY×3, BLINK×2
The ship can remain in phase state indefinitely. Exit phase voluntarily to deal 300% burst damage with the next attack. Trade-off: cannot deal damage while permanently phased.

---

**Perfect Harmony** — Resonance Bard only
Requires: HARMONIC×5, AMPLIFICATION×3, BROADCAST×2
When HARMONIC reaches maximum stacks, all allied stats double for 10s. Trade-off: HARMONIC stacks reset to 0 after the burst.

---

**Junk Star** — Scrap Salvager only
Requires: SALVAGE×5, DEBRIS_FIELD×3, ORBITAL×2
Each kill generates 2 permanent orbiting debris pieces. Orbital debris deals collision damage and ricochets shots.

---

**Infinity Mirror** — Vector Specialist only
Requires: MIRROR×5, PRISM×3, REFLECTION×2
Deploy a prism network filling the entire arena. All energy attacks bounce indefinitely without damage decay for 8s.

---

## Test Cards (active during development)

Cards tagged `TEST_UPGRADE` replace the normal draft pool entirely when present — only test cards appear in offers.

| Card | Tier | Type | Effect |
|---|---|---|---|
| Reinforced Plating | T1 | StatMutator | +350 hull HP |
| Shield Amplifier | T2 | StatMutator | +300 shield · shield delay −2s |
| Kill Feed | T2 | LogicTrigger | ON_KILL: restore 20% max hull |
| Phase Reaction | T3 | LogicTrigger | ON_KILL: 2s PHASE (3s cooldown) |
| Cryo Warhead | T3 | LogicTrigger | ON_KILL: cryo AoE 400u · slows 60% for 3s (2s cooldown) |
| **Firing Solutions** | **T1** | **StatMutator** | **+10% fire rate — RECURSIVE, can be drafted every level** |

**Recursive cards** (RECURSIVE tag) are re-offered each draft even after being picked. Firing Solutions stacks multiplicatively: 10 stacks = ~65% faster firing, 20 stacks = ~88% faster.
