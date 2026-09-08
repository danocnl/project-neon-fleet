# **Game Design Document: Project Neon Fleet**

## **1\. Executive Summary**

* **Working Title:** Project Neon Fleet  
* **Genre:** 2-Player Co-op Incremental Roguelike Autobattler  
* **Target Platforms:** PC (Primary / Direct UI), Mobile (Secondary Target / Touch-Optimized UI)  
* **Visual Style:** High-contrast, *Geometry Wars*\-inspired vector graphics. Dark space grid arena, vibrant neon wireframes, crisp particle physics, and clean numerical overlays.  
* **Core Philosophy:** A continuous, persistent universe combining the low-friction automation of idle/incremental games (*Melvor Idle*) with the strategic build depth, Nova Drift-style recursive drafting, and cooperative synergy of an automated 2-player fleet.

## **2\. Core Gameplay Loop**

```
  +-----------------------------------------------------------------+
  |                        GALAXY SECTOR MAP                        |
  |    Continuous background sector traversal & resource mining     |
  +-----------------------------------------------------------------+
                                  |
                                  v
  +-----------------------------------------------------------------+
  |                       COMBAT AUTOMATION                         |
  |     Vector-driven, 2-player automated ship behavior loops       |
  +-----------------------------------------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
  [ACTIVE PLAY SESSIONS]                       [BENCHMARK RETREAT]
  * Real-time strategic interventions           * Fleet hull drops to 0 HP
  * High-value anomaly events                  * Auto-warp to safe sector
  * Co-op sector boss pushes                   * Pay resource repair fee
  * Tactical logic drafting                     * Insurance policies mitigate
            |                                           |
            +---------------------+---------------------+
                                  |
                                  v
  +-----------------------------------------------------------------+
  |                  INCREMENTAL PROGRESSION & SEASONS              |
  |    Spend currencies -> Upgrade hull/modules -> Seasonal Resets  |
  +-----------------------------------------------------------------+
```

### **Session Structure & Player Engagement**

* **Idle System:** The 2-ship fleet continuously fights through automated sector waves, gathering base resources offline or in the background.  
* **Active Interventions:** Players log in to handle strategic bottlenecks:  
  * **Sector Anomaly Invasions:** Limited-time events requiring live module tweaking.  
  * **Sector Boss Pushes:** Tactical gates that require active 2-player co-op coordination and precise logic optimization to defeat.  
  * **Roguelike Draft Choices:** Choosing branch paths and module unlocks that alter the current sector run.  
* **Seasonal Model:** Worlds, galaxies, and economy reset on a seasonal schedule. Each season introduces unique cosmic modifiers (e.g., *Solar Flares: \+50% Laser Damage, Shield Regen Reduced by 80%*).

## **3\. Hardware vs. Software Systems (The 9x9 Matrix)**

Ships are completely decoupled into **Physical Vessels (Hardware Frames)** and **Class Specializations (Software Logic)**, creating an 81-combination matrix before drafting begins.

### **9 Ship Chassis Frames (Hardware)**

Dictates physical size, weight class, stat baseline, hardpoints, and handling:

1. **Sidewinder Frame (Agile Scout):** Light | Max Speed, Max Handling, 15% Evasion  
2. **Cobra Frame (Multi-Role Speedster):** Light | Balanced Speed, High Shields, Versatile Slots  
3. **Mamba Frame (Dragster Interceptor):** Light | Max Velocity, Heat Dissipation, Energy Efficiency  
4. **Krait Frame (Strike Carrier):** Medium | Dual Drone Bays, Front Firepower, Med Mobility  
5. **Chieftain Frame (Kinetic Brawler):** Medium | High Handling, Heavy Armor, Impact Resist  
6. **Python Frame (Heavy Gunship):** Medium | Max Hardpoints, Max Slots, Thick Shields  
7. **Anaconda Frame (Flying Fortress):** Heavy | Massive Hull, Massive Shields, Long Range  
8. **Cutter Frame (Shield Dreadnought):** Heavy | Max Shields, High Momentum, Front Line Presence  
9. **Type-10 Frame (Heavy Ordnance Array):** Heavy | Max Armor, 360° Turrets, Status Immunity

### **9 Class Specializations (Software Logic)**

Dictates tag pools, conditional triggers, and 2-player co-op synergies:

1. **Chrono Architect:** Support/Utility | Time distortion, cooldown reduction, faster execution loops.  
2. **Quantum Entangler:** Control/Debuff | Tethers targets, echoes single-target damage across fleets.  
3. **Hyper-Conductor:** Offense/Energy | Converts heat to power, triggers high-voltage EMP discharges.  
4. **Graviton Weaver:** Spatial/Defense | Singularities, pulls enemy waves into dense clusters.  
5. **Nanite Swarm Controller:** Sustain/Support | Self-replicating swarms, armor stripping, team hull repair.  
6. **Phase Weaver:** Defense/Mobility | Phase-dashing, temporary invulnerability, shield bypass.  
7. **Resonance Bard:** Buff/Synergy | Aura stacking, harmonic team stat multipliers, power feeding.  
8. **Scrap Salvager:** Defense/Kinetic | Converts destroyed enemy debris into physical barriers.  
9. **Vector Specialist:** Offense/Lasers | Reflective prisms, splitting beams, multi-angle ricochets.

## **4\. Cooperative Synergies & Combat Automation**

Combat is fully automated based on pre-set logic loops. Strategic depth comes from how 2 players program their ships to trigger off one another:

* **Cross-Fleet Chaining Examples:**  
  * **P1 Heat-Generator \+ P2 Hyper-Conductor:** Player 1’s Mamba generates extreme internal heat $\\rightarrow$ Player 2’s Hyper-Conductor siphons Player 1’s heat to charge map-wide EMP lightning pulses.  
  * **P1 Graviton Weaver \+ P2 Heavy DPS:** Player 1 pulls an entire wave into a micro-singularity $\\rightarrow$ Player 2’s Python fires piercing heavy line beams through 100% of the compressed wave.  
  * **P1 Laser Build \+ P2 Vector Specialist:** Player 1 fires heavy beam weapons $\\rightarrow$ Player 2 deploys reflective prisms that split Player 1's lasers into an auto-aiming screen-clearing matrix.

## **5\. Tag System & Progression Architecture**

Upgrades drop via a *Nova Drift*\-style tag-based drafting engine. Player choices are categorized across 5 Tag Buckets: \[SHIP\], \[WEAPON\], \[CONSTRUCT\], \[SPECIALIZATION\], and \[LOGIC\].

### **3 Upgrade Archetypes**

1. **Stat Modifiers (Common / Tier 1):** Baseline stat trade-offs (e.g., *\+35% Armor, \-15% Turn Speed*).  
2. **Logic & Trigger Modules (Uncommon / Tier 2):** Automated IF/THEN routines (e.g., *IF Ally HP \< 25% THEN Deploy Shield-Tether*).  
3. **Converters & Apex Keystones (Rare / Tier 3+):** Requires prerequisite tag counts to unlock game-changing mechanical shifts (e.g., *Singularity Detonation Matrix*).

## **6\. Defeat, Failure & Economy Mechanics**

* **Benchmark Warp System:** When the fleet's hull hits 0 HP, emergency nav-computers warp both ships back to the nearest safe Galaxy Benchmark.  
* **Repair Costs:** Restoring hull and system integrity costs collected sector currency.  
* **Insurance Policies:** Players can allocate idle currency toward customizable Insurance Policies to mitigate repair costs, hedge against high-tier boss pushes, or auto-repair over time.

## **7\. Meta-Progression & Analytics**

* **Fleet Analytics:** Permanent tracking of total lifetime damage, shield absorption, mob kills, and sector milestones.  
* **Framework Upgrades:** Permanent blueprint unlocks for ship frames, base energy grid capacity, and specialized logic slots.

