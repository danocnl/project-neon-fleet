# Game Design Document — Project Neon Fleet

**Version:** September 2026  
**Status:** In active development — core loop proven, co-op online

---

## 1. Executive Summary

| | |
|---|---|
| **Working Title** | Project Neon Fleet |
| **Genre** | 2-Player Online Co-op Autobattler Roguelike |
| **Platform** | PC (Electron + browser), Steam target |
| **Visual Style** | Vector neon wireframes on a dark space grid. *Geometry Wars* meets *Space Invaders Infinity Gene*. |
| **Engine** | Phaser 3 + TypeScript + Electron (Vite build) |

**Core loop in one sentence:** Two ships autonomously hunt enemies through escalating sectors — players manage class abilities, upgrade cards between waves, and coordinate in real-time co-op without ever touching a movement key.

---

## 2. Core Philosophy

**Autobattler, not idle.** Ships navigate and fight entirely on their own. Players make *strategic* decisions — which upgrade to draft, when to trigger the class active, how to coordinate roles — rather than *mechanical* ones like aiming or dodging.

**Shared jeopardy.** Both players share the same sector, same enemy pool, same kills-to-advance counter. One ship dying enters spectator mode following the survivor; both ships dying ends the run. Co-op creates genuine interdependence, not just parallel play.

**Compounding builds.** The tag+upgrade pipeline means early choices create synergies that become dramatically more powerful by sector 20+. The same ship class played by two different pilots should look completely different by mid-game.

---

## 3. Game Loop

```
SESSION START
  ↓
[Save Slot / Guest Code]
  ↓
[PhysicsScene — The Run]
  │
  ├─ Sector N
  │    ├── Wave 1 spawns (ring around players)
  │    ├── Both ships hunt and kill
  │    ├── [Wave clear] → Wave 2 announcement + spawn
  │    ├── [All waves clear] → Sector advance animation + next sector
  │    └── [Both ships die] → BenchmarkScene
  │
  ├─ Every 3 kills → Draft offer (4 upgrade cards)
  │    └── Each player picks independently from their class-weighted pool
  │
  └─ [Run ends] → BenchmarkScene
         ├── Credits, kills, sector reached
         ├── Access Armory (buy/upgrade weapons + modules)
         └── RELAUNCH or return to save slot
```

---

## 4. Combat — How It Works

### Ship Behavior
Ships navigate and engage autonomously. There are no manual controls. Ships:
- Lock onto the nearest enemy (drones/turrets first, asteroids fallback)
- Apply active braking when within weapon range to maximise DPS time
- Maintain engagement distance and loop back when overshooting
- Avoid each other and obstacles using repulsion forces

### Class Active Abilities (SPACE to activate)

Each of the 3 starter classes has a distinct active:

| Class | Active | Effect | Cooldown |
|---|---|---|---|
| **Architect** | BULWARK | 3s full damage immunity + white glow | 45s |
| **Conductor** | OVERCLOCK | 6s zero heat + 1.5× DPS + orange glow | 40s |
| **Weaver** | PHASE SHIFT | 4s intangible + shields recharge rapidly + purple glow | 35s |

Both players see each other's active visually. Coordination matters: Weaver phases to reset after Architect soaks an ambush wave.

### Enemy Behaviour

| Enemy | Weapon | Firing Arc | Behaviour |
|---|---|---|---|
| Scout Drone | pulse_laser | 30° | CHASE — hunts players from anywhere on map, maintains 100u engagement gap |
| Attack Drone | chaingun | 25° | CHASE — heavier, slower, hits harder |
| Sector Turret | railgun | 10° | STATIC — always faces nearest player, extreme range |
| Asteroids | — | — | DRIFT — slow, high HP, cluster together, cascade into smaller pieces |

Drones must face the player to fire. They loop back if they overshoot. All enemies have collision physics with each other and the player ships.

Enemy weapon stats inherit directly from `weapons.json` with optional per-enemy `weaponOverrides` multipliers (DAMAGE, RATE_OF_FIRE, RANGE).

---

## 5. Sector Progression

### Structure

Sectors run from 1 to 50, scaling in enemy count, HP, speed, and fire rate each tier.

Each sector has **multiple waves**:
- Sectors 1–2: 2 waves (intro)
- Sectors 3–10: 2–3 waves
- Sectors 11+: 3 waves (heavier per wave)

Clearing a wave triggers:
1. Brief pause + "WAVE X OF Y" announcement
2. Next wave spawns in a tight ring around the players (500–900u radius) — combat resumes immediately

When the final wave is cleared:
- Large "SECTOR N" announcement + coloured screen flash
- Background grid and nebula shift to new sector colour theme
- New wave ring spawns immediately

### Sector Colour Themes

| Sector | Grid colour | Mood |
|---|---|---|
| 1–5 | Deep blue | Starting zone |
| 6–10 | Dark purple | Mid zone |
| 11–15 | Dark amber | Danger zone |
| 16–20 | Deep red | Hazard zone |
| 21+ | Void teal | Deep space |

---

## 6. The Tag & Upgrade System

### Tag Pipeline

Every ship and class starts with hardware tags (from `ships.json → hardwareTags`). Tags accumulate through the run via drafted upgrade cards.

The `StatCalculator` converts the tag pool into `computedStats` each draft:
- Each HULL tag → +500 hull HP
- Each SHIELD_MAX tag → +300 shield
- Each TOP_SPEED tag → +30 u/s max speed
- Each ACCELERATION tag → +25 u/s² acceleration
- etc. (full list in `StatCalculator.ts → PER_TAG_BONUS`)

These computed stats are applied to the live `CombatState` and `PhysicsBody` immediately — tags have real, visible effects on the ship.

### Draft System

Every 3 kills, both players receive a 4-card draft offer. Cards are weighted by the ship+class tag profile — builds with a KINETIC focus see more kinetic upgrade cards.

Cards have three archetypes:
1. **StatMutator** — direct stat bonuses (`+350 hull`, `shield delay −2s`)
2. **LogicTrigger** — fire on events (`ON_KILL: restore 20% hull`, `ON_KILL: 2s PHASE`)
3. **Converter/Keystone** — powerful unlocks gated behind prerequisite tag counts

**Recursive cards** (RECURSIVE tag in grantedTags) can be drafted every level for compounding effect. *Firing Solutions* (+10% fire rate, stacks multiplicatively) is the first example.

### Test Card Set (active during development)

Six `TEST_UPGRADE` cards replace the normal pool when present:

| Card | Effect |
|---|---|
| Reinforced Plating | +350 hull HP |
| Shield Amplifier | +300 shield · shield delay −2s |
| Kill Feed | ON_KILL: restore 20% max hull |
| Phase Reaction | ON_KILL: 2s PHASE (3s cooldown) |
| Cryo Warhead | ON_KILL: cryo AoE 400u · slows 60% for 3s |
| **Firing Solutions** | **+10% fire rate · recursive** |

---

## 7. The 9×9 Matrix

**9 Ship Frames × 9 Class Specializations = 81 starting configurations**

### Ship Frames

| Ship | Class | Role |
|---|---|---|
| Sidewinder | Light | Agile scout, high evasion, 2× small weapon slots |
| Cobra | Light | Multi-role, balanced shields, versatile slots |
| Mamba | Light | Dragster, heat dissipation, beam specialist |
| Krait | Medium | Strike carrier, dual drone bays |
| Chieftain | Medium | Kinetic brawler, high armour, impact resist |
| Python | Medium | Heavy gunship, max hardpoints and slots |
| Anaconda | Heavy | Flying fortress, massive hull and shields |
| Cutter | Heavy | Shield dreadnought, front-line presence |
| Type-10 | Heavy | Ordnance array, 360° turrets, status immune |

**Currently unlocked:** Sidewinder, Cobra, Mamba. Ships 4–9 unlock via sector milestones (planned).

### Class Specializations (9 total, 3 starter)

**Starter classes:**
- **Architect** — Hull & structure. BULWARK active. Tanky, face-forward.
- **Conductor** — Energy & weapons. OVERCLOCK active. Burst DPS, heat management.
- **Weaver** — Shields & phase. PHASE SHIFT active. Shield-gated, evasive.

**Advanced classes** (unlock with sector progression, planned):
- Chrono Architect, Hyper-Conductor, Graviton Weaver, Nanite Swarm Controller, Phase Weaver, Resonance Bard, Scrap Salvager, Vector Specialist

---

## 8. Online Co-op

Co-op is online-first via a WebSocket relay server. Both players run the game in any browser — no download needed for the guest.

**Session flow:**
1. Host loads their save slot → clicks HOST → goes through ship/class selection → LobbyScene shows room code
2. Guest enters code → goes through their own ship/class selection → clicks READY
3. Host sees START button → both enter PhysicsScene simultaneously

**Architecture:**
- **Host-authoritative** — host simulates both ships, all enemies, all physics
- **Guest is a thin renderer** — receives authoritative state via GAME_STATE snapshot every 50ms
- Both ships run identical pursuit AI on the host; guest sees their ship's position from the snapshot
- Active abilities, class actives, upgrade drafts all work for both players independently

**Both ships are equal.** The "guest" label is purely about network topology — it has no effect on ship behavior, upgrade access, or gameplay.

---

## 9. Armory & Persistence

**Per-slot save data (host only):**
- Credits, total kills, highest sector, run count
- Weapon inventory (unlocked weapons)
- Module inventory with levels (1–20, escalating cost)
- Equipped loadout per ship

**Guest identity:**
- Stored as `neon_guest_profile` in localStorage (not tied to a save slot)
- Pilot name, ship, class — auto-loaded next session

**Armory tabs:**
- **WEAPONS** — buy permanent weapon unlocks
- **MODULES** — upgrade passive modules (each has a Lv20 target bonus)
- **LOADOUT** — equip weapons/modules per ship slot

---

## 10. Weapons Reference

| Tier | Weapon | Type | Range | Arc | Style |
|---|---|---|---|---|---|
| Short | Light Chaingun | KINETIC | 300u | 25° | Rapid dots |
| Short-Med | Chaingun | KINETIC | 380u | 25° | Dots |
| Short-Med | Pulse Laser | ENERGY | 460u | 30° | Dashes |
| Short-Med | Arc Cannon | ENERGY | 380u | 25° | Heavy |
| Medium | Heavy Chaingun | KINETIC | 450u | 20° | Heavy dots |
| Medium | Beam Laser | ENERGY | 520u | 15° | Continuous |
| Long | Heavy Beam | ENERGY | 700u | 10° | Long beam |
| Long | Torpedo | EXPLOSIVE | 700u | 60° | Seeker |
| Extreme | Railgun | KINETIC | 1000u | 10° | Sniper |
| Ultra | Gauss Cannon | KINETIC | 1300u | 8° | Railgun++ |

Full stats in `data/weapons.md`.

---

## 11. Roadmap

### Done ✓
- Full run loop (selection → combat → benchmark → armory)
- Online co-op (host-authoritative relay, lobby, shared sector)
- Save slots with Electron file persistence + guest profile
- 9×9 ship/class matrix (3 ships + 3 classes unlocked)
- Tag pipeline → computedStats → CombatState + PhysicsBody wired
- Draft system with recursive cards
- 3 class active abilities
- Armory (weapons, modules 1–20, loadout)
- Sector progression (1–50, kill-all-to-advance)
- Visual polish: parallax stars, nebula, death explosions, hit particles, sector colour themes
- Projectile system with weapon-accurate visuals (dots vs dashes)
- Enemy weapon data reference with per-enemy override support
- Collision physics for all objects

### Active / Next
- **Wave progression** — multi-wave sectors with announcements and flanking spawns
- **Audio** — SFX for fire, hit, kill, ability, sector advance
- **Ship unlocks** — tie ships 4–9 to sector milestones
- **Production upgrade card set** — replace test cards with ~30 cards spanning all 5 tag buckets
- **Relay server deployed** — Render/Railway so remote co-op works without local server

### Future
- More enemy types (flanker, carrier, shielded juggernaut)
- Advanced class unlocks (sector milestones)
- Sector boss at milestones (10, 20, 30, 40, 50)
- BenchmarkScene polish — co-op side-by-side stat breakdown
- Steam integration

---

## 12. Technical Stack

| Layer | Technology |
|---|---|
| Renderer | Phaser 3 (canvas/WebGL) |
| Language | TypeScript |
| Build | Vite + electron-vite |
| Desktop | Electron (Malwarebytes safe with `npm run dev:web`) |
| Save | Electron IPC → fs (Electron) / localStorage (browser dev) |
| Co-op | WebSocket relay (Node.js `ws`) |
| Dev server | `npm run dev:web` → localhost:5173 |
| Repo | github.com/danocnl/project-neon-fleet |
