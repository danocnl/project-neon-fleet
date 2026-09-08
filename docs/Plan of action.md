# **Project Neon Fleet: Game Design & Technical Roadmap (2-Player Co-op)**

## **Executive Overview**

**Project Neon Fleet** is a 2-player co-op, vector-styled (*Geometry Wars*), incremental autobattler designed natively for PC with a scale path to mobile. Players configure hardware (**Ship Frames**) and software (**Class Specializations**) to create a 9x9 matrix (81 starting permutations) of automated logic loops, running *Nova Drift*\-style tag-based recursive draft upgrades during active sector runs.

## **1\. System Architecture & Data Model**

Before UI or visual rendering, the back-end is constructed around a unified **Tag Aggregator Engine**. All game objects—Ships, Classes, Weapons, and Upgrades—share a single tag protocol.

### **Core Data Flows**

* **Loadout State:** Player selection (Ship \+ Class) generates an initial starting\_tags JSON payload.  
* **Tag Aggregator:** A centralized manager that listens to drafted cards during a run, dynamically re-calculating stat multipliers and unlocking higher-tier logic triggers.  
* **Event-Driven Combat Loop:** Combat events (ON\_OVERHEAT, ON\_SHIELD\_DROP, ALLY\_LOW\_HP) evaluate player logic triggers in real time without direct manual flight controls.

## **2\. Loadout & Lobby UI Framework**

The loadout screen serves as the transition point between meta-progression and active gameplay. It educates players on tag relationships and cross-fleet synergies between the **2 paired ships** before a run begins.

```
+-----------------------------------------------------------------------------------+
|  STEP 1: SELECT CHASSIS     |  STEP 2: SELECT SPECIALIZATION  |  STEP 3: FLEET LOBBY |
|  [ Sidewinder ]             |  [ Chrono Architect ]          |  P1: Ready (Host)    |
|  [ Cobra ]                  |  [ Quantum Entangler ]         |  P2: Ready           |
|  [ Mamba ] (Active)         |  [ Hyper-Conductor ] (Active)  |                      |
+-----------------------------+--------------------------------+--------------------+
|                                                                                   |
|                              CENTRAL PREVIEW VIEWPORT                             |
|              * 2D/3D Vector Blueprint Wireframe of Selected Chassis *             |
|              * Holographic Class Overlay / Particle Aura Geometry *               |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|                                  TAG PROFILE SUMMARY                              |
|  PRIMARY TAGS:   [MAX_VELOCITY] [HEAT_DISSIPATION] [HEAT_DISSIPATION] [ENERGY_GRID] |
|  SECONDARY TAGS: [LOW_HANDLING] [WEAK_REAR_ARMOR] [ENERGY] [EMP]                  |
|  SYNERGY GRADE:  [S TIER] (High Synergy: Heat-to-Speed + Heat-to-Power Duo)       |
+-----------------------------------------------------------------------------------+
```

### **UI Features**

* **Chassis Panel (Left):** Selects physical hardware framework (Light, Medium, Heavy) and displays physical base stats.  
* **Specialization Panel (Right):** Selects class logic (Chrono, Quantum, Hyper-Conductor, etc.) and displays passive logic routines.  
* **Vector Blueprint Viewport (Center):** Interactive 2D/3D wireframe render of the chassis with Class particle/aura overlays.  
* **Real-Time Tag Profiler (Bottom):** Merges chassis and class tags live, showing an **S/A/B/C Synergy Rank** and an active dual-tether synergy line connecting Player 1 and Player 2's loadouts (*"P1's Heat-Generating Mamba fuels P2's Hyper-Conductor Lightning\!"*).

## **3\. Detailed Master Implementation Plan**

### **Phase 1: Core System Architecture & Data Schema**

**Goal:** Establish the foundational code data structures, tag parsing logic, and back-end state managers.

* \[ \] **1.1 JSON/Scriptable Object Schema Definition**  
  * \[ \] Define ShipFrame data structure (ID, WeightClass, BaseStats, HardwareTags\[\]).  
  * \[ \] Define ClassSpecialization data structure (ID, Role, PrimaryTags\[\], SecondaryTags\[\], CoopSynergyDesc).  
  * \[ \] Define UpgradeCard data structure (ID, Tier, PrerequisiteTags\[\], GrantedTags\[\], StatModifiers, LogicTrigger).  
* \[ \] **1.2 Tag Aggregator Engine**  
  * \[ \] Build global tag tracker to sum active tags per ship instance.  
  * \[ \] Implement stat-recalculation pipeline (re-evaluating multipliers whenever a tag is added or removed).  
* \[ \] **1.3 Data Import**  
  * \[ \] Export and convert master tables for the 9 Ship Chassis into system JSON.  
  * \[ \] Export and convert master tables for the 9 Class Specializations into system JSON.  
  * \[ \] Populate initial tag dictionary (\[SHIP\], \[WEAPON\], \[CONSTRUCT\], \[SPECIALIZATION\], \[LOGIC\]).

### **Phase 2: Vector Art Engine & Physics Sandbox**

**Goal:** Build the high-contrast neon visual presentation and basic 2D spatial movement math.

* \[ \] **2.1 Graphics & Shader Pipeline**  
  * \[ \] Create dark grid space background shader with subtle parallax scaling.  
  * \[ \] Develop high-contrast neon vector line shader with customizable color channels (Cyan, Magenta, Gold).  
  * \[ \] Configure bloom, blur, and chromatic aberration post-processing stack (*Geometry Wars* aesthetic).  
* \[ \] **2.2 Spatial Movement & Physics**  
  * \[ \] Implement 2D Newtonian/Vector ship movement physics (Velocity, Acceleration, Mass, Drift/Inertia).  
  * \[ \] Build basic automated navigation AI routines (Orbit, Chase Target, Maintain Distance, Kite).  
* \[ \] **2.3 Prototyping Chassis**  
  * \[ \] Render wireframes for 3 test hulls: **Sidewinder** (Light), **Chieftain** (Medium), **Anaconda** (Heavy).  
  * \[ \] Verify stat differentiation (verify Sidewinder feels nimble while Anaconda feels like a slow, massive fortress).

### **Phase 3: Selection UI & Lobby Integration**

**Goal:** Construct the pre-run interface where the 2 players combine hardware, software, and generate their initial tag payloads.

* \[ \] **3.1 UI Layout & Viewport**  
  * \[ \] Build 3-panel screen layout (Chassis List, Central Viewport, Specialization List).  
  * \[ \] Hook up central viewport to render rotating wireframe preview models of selected ship frames.  
  * \[ \] Add class overlay visual effects to the viewport model (e.g., electric arcs for Hyper-Conductor).  
* \[ \] **3.2 Dynamic Tag Profiler & Synergy Evaluator**  
  * \[ \] Write dynamic calculation script that merges Chassis Tags \+ Class Tags into a single initial pool.  
  * \[ \] Code synergy evaluator to output **S/A/B/C ranks** based on 2-player matrix synergy rules.  
* \[ \] **3.3 Loadout-to-Game Payload Pipeline**  
  * \[ \] Wire up the "LAUNCH SECTOR RUN" button to serialize both players' selections into a clean JSON startup profile.

### **Phase 4: Event-Driven Automation Engine**

**Goal:** Create the "brain" of the autobattler that executes targeting, abilities, and upgrades conditionally.

* \[ \] **4.1 Event Dispatcher System**  
  * \[ \] Implement core combat event listeners (ON\_HIT, ON\_CRIT, ON\_KILL, ON\_SHIELD\_DROP, ON\_OVERHEAT).  
  * \[ \] Implement spatial event listeners (IN\_RANGE, PROXIMITY, FRONTAL\_ARC).  
  * \[ \] Implement team event listeners (ALLY\_LOW\_HP, ALLY\_TARGETED, DUO\_CLUSTER).  
* \[ \] **4.2 Trigger Evaluator**  
  * \[ \] Build logic listener script that checks if conditions match drafted logic module requirements (e.g., IF ON\_OVERHEAT THEN TRIGGER PHASE\_SHIFT).

### **Phase 5: Draft System & Recursive Progression**

**Goal:** Implement the *Nova Drift*\-style level-up selection screen and upgrade mechanics during a run.

* \[ \] **5.1 Card Pool Generator & Filtering**  
  * \[ \] Build card-rolling algorithm that picks 3 to 5 hexagonal cards on level-up.  
  * \[ \] Implement tag prerequisite checks (e.g., hide Keystone cards until player holds $\\ge 3$ matching tags).  
  * \[ \] Apply class weighting (skewing card drop probabilities based on chosen Class Specialization).  
* \[ \] **5.2 Upgrade Archetype Implementation**  
  * \[ \] Code Tier 1 **Stat Mutators** (e.g., \+Armor / \-Handling).  
  * \[ \] Code Tier 2 **Logic & Trigger Modules** (e.g., Emergency Shield-Tether Array).  
  * \[ \] Code Tier 3 **Converters & Keystones** (e.g., Singularity Detonation Matrix).  
* \[ \] **5.3 Reroll & UI Interface**  
  * \[ \] Build hexagonal card draft UI overlay.  
  * \[ \] Implement reroll currency spending system.

### **Phase 6: Networking & 2-Player Co-Op Synergies**

**Goal:** Enable 2-player non-PvP multiplayer and verify dual-fleet automated interactions.

* \[ \] **6.1 Host/P2P State Synchronization**  
  * \[ \] Implement lightweight network manager syncing 2 player ship positions, health pools, and active states.  
* \[ \] **6.2 Lobby Synergy Indicators**  
  * \[ \] Hook up real-time connection lines in the Loadout UI showing cross-fleet synergies between P1 and P2.  
* \[ \] **6.3 Co-Op Mechanics Execution**  
  * \[ \] Program and verify **Quantum Entangler Tethering** (echoing damage across linked targets).  
  * \[ \] Program and verify **Vector Specialist Prisms** (splitting and reflecting partner's laser beams).  
  * \[ \] Program and verify **Hyper-Conductor Heat Siphoning** (draining partner heat to fuel lightning pulses).

### **Phase 7: Macro-Loop, Benchmark Warp, & Seasons**

**Goal:** Hook up the long-term progression loop, defeat penalties, and seasonal universe resets.

* \[ \] **7.1 Benchmark Defeat System**  
  * \[ \] Code 0 HP emergency warp returning the 2-ship fleet to the last safe Galaxy Benchmark.  
  * \[ \] Build sector resource repair cost system and customizable Insurance Policy mechanics.  
* \[ \] **7.2 Offline / Idle Mechanics**  
  * \[ \] Implement background resource generation math based on highest cleared sector.  
* \[ \] **7.3 Seasonal Universe Modifiers**  
  * \[ \] Create global universe rule modifiers (e.g., *Solar Flare Season: \+50% Laser Damage, \-80% Shield Regen*).


