export type WeightClass = 'Light' | 'Medium' | 'Heavy'
export type SynergyRating = 'S' | 'A' | 'B' | 'C'
export type TagCategory = 'SHIP' | 'WEAPON' | 'CONSTRUCT' | 'SPECIALIZATION' | 'LOGIC'
export type UpgradeTier = 1 | 2 | 3 | 4 | 5

export interface ShipBaseStats {
  HULL: number            // HP
  ARMOR: number           // % flat damage reduction
  SHIELD_MAX: number      // Shield points
  SHIELD_REGEN: number    // SP/s
  SHIELD_DELAY: number    // Seconds before regen begins (lower = better)
  TOP_SPEED: number       // units/s
  ACCELERATION: number    // units/s²
  TURN_SPEED: number      // °/s
  EVASION: number         // % per-hit dodge chance
  MASS: number            // Collision/momentum weight
  // Module slots — passive/active equipment bays
  MODULE_SLOT_SMALL: number
  MODULE_SLOT_MEDIUM: number
  MODULE_SLOT_LARGE: number
  MODULE_SLOT_XL: number
  // Weapon slots — hardpoints for offensive weapons
  WEAPON_SLOT_SMALL: number
  WEAPON_SLOT_MEDIUM: number
  WEAPON_SLOT_LARGE: number
  WEAPON_SLOT_XL?: number   // Heavy ordnance only
  CARGO_CAPACITY: number
  HEAT_DISSIPATION: number  // Heat units cooled per second
  HEAT_CAPACITY: number     // Max heat before overheat (default 100, upgradeable)
  ENERGY_GRID: number       // Total energy capacity
  ENERGY_REGEN: number      // Energy restored per second passively
  REPAIR_RATE: number       // HP/s passive hull repair
  WEIGHT_CAPACITY: number   // Max loadout weight before mobility penalty kicks in
  DRONE_BAYS?: number       // Dedicated drone hardpoints (Krait only)
}

export interface ShipFrame {
  id: string
  name: string
  subtitle: string
  weightClass: WeightClass
  primaryFocus: string
  baseStats: ShipBaseStats
  hardwareTags: Record<string, number>  // Starting tag counts pre-loaded into TagAggregator
  tagWeighting: Record<string, number>  // Draft bias weights (1 low → 5 core), same scale as ClassSpecialization
  specialTags: string[]                 // Unique innate tags for this hull
  classSynergies: Record<string, SynergyRating>
}

export interface ClassSpecialization {
  id: string
  name: string
  roleCategory: string
  description: string
  isBase: boolean          // true = starter class (Architect/Conductor/Weaver)
  subclasses?: string[]    // base classes only: IDs of the 3 specialisation options
  parentClass?: string     // subclasses only: ID of the base class this belongs to
  primaryTags: string[]
  secondaryTags: string[]
  tagWeighting: Record<string, number>
  coopSynergyMechanism: string
  recursiveDraftFocus: string
  recommendedShips: string[]
}

export interface TagInteraction {
  tag: string
  effect: string
}

export interface Tag {
  category: TagCategory
  subCategory: string
  tag: string
  description: string
  mechanic: string           // Effect of each individual tag instance
  interactions: TagInteraction[]
}

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'
export type UpgradeArchetype = 'StatMutator' | 'LogicTrigger' | 'Converter' | 'Resonance' | 'Keystone'

export interface StatModifier {
  stat: string
  type: 'flat' | 'percent'
  value: number
}

export interface LogicTriggerDef {
  condition: string   // e.g. ON_SHIELD_DROP
  action: string      // human-readable description of what fires
  cooldown: number    // seconds between trigger firings
}

export interface UpgradeCard {
  id: string
  name: string
  tier: UpgradeTier
  rarity: Rarity
  archetype: UpgradeArchetype
  associatedTags: string[]                   // Tags that make this card appear in the draft
  prerequisiteTags: Record<string, number>   // Tag counts needed in aggregator to unlock
  grantedTags: Record<string, number>        // Tags added to aggregator when drafted
  statModifiers: StatModifier[]
  tradeOff: string | null                    // Downside text, null if none
  description: string
  logicTrigger: LogicTriggerDef | null
  classRestriction: string | null            // Class ID for Keystones, null otherwise
}

export interface FleetLoadout {
  shipFrameId: string
  classSpecId: string
  upgrades: string[]
  activeTags: string[]
}

export interface GameSession {
  player1: FleetLoadout
  player2: FleetLoadout
  sectorLevel: number
  sessionId: string
}

export type ComputedStats = ShipBaseStats

// ─── Enemies ─────────────────────────────────────────────────────────────────

export type EnemyBehavior = 'DRIFT' | 'STATIC' | 'CHASE' | 'ORBIT' | 'SWARM' | 'PATROL'
export type EnemySize     = 'XS' | 'S' | 'M' | 'L' | 'XL'

export interface EnemyStats {
  HULL:             number   // HP
  ARMOR:            number   // % flat damage reduction
  SHIELD_MAX:       number   // Shield points (0 = no shields)
  SHIELD_REGEN:     number   // SP/s when not taking damage
  SHIELD_DELAY:     number   // Seconds before regen begins
  SPEED:            number   // Max movement speed u/s
  ACCELERATION:     number   // u/s² (0 = constant drift)
  COLLISION_RADIUS: number   // Pixel radius for collision detection
}

export interface EnemyWeapon {
  damageType:  DamageType
  damage:      number   // per shot, or DPS if isBeam
  rateOfFire:  number   // shots/s (0 = continuous beam)
  range:       number   // units
  isBeam?:     boolean
}

export interface EnemyDrops {
  creditsMin: number
  creditsMax: number
  debris?:    boolean   // generates salvageable debris on death
}

export interface EnemyBreakdown {
  count:   number
  enemyId: string   // spawns this many of this enemy on death
}

export interface Enemy {
  id:          string
  name:        string
  tier:        number
  size:        EnemySize
  behavior:    EnemyBehavior
  stats:       EnemyStats
  weapon:      EnemyWeapon | null
  drops:       EnemyDrops
  breakdown:   EnemyBreakdown | null   // asteroid cascade etc.
  vulnerableTo: string[]   // damage type / status tags that are extra effective
  immuneTo:    string[]    // tags with no effect on this enemy
  description: string
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export type ModuleCategory =
  | 'SHIELD' | 'HULL' | 'ENGINE' | 'POWER' | 'THERMAL' | 'REPAIR'
  | 'DRONE' | 'UTILITY' | 'WEAPON_ENHANCEMENT' | 'PARTNER' | 'ACTIVE'

export interface ModuleDraftBonus {
  tags:              string[]  // which upgrade card categories get boosted
  weightMultiplier:  number    // e.g. 1.5 = 50% more likely to appear in draft
  rarityBonus:       number    // tiers easier to unlock (1 = T3 at T2 threshold)
  effectMultiplier:  number    // drafted cards in these tags are this much stronger
}

export interface DroneWeapon {
  damageType:    DamageType
  baseStats:     Partial<WeaponBaseStats>
  behaviors:     WeaponBehaviors
  statusEffects: WeaponStatusEffects
  tags:          string[]
}

export interface DroneSpec {
  count:      number    // active drones this module deploys
  behavior:   string    // ORBITAL | REPAIR_SWARM | SHIELD_DRONE | DECOY | ESCORT | HARVESTER | MINE_LAYER
  droneStats: {
    DRONE_HULL:     number
    DRONE_SHIELD?:  number
    DRONE_SPEED:    number
    DRONE_DAMAGE?:  number
    THREAT_LEVEL?:  number
  }
  weapon?:    DroneWeapon
}

export interface ModuleTrigger {
  condition: string   // ON_SHIELD_DROP | ON_KILL | ON_OVERHEAT | PROXIMITY | TIMER
  action:    string   // human-readable description
  cooldown:  number   // seconds between firings
}

export interface Module {
  id:            string
  name:          string
  size:          WeaponSize      // reuses SMALL | MEDIUM | LARGE | XL
  category:      ModuleCategory
  description:   string
  passiveBonuses: Record<string, number>  // stat key → value. WEAPON_ prefix = weapon-wide mods
  draftBonus?:   ModuleDraftBonus
  droneSpec?:    DroneSpec
  trigger?:      ModuleTrigger
  passiveDrain:  number   // energy/s while active
  passiveHeat:   number   // heat/s while active
  weight:        number   // contributes to WEIGHT_CAPACITY
  tags:          string[] // upgrade categories this module interacts with
}

// ─── Weapons ─────────────────────────────────────────────────────────────────

export type WeaponSize   = 'SMALL' | 'MEDIUM' | 'LARGE' | 'XL'
export type DamageType   = 'ENERGY' | 'KINETIC' | 'EXPLOSIVE' | 'PSIONIC' | 'BIOLOGICAL' | 'CORROSIVE'

export interface WeaponBaseStats {
  DAMAGE: number           // damage per hit (beams: DPS)
  RATE_OF_FIRE: number     // shots/s (0 for continuous beams)
  RELOAD_SPEED: number     // seconds to reload (0 = no reload)
  AMMO_CAPACITY: number    // shots before reload (0 = infinite)
  RANGE: number            // effective range in units
  ACCURACY: number         // spread angle in degrees (0 = perfect)
  VELOCITY: number         // projectile speed u/s (0 = instant/beam)
  BLAST_RADIUS: number     // AoE radius (0 = no AoE)
  ENERGY_COST: number      // energy drained per shot
  HEAT_GEN: number         // heat generated per shot
  PASSIVE_DRAIN: number    // energy/s drained while active
  PASSIVE_HEAT: number     // heat/s generated while running
  WEIGHT: number           // contributes to ship WEIGHT_CAPACITY
  CHARGE_TIME: number      // seconds to charge before firing (0 = instant)
  PROJECTILE_COUNT: number // simultaneous projectiles per shot
}

export interface WeaponBehaviors {
  BEAM?:             boolean
  PIERCE?:           number
  RICOCHET?:         number
  CHAIN?:            number
  SPLIT?:            number
  PULSE?:            boolean
  RETURN?:           boolean
  PULSE_RADIUS?:     number  // radius for PULSE weapons (units)
  PULSE_INTERVAL?:   number  // seconds between pulses
}

export interface WeaponStatusEffects {
  BURN?:             number  // thermal DPS
  FREEZE?:           number  // enemy speed reduction %
  EMP?:              number  // disable duration seconds
  CRITICAL_CHANCE?:  number  // crit % bonus from this weapon
  CORROSIVE?:        number  // armor strip stacks
}

export interface Weapon {
  id:            string
  name:          string
  size:          WeaponSize
  damageType:    DamageType
  description:   string
  baseStats:     WeaponBaseStats
  behaviors:     WeaponBehaviors
  statusEffects: WeaponStatusEffects
  tags:          string[]  // upgrade categories that boost this weapon
}
