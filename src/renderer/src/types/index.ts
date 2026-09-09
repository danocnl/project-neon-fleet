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
  ENERGY_GRID: number       // Total energy capacity
  REPAIR_RATE: number       // HP/s passive hull repair
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
  primaryTags: string[]    // Unique tags belonging only to this class
  secondaryTags: string[]  // Shared tags (max 3 classes per tag)
  tagWeighting: Record<string, number>  // Draft probability weights (1 low → 5 core)
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
