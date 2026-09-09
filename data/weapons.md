# Weapons — Project Neon Fleet

14 base weapons across 4 sizes and 5 damage types.

**Design philosophy:** Base weapons are mechanically distinct but moderate in power. Strength comes from upgrade drafting — CHAIN×4 on an Arc Cannon means 6 chain jumps per shot, PIERCE×5 on a Gauss Cannon cuts through entire formations. Base values define the mechanic; upgrades define the madness.

**Stat notes:**
- `DAMAGE` — per-shot damage. For BEAM weapons this is DPS (damage per second), not per-shot.
- `RATE_OF_FIRE` — shots per second. 0 = continuous beam or pulse (no discrete shots).
- `AMMO_CAPACITY` — shots before reload. 0 = infinite (beam/pulse weapons).
- `PASSIVE_DRAIN` — energy/s drawn while weapon is active, regardless of firing.
- `PASSIVE_HEAT` — heat/s generated while weapon is running, regardless of firing.
- `WEIGHT` — contributes to ship WEIGHT_CAPACITY. Exceeding capacity penalises mobility.
- `CHARGE_TIME` — seconds between trigger and shot. Automation loop must account for this.
- `FIRING_ARC` — targeting cone in degrees centred on mount position. Weapons only engage targets within this arc. Upgradeable via `FIRING_ARC` draft tag (+30° per stack, cap 360°).
- `MOUNT_POSITION` — `FORWARD` (arc off nose) · `TURRET` (rotates freely, 360°) · `REAR` (arc off tail)

**TURRET_ARRAY** (Type-10 special tag) converts ALL equipped weapons to 360° targeting regardless of their natural FIRING_ARC. A Railgun or Gauss Cannon on a Type-10 becomes a full-rotation precision weapon.

**Size → slot required:** SMALL fits WEAPON_SLOT_SMALL+. MEDIUM fits WEAPON_SLOT_MEDIUM+. Etc.

---

## Chainguns — KINETIC

All chainguns benefit from: `KINETIC`, `RATE_OF_FIRE`, `AMMO_CAPACITY`, `ACCURACY` upgrade tags.

### Light Chaingun `SMALL`
Rapid-fire ballistic. Low per-shot damage compensated by extreme fire rate. The entry-level kinetic option — fits the Sidewinder and Mamba's 2× SMALL slots without breaking their weight budget.

| Stat | Value |
|---|---|
| DAMAGE | 8 per shot |
| RATE_OF_FIRE | 8.0 shots/s |
| AMMO_CAPACITY | 40 |
| RELOAD_SPEED | 1.5s |
| RANGE | 250u |
| ACCURACY | 8° spread |
| VELOCITY | 380 u/s |
| ENERGY_COST | 3 /shot |
| HEAT_GEN | 3 /shot |
| WEIGHT | 12 |

*Upgrade potential: RATE_OF_FIRE tags push this to 14+ shots/s. AMMO_CAPACITY removes reload gaps entirely.*

---

### Chaingun `MEDIUM`
Standard workhorse kinetic. Reliable, well-rounded. Fills the medium slot on Krait, Chieftain, Python.

| Stat | Value |
|---|---|
| DAMAGE | 18 per shot |
| RATE_OF_FIRE | 6.0 shots/s |
| AMMO_CAPACITY | 60 |
| RELOAD_SPEED | 2.0s |
| RANGE | 300u |
| ACCURACY | 6° spread |
| VELOCITY | 400 u/s |
| ENERGY_COST | 6 /shot |
| HEAT_GEN | 5 /shot |
| WEIGHT | 28 |

---

### Heavy Chaingun `LARGE`
High-calibre rotary. Slower cycle but each round hits significantly harder. Meaningful heat output.

| Stat | Value |
|---|---|
| DAMAGE | 38 per shot |
| RATE_OF_FIRE | 4.0 shots/s |
| AMMO_CAPACITY | 80 |
| RELOAD_SPEED | 2.5s |
| RANGE | 340u |
| ACCURACY | 5° spread |
| VELOCITY | 420 u/s |
| ENERGY_COST | 10 /shot |
| HEAT_GEN | 8 /shot |
| WEIGHT | 65 |

---

### Rotary Cannon `XL`
Capital-grade rotating barrel array. Extreme rate of fire at XL scale. Only the Type-10 has the hardpoint and energy capacity to run one. Significant passive drain.

| Stat | Value |
|---|---|
| DAMAGE | 28 per shot |
| RATE_OF_FIRE | 12.0 shots/s |
| AMMO_CAPACITY | 200 |
| RELOAD_SPEED | 3.0s |
| RANGE | 360u |
| ACCURACY | 4° spread |
| VELOCITY | 450 u/s |
| ENERGY_COST | 5 /shot |
| HEAT_GEN | 6 /shot |
| PASSIVE_DRAIN | 8 energy/s |
| PASSIVE_HEAT | 4 heat/s |
| WEIGHT | 140 |

---

## Lasers — ENERGY · BEAM

All beams benefit from: `ENERGY`, `BEAM`, `RANGE` tags. Continuous beam weapons cannot use `RICOCHET` (no surface bounce) but fully interact with `MIRROR`, `PRISM`, and `REFLECTION`.

### Pulse Laser `SMALL`
Rapid-pulse energy beam. Infinite ammo, zero spread. Consistent and efficient. Natural fit for Vector Specialist builds — every pulse interacts with placed mirrors and prisms.

| Stat | Value |
|---|---|
| DAMAGE | 10 per pulse |
| RATE_OF_FIRE | 6.0 pulses/s |
| AMMO_CAPACITY | ∞ |
| RANGE | 300u |
| ACCURACY | 0° (perfect) |
| VELOCITY | instant |
| ENERGY_COST | 8 /pulse |
| HEAT_GEN | 5 /pulse |
| PASSIVE_DRAIN | 2 energy/s |
| PASSIVE_HEAT | 1 heat/s |
| WEIGHT | 15 |
| **BEAM** | **true** |

---

### Beam Laser `MEDIUM`
Continuous cutting beam. DAMAGE is DPS. No ammo. Significant passive heat — HEAT_DISSIPATION modules are mandatory at sustained output. Fully redirectable by mirrors.

| Stat | Value |
|---|---|
| DAMAGE | 55 DPS |
| RATE_OF_FIRE | continuous |
| AMMO_CAPACITY | ∞ |
| RANGE | 380u |
| ACCURACY | 0° (perfect) |
| VELOCITY | instant |
| PASSIVE_DRAIN | 14 energy/s |
| PASSIVE_HEAT | 10 heat/s |
| WEIGHT | 35 |
| **BEAM** | **true** |

*Upgrade potential: `ENERGY` tags push DPS significantly. `RANGE` extends the beam's reach. `PRISM` splits it into multiple simultaneous beams.*

---

### Heavy Beam `LARGE`
High-power continuous beam array. Exceptional DPS but extreme passive heat. Ships without dedicated cooling modules will overheat within seconds of activation — even before firing other weapons.

| Stat | Value |
|---|---|
| DAMAGE | 130 DPS |
| RATE_OF_FIRE | continuous |
| AMMO_CAPACITY | ∞ |
| RANGE | 450u |
| ACCURACY | 0° (perfect) |
| VELOCITY | instant |
| PASSIVE_DRAIN | 28 energy/s |
| PASSIVE_HEAT | 22 heat/s |
| WEIGHT | 75 |
| **BEAM** | **true** |

---

## Railguns — KINETIC · PIERCE

All railguns benefit from: `KINETIC`, `PIERCE`, `VELOCITY`, `RANGE` tags. No reload needed — charge, fire, repeat.

### Railgun `MEDIUM`
Electromagnetic accelerator. Extreme single-shot damage. Requires 1.5s charge before firing. Pierces through 2 enemies per shot. No small variant — the mechanism requires minimum barrel length.

| Stat | Value |
|---|---|
| DAMAGE | 130 per shot |
| RATE_OF_FIRE | 0.5 shots/s |
| CHARGE_TIME | 1.5s |
| AMMO_CAPACITY | 1 (auto-recharge) |
| RANGE | 650u |
| ACCURACY | 0° (perfect) |
| VELOCITY | 900 u/s |
| ENERGY_COST | 28 /shot |
| HEAT_GEN | 20 /shot |
| WEIGHT | 44 |
| **PIERCE** | **2** |

---

### Gauss Cannon `LARGE`
Capital-grade electromagnetic slug thrower. Devastating per-shot damage at extreme range. Pierces 3 enemies. Long charge time — the automation loop must be designed around it.

| Stat | Value |
|---|---|
| DAMAGE | 300 per shot |
| RATE_OF_FIRE | 0.25 shots/s |
| CHARGE_TIME | 2.5s |
| AMMO_CAPACITY | 1 (auto-recharge) |
| RANGE | 900u |
| ACCURACY | 0° (perfect) |
| VELOCITY | 1400 u/s |
| ENERGY_COST | 48 /shot |
| HEAT_GEN | 36 /shot |
| WEIGHT | 90 |
| **PIERCE** | **3** |

*Upgrade potential: PIERCE tags push this through entire formations. RETURN makes it pierce twice. SPLIT fires multiple slugs simultaneously.*

---

## Missiles — EXPLOSIVE

All missiles benefit from: `EXPLOSIVE`, `BLAST_RADIUS`, `AMMO_CAPACITY`, `GLOBAL_RADIUS` tags.

### Micro Missile `SMALL`
Compact self-guided explosive. Limited magazine. AoE detonation — effective against clustered enemies. Pairs well with Graviton Weaver compression builds.

| Stat | Value |
|---|---|
| DAMAGE | 40 per shot |
| RATE_OF_FIRE | 1.5 shots/s |
| AMMO_CAPACITY | 6 |
| RELOAD_SPEED | 2.0s |
| RANGE | 350u |
| ACCURACY | 2° |
| VELOCITY | 240 u/s |
| BLAST_RADIUS | 40u |
| ENERGY_COST | 8 /shot |
| HEAT_GEN | 4 /shot |
| WEIGHT | 20 |

---

### Torpedo `MEDIUM`
Heavy self-guided warhead. Massive AoE detonation radius. Very slow fire rate, tiny magazine — each shot must count. Best fired into compressed enemy clusters for maximum simultaneous hits.

| Stat | Value |
|---|---|
| DAMAGE | 160 per shot |
| RATE_OF_FIRE | 0.35 shots/s |
| AMMO_CAPACITY | 3 |
| RELOAD_SPEED | 4.0s |
| RANGE | 500u |
| ACCURACY | 1° |
| VELOCITY | 180 u/s |
| BLAST_RADIUS | 100u |
| ENERGY_COST | 20 /shot |
| HEAT_GEN | 10 /shot |
| WEIGHT | 42 |

*Upgrade potential: `GLOBAL_RADIUS` tags push blast radius to 200u+. `SPLIT` fires multiple warheads per shot. `CHAIN` detonation chains damage to nearby enemies.*

---

## Special Weapons

### EMP Cannon `MEDIUM`
Fires a pulsed electromagnetic charge that disables enemy shields and weapon routines for 1.5s on hit. Pairs with VOLTAGE builds — EMP strips shields, electrical damage then hits hull directly.

Benefits from: `ENERGY`, `EMP`, `RATE_OF_FIRE` tags.

| Stat | Value |
|---|---|
| DAMAGE | 30 per shot |
| RATE_OF_FIRE | 1.0 shots/s |
| AMMO_CAPACITY | 10 |
| RELOAD_SPEED | 2.5s |
| RANGE | 350u |
| VELOCITY | 300 u/s |
| ENERGY_COST | 22 /shot |
| HEAT_GEN | 8 /shot |
| WEIGHT | 35 |
| **STATUS** | **EMP 1.5s** |

---

### Arc Cannon `MEDIUM`
Fires a high-voltage bolt that arcs to 2 additional nearby targets on impact, retaining 70% damage per jump. Natural synergy with Quantum Entangler tether networks — chain shots propagate along existing tether links.

Benefits from: `ENERGY`, `CHAIN`, `TETHER`, `DAMAGE_SHARE` tags.

| Stat | Value |
|---|---|
| DAMAGE | 42 per shot |
| RATE_OF_FIRE | 1.2 shots/s |
| AMMO_CAPACITY | 8 |
| RELOAD_SPEED | 2.0s |
| RANGE | 320u |
| VELOCITY | 350 u/s |
| ENERGY_COST | 16 /shot |
| HEAT_GEN | 10 /shot |
| WEIGHT | 38 |
| **CHAIN** | **2 jumps** |

*Upgrade potential: CHAIN tags push this to 8+ jumps. Combined with TETHER and DAMAGE_SHARE, one shot can cascade across an entire tethered enemy group.*

---

### Shockwave Emitter `MEDIUM`
Generates a kinetic pressure wave radiating outward from the ship every 3 seconds, damaging all enemies within 180u simultaneously. No targeting required — fires automatically. Natural fit for Resonance Bard aura builds where AURA_RADIUS and PULSE_RADIUS stack together.

Benefits from: `KINETIC`, `PULSE`, `PULSE_RADIUS`, `AURA_RADIUS`, `GLOBAL_RADIUS` tags.

| Stat | Value |
|---|---|
| DAMAGE | 45 per pulse |
| PULSE_RADIUS | 180u |
| PULSE_INTERVAL | 3.0s |
| PASSIVE_DRAIN | 10 energy/s |
| PASSIVE_HEAT | 3 heat/s |
| WEIGHT | 40 |
| **PULSE** | **true** |

*Upgrade potential: PULSE_RADIUS and GLOBAL_RADIUS tags push the shockwave out to 400u+. FREQUENCY reduces the interval to under 1 second.*

---

## Quick Reference

| Weapon | Size | Type | DMG | ROF | Arc | Mount | Weight | Special |
|---|---|---|---|---|---|---|---|---|
| Light Chaingun | SMALL | KINETIC | 8/shot | 8.0/s | 90° | FORWARD | 12 | — |
| Chaingun | MEDIUM | KINETIC | 18/shot | 6.0/s | 90° | FORWARD | 28 | — |
| Heavy Chaingun | LARGE | KINETIC | 38/shot | 4.0/s | 60° | FORWARD | 65 | — |
| Rotary Cannon | XL | KINETIC | 28/shot | 12.0/s | 360° | TURRET | 140 | PASSIVE |
| Pulse Laser | SMALL | ENERGY | 10/pulse | 6.0/s | 90° | FORWARD | 15 | BEAM |
| Beam Laser | MEDIUM | ENERGY | 55 DPS | continuous | 45° | FORWARD | 35 | BEAM · PASSIVE |
| Heavy Beam | LARGE | ENERGY | 130 DPS | continuous | 30° | FORWARD | 75 | BEAM · HIGH PASSIVE |
| Railgun | MEDIUM | KINETIC | 130/shot | 0.5/s | 15° | FORWARD | 44 | PIERCE×2 · CHARGE 1.5s |
| Gauss Cannon | LARGE | KINETIC | 300/shot | 0.25/s | 10° | FORWARD | 90 | PIERCE×3 · CHARGE 2.5s |
| Micro Missile | SMALL | EXPLOSIVE | 40/shot | 1.5/s | 180° | FORWARD | 20 | BLAST 40u |
| Torpedo | MEDIUM | EXPLOSIVE | 160/shot | 0.35/s | 120° | FORWARD | 42 | BLAST 100u |
| EMP Cannon | MEDIUM | ENERGY | 30/shot | 1.0/s | 120° | FORWARD | 35 | EMP 1.5s |
| Arc Cannon | MEDIUM | ENERGY | 42/shot | 1.2/s | 90° | FORWARD | 38 | CHAIN×2 |
| Shockwave Emitter | MEDIUM | KINETIC | 45/pulse | — | 360° | TURRET | 40 | PULSE 180u |
