# Modules — Project Neon Fleet

27 base modules across 11 categories. Modules go in MODULE_SLOT_* bays — physically separate from WEAPON_SLOT_* hardpoints.

---

## Module Types

**Pure passive** — always-on flat stat bonus. No interaction with the draft system. Cost: weight + optional passive drain.

**Draft-boosting** — permanently modifies the card pool for this player's run:
- `weightMultiplier` — upgrade cards in these tag categories appear N× more often in the draft
- `rarityBonus` — higher-tier cards unlock as if you hold N extra matching tags (access T3 cards sooner)
- `effectMultiplier` — drafted cards in these categories apply N× their normal stat value when taken

**Active / triggered** — fire on a LOGIC condition (ON_KILL, ON_SHIELD_DROP, TIMER, etc.) using the existing trigger system.

**Drone** — deploy active construct units. Drone weapons use the same tag system as ship weapons — KINETIC tags in your aggregator boost the combat drone's kinetic shots.

**Partner** — passive effects that extend to the allied ship when they are within AURA_RADIUS range.

---

## Weight notes

`WEAPON_ACCURACY_MOD`, `WEAPON_HEAT_GEN_MOD`, `WEAPON_AMMO_MOD` in `passiveBonuses` are weapon-wide modifiers applied across all equipped weapons. Negative = improvement (less spread, less heat).

---

## SHIELD

**Shield Booster** `SMALL` · weight 12
Flat +350 SHIELD_MAX. No drawbacks — fits any ship.
> No draft bonus.

**Shield Capacitor** `MEDIUM` · weight 32 · drain 3/s
+700 SHIELD_MAX · +25 SHIELD_REGEN/s
> **Draft bonus:** SHIELD_MAX / SHIELD_REGEN cards appear ×1.4 more often.

**Emergency Shield Cell** `MEDIUM` · weight 28 · drain 2/s
+300 SHIELD_MAX passive.
> **Trigger** ON_SHIELD_DROP: restore 500 SP immediately. Cooldown 20s.

---

## HULL

**Armor Plate** `SMALL` · weight 22
+6% ARMOR. Heavier than it looks — check weight budget on fast ships.
> No draft bonus.

**Hull Reinforcement** `MEDIUM` · weight 40
+1,200 HULL · +4% ARMOR
> **Draft bonus:** HULL / ARMOR cards appear ×1.3 more often.

---

## ENGINE

**Thruster Pack** `SMALL` · weight 10 · drain 1/s
+25 TOP_SPEED · +20 ACCELERATION. Minimal weight — good fit for Sidewinder and Mamba.
> No draft bonus.

**Drive Array** `MEDIUM` · weight 22 · drain 2/s
+50 TOP_SPEED · +40 ACCELERATION · +15 TURN_SPEED
> **Draft bonus:** TOP_SPEED / EVASION / TURN_SPEED cards appear ×1.4 more often.

---

## POWER

**Power Cell** `SMALL` · weight 8
+60 ENERGY_GRID · +8 ENERGY_REGEN/s. Core module for beam and drone-heavy builds.
> No draft bonus.

**Reactor Module** `MEDIUM` · weight 20
+140 ENERGY_GRID · +18 ENERGY_REGEN/s
> **Draft bonus:** ENERGY_GRID / ENERGY_REGEN / OVERCLOCK cards appear ×1.4 more often.

**Fusion Core** `LARGE` · weight 55 · passive heat 2/s
+300 ENERGY_GRID · +40 ENERGY_REGEN/s
> **Draft bonus:** ENERGY_GRID / VOLTAGE / OVERCLOCK appear ×1.5 more often, unlock 1 tier earlier, and are **20% more effective** when drafted. The highest-tier power module.

---

## THERMAL

**Cooling Fin** `SMALL` · weight 8
+10 HEAT_DISSIPATION/s. Essential for beam weapon builds.
> No draft bonus.

**Cryo Module** `MEDIUM` · weight 18 · drain 2/s
+22 HEAT_DISSIPATION/s · +15 HEAT_CAPACITY
> **Draft bonus:** HEAT_DISSIPATION / HEAT_GEN / VOLTAGE / ON_OVERHEAT appear ×1.3 more often. Natural pairing for Hyper-Conductor builds.

---

## REPAIR

**Auto-Repair Bay** `MEDIUM` · weight 25 · drain 2/s
+12 REPAIR_RATE HP/s
> **Draft bonus:** REPAIR_RATE / HULL / NANITE cards appear ×1.3 more often, 10% more effective.

---

## DRONE

All drone modules consume passive energy per drone deployed. Drone weapons benefit from matching tags in the ship's TagAggregator pool — KINETIC tags boost the combat drone's kinetic shots, ENERGY tags boost the heavy drone's beam DPS.

**Combat Drone Bay** `SMALL` · weight 18 · drain 4/s
Deploys **1 orbital combat drone** with a light kinetic weapon (15 DMG, 2.0 ROF).
Drone: HULL 250, SPEED 200, THREAT 1. Tags: KINETIC / RATE_OF_FIRE.

**Repair Drone Bay** `SMALL` · weight 14 · drain 3/s
Deploys **1 repair drone** (REPAIR_SWARM behavior).
Drone: HULL 180, SPEED 240. Restores 10+ HP/s, scales with REPAIR_RATE tags.

**Decoy Drone Bay** `MEDIUM` · weight 28 · drain 5/s
Deploys **2 decoy drones** (DECOY + KAMIKAZE behavior, THREAT_LEVEL 4).
Drone: HULL 400, SPEED 160. Enemies attack the decoys. Each detonates on destruction.
Synergy: INFESTATION triggers on whatever destroys the decoy.

**Shield Drone Bay** `MEDIUM` · weight 30 · drain 6/s
Deploys **2 shield drones** (SHIELD_DRONE behavior).
Drone: HULL 200, SHIELD 300, SPEED 180. Projects shield fields between ship and incoming fire.
ON_SHIELD_DROP fires for the parent ship when a drone's shield depletes.

**Harvester Drone Bay** `SMALL` · weight 12 · drain 2/s
Deploys **1 harvester drone** (HARVESTER behavior).
Drone: HULL 150, SPEED 280. Autonomously collects items within PICKUP_RADIUS range.
Feeds directly into Scrap Salvager DEBRIS_FIELD pool.

**Heavy Drone Bay** `LARGE` · weight 60 · drain 10/s
Deploys **3 orbital combat drones** with energy beam weapons (25 DPS, 3.0 ROF).
Drone: HULL 400, SPEED 160, THREAT 2. Beam weapons interact with MIRROR / PRISM.
High passive drain — requires good ENERGY_REGEN investment.

---

## UTILITY

**Cargo Expander** `SMALL` · weight 10
+40 CARGO_CAPACITY · +15 PICKUP_RADIUS. Boosts both storage and item collection range.

**Mass Reducer** `MEDIUM` · weight 15
+45 WEIGHT_CAPACITY. Allows heavier weapon and module loadouts before the mobility penalty curve kicks in. Essential for Python and Type-10 full-loadout builds.
> **Draft bonus:** SALVAGE / CARGO_CAPACITY cards appear ×1.3 more often.

---

## WEAPON ENHANCEMENT

Weapon enhancement modules modify stats across all equipped weapons globally.

**Target Tracking Array** `SMALL` · weight 12 · drain 1/s
`WEAPON_ACCURACY_MOD -3°` — reduces spread on all weapons by 3 degrees.
> **Draft bonus:** ACCURACY / VELOCITY / RANGE appear ×1.4 more often.

**Weapon Heat Jacket** `SMALL` · weight 10
`WEAPON_HEAT_GEN_MOD -15%` — reduces per-shot heat generation across all weapons.
> **Draft bonus:** HEAT_DISSIPATION / HEAT_GEN / ON_OVERHEAT appear ×1.3 more often.

**Ammunition Hopper** `SMALL` · weight 14
`WEAPON_AMMO_MOD +8` — adds 8 shots to every weapon magazine.
> **Draft bonus:** AMMO_CAPACITY / RELOAD_SPEED / RATE_OF_FIRE appear ×1.3 more often, 10% more effective.

---

## ACTIVE

**Mine Launcher** `MEDIUM` · weight 35 · drain 5/s
> **Trigger** TIMER every 8s: deploy 1 MINE construct (EXPLOSIVE, 80 DMG, BLAST_RADIUS 50, detection 60u). Mines persist until detonated or expired. GLOBAL_RADIUS tags scale both detection and blast radius.

**Kill Surge** `SMALL` · weight 12
> **Trigger** ON_KILL: +30% TOP_SPEED and +30% RATE_OF_FIRE for 2.5s. Cooldown 0 (every kill). Stacks with existing speed and ROF upgrades from the draft.

---

## PARTNER

Partner modules extend effects to the allied ship when they are within AURA_RADIUS range. AURA_RADIUS tags increase the effective range.

**Link Relay** `MEDIUM` · weight 25 · drain 6/s
Broadcasts AMPLIFICATION and active speed bonuses to the partner. The partner receives the same multipliers you have from your own aura builds.
> Good pairing: Resonance Bard primary + Link Relay on partner ship.

**Repair Beacon** `SMALL` · weight 14 · drain 3/s
+6 REPAIR_RATE (passive, your ship) + extends 50% of your total REPAIR_RATE to the partner as a passive heal when they are in range.

---

## Quick Reference

| Module | Size | Category | Key Effect | Weight | Drain |
|---|---|---|---|---|---|
| Shield Booster | S | SHIELD | +350 SHIELD_MAX | 15 | 0 |
| Shield Capacitor | M | SHIELD | +700 SHIELD / +25 REGEN + draft ×1.4 | 32 | 3 |
| Emergency Shield Cell | M | SHIELD | +300 SHIELD + ON_SHIELD_DROP burst | 28 | 2 |
| Armor Plate | S | HULL | +6% ARMOR | 22 | 0 |
| Hull Reinforcement | M | HULL | +1,200 HULL / +4% ARMOR + draft ×1.3 | 40 | 0 |
| Thruster Pack | S | ENGINE | +25 SPD / +20 ACCEL | 10 | 1 |
| Drive Array | M | ENGINE | +50/40/15 mobility + draft ×1.4 | 22 | 2 |
| Power Cell | S | POWER | +60 GRID / +8 REGEN | 8 | 0 |
| Reactor Module | M | POWER | +140 GRID / +18 REGEN + draft ×1.4 | 20 | 0 |
| Fusion Core | L | POWER | +300 GRID / +40 REGEN + draft ×1.5 ×1.2 | 55 | 0 |
| Cooling Fin | S | THERMAL | +10 HEAT_DISSIPATION | 8 | 0 |
| Cryo Module | M | THERMAL | +22 DISS / +15 CAP + draft ×1.3 | 18 | 2 |
| Auto-Repair Bay | M | REPAIR | +12 REPAIR_RATE + draft ×1.3 | 25 | 2 |
| Combat Drone Bay | S | DRONE | 1× orbital kinetic drone | 18 | 4 |
| Repair Drone Bay | S | DRONE | 1× repair drone | 14 | 3 |
| Decoy Drone Bay | M | DRONE | 2× decoy/kamikaze drones | 28 | 5 |
| Shield Drone Bay | M | DRONE | 2× shield drones | 30 | 6 |
| Harvester Drone Bay | S | DRONE | 1× harvester drone | 12 | 2 |
| Heavy Drone Bay | L | DRONE | 3× orbital energy beam drones | 60 | 10 |
| Cargo Expander | S | UTILITY | +40 CARGO / +15 PICKUP | 10 | 0 |
| Mass Reducer | M | UTILITY | +45 WEIGHT_CAPACITY | 15 | 0 |
| Target Tracking Array | S | WEAPON_ENH | -3° spread all weapons | 12 | 1 |
| Weapon Heat Jacket | S | WEAPON_ENH | -15% heat/shot all weapons | 10 | 0 |
| Ammunition Hopper | S | WEAPON_ENH | +8 ammo all weapons | 14 | 0 |
| Mine Launcher | M | ACTIVE | Deploy mine every 8s | 35 | 5 |
| Kill Surge | S | ACTIVE | ON_KILL: +30% SPD+ROF for 2.5s | 12 | 0 |
| Link Relay | M | PARTNER | Broadcasts buffs to partner | 25 | 6 |
| Repair Beacon | S | PARTNER | Extends REPAIR_RATE to partner | 14 | 3 |
