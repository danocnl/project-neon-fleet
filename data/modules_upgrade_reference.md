# Module Upgrade Reference — Project Neon Fleet

## How module levels work

**Max level:** 20

**Bonus formula:** `stat bonus = passiveBonuses[stat] × level ÷ 20`
- Level 1 gives 1/20th of the listed max effect — barely noticeable
- Level 10 gives half the max effect — meaningful
- Level 20 (MAX) gives the full listed effect — very powerful

**Price formula:** `upgradePrice = basePrice × (1 + (currentLevel − 1) × 0.5)`
- Each upgrade costs 50% more than the previous one
- Level 1 costs exactly `basePrice`
- Level 20 costs `basePrice × 10.5`

---

## Upgrade table

| Module | Base Price | Lv1 Effect | Lv10 Effect | Lv20 MAX Effect | Total to Max |
|---|---|---|---|---|---|
| Shield Booster | 50⬡ | +25 SHIELD_MAX | +250 SHIELD_MAX | +500 SHIELD_MAX | 5,750⬡ |
| Shield Capacitor | 100⬡ | +40 SHIELD_MAX · +2 SHIELD_REGEN/s | +400 SHIELD_MAX · +20 SHIELD_REGEN/s | +800 SHIELD_MAX · +40 SHIELD_REGEN/s | 11,500⬡ |
| Emergency Shield Cell | 120⬡ | +30 SHIELD_MAX | +300 SHIELD_MAX | +600 SHIELD_MAX | 13,800⬡ |
| Armor Plate | 60⬡ | +0.4% ARMOR | +4% ARMOR | +8% ARMOR | 6,900⬡ |
| Hull Reinforcement | 110⬡ | +15 HULL · +0.25% ARMOR | +150 HULL · +2.5% ARMOR | +300 HULL · +5% ARMOR | 12,650⬡ |
| Thruster Pack | 55⬡ | +5 TOP_SPEED · +4 ACCELERATION | +50 TOP_SPEED · +40 ACCELERATION | +100 TOP_SPEED · +80 ACCELERATION | 6,325⬡ |
| Drive Array | 120⬡ | +8 TOP_SPEED · +6 ACCEL · +2 TURN | +80 TOP_SPEED · +60 ACCEL · +20 TURN | +160 TOP_SPEED · +120 ACCEL · +40 TURN | 13,800⬡ |
| Power Cell | 45⬡ | +10 ENERGY_GRID · +1.5 ENERGY_REGEN/s | +100 ENERGY_GRID · +15 ENERGY_REGEN/s | +200 ENERGY_GRID · +30 ENERGY_REGEN/s | 5,175⬡ |
| Reactor Module | 110⬡ | +20 ENERGY_GRID · +3 ENERGY_REGEN/s | +200 ENERGY_GRID · +30 ENERGY_REGEN/s | +400 ENERGY_GRID · +60 ENERGY_REGEN/s | 12,650⬡ |
| Fusion Core | 280⬡ | +40 ENERGY_GRID · +6 ENERGY_REGEN/s | +400 ENERGY_GRID · +60 ENERGY_REGEN/s | +800 ENERGY_GRID · +120 ENERGY_REGEN/s | 32,200⬡ |
| Cooling Fin | 45⬡ | +3 HEAT_DISSIPATION/s | +30 HEAT_DISSIPATION/s | +60 HEAT_DISSIPATION/s | 5,175⬡ |
| Cryo Module | 100⬡ | +5 HEAT_DISS/s · +3 HEAT_CAPACITY | +50 HEAT_DISS/s · +30 HEAT_CAPACITY | +100 HEAT_DISS/s · +60 HEAT_CAPACITY | 11,500⬡ |
| Auto-Repair Bay | 115⬡ | +3 REPAIR_RATE HP/s | +30 REPAIR_RATE HP/s | +60 REPAIR_RATE HP/s | 13,225⬡ |
| Combat Drone Bay | 90⬡ | +2 DRONE_DAMAGE | +15 DRONE_DAMAGE | +30 DRONE_DAMAGE | 10,350⬡ |
| Repair Drone Bay | 80⬡ | +2 REPAIR_RATE HP/s | +15 REPAIR_RATE HP/s | +30 REPAIR_RATE HP/s | 9,200⬡ |
| Decoy Drone Bay | 140⬡ | +0.2 THREAT_LEVEL | +2 THREAT_LEVEL | +4 THREAT_LEVEL | 16,100⬡ |
| Shield Drone Bay | 150⬡ | +20 DRONE_SHIELD | +200 DRONE_SHIELD | +400 DRONE_SHIELD | 17,250⬡ |
| Harvester Drone Bay | 75⬡ | +3u PICKUP_RADIUS | +30u PICKUP_RADIUS | +60u PICKUP_RADIUS | 8,625⬡ |
| Heavy Drone Bay | 300⬡ | +3 DRONE_DAMAGE | +30 DRONE_DAMAGE | +60 DRONE_DAMAGE | 34,500⬡ |
| Cargo Expander | 40⬡ | +5 CARGO · +3u PICKUP | +50 CARGO · +30u PICKUP | +100 CARGO · +60u PICKUP | 4,600⬡ |
| Mass Reducer | 80⬡ | +5 WEIGHT_CAPACITY | +50 WEIGHT_CAPACITY | +100 WEIGHT_CAPACITY | 9,200⬡ |
| Target Tracking Array | 70⬡ | −0.6° spread (all weapons) | −6° spread | −12° spread | 8,050⬡ |
| Weapon Heat Jacket | 65⬡ | −3% HEAT_GEN (all weapons) | −30% HEAT_GEN | −60% HEAT_GEN | 7,475⬡ |
| Ammunition Hopper | 60⬡ | +2 shots (all weapons) | +15 shots | +30 shots | 6,900⬡ |
| Link Relay | 120⬡ | +0.25 BROADCAST | +2.5 BROADCAST | +5 BROADCAST | 13,800⬡ |
| Repair Beacon | 70⬡ | +2 REPAIR_RATE HP/s (to partner) | +15 HP/s | +30 HP/s | 8,050⬡ |

---

## Price per level reference (Shield Booster, 50⬡ base)

| Level | Cost | Cumulative |
|---|---|---|
| 1 | 50⬡ | 50⬡ |
| 2 | 75⬡ | 125⬡ |
| 3 | 100⬡ | 225⬡ |
| 5 | 150⬡ | 475⬡ |
| 10 | 275⬡ | 1,625⬡ |
| 15 | 400⬡ | 3,625⬡ |
| 20 | 525⬡ | 5,750⬡ |

For any other module: multiply costs by `basePrice ÷ 50`.
Example: Cryo Module (100⬡) costs exactly 2× the above.

---

## Notable maxed-out combinations

**Maxed Shield Booster (Sidewinder, 100 base shield):**
+500 SHIELD_MAX → 600 total = 6× the base

**Maxed Thruster Pack (Mamba, 620 base speed):**
+100 TOP_SPEED → 720 total = 16% faster

**Maxed Fusion Core (energy builds):**
+800 ENERGY_GRID → sustains beam weapons + drones indefinitely

**Maxed Cryo Module + Cooling Fin × 3 (Mamba beam build):**
Total HEAT_DISSIPATION: +100 + 3×60 = +280 /s on top of Mamba's 55 base = 335 /s
Heavy Beam passive heat: 22/s → easily manageable
