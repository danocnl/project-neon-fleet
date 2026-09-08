export type WeightClass = 'Light' | 'Medium' | 'Heavy'
export type SynergyRating = 'S' | 'A' | 'B' | 'C'
export type TagCategory = 'SHIP' | 'WEAPON' | 'CONSTRUCT' | 'SPECIALIZATION' | 'LOGIC'
export type UpgradeTier = 1 | 2 | 3 | 4 | 5

export interface ShipFrame {
  id: string
  name: string
  subtitle: string
  weightClass: WeightClass
  primaryFocus: string
  strengths: string[]
  weaknesses: string[]
  classSynergies: Record<string, SynergyRating>
}

export interface ClassSpecialization {
  id: string
  name: string
  roleCategory: string
  description: string
  primaryTags: string[]
  secondaryTags: string[]
  coopSynergyMechanism: string
  recursiveDraftFocus: string
  recommendedShips: string[]
}

export interface Tag {
  category: TagCategory
  subCategory: string
  tag: string
  description: string
}

export interface UpgradeCard {
  id: string
  name: string
  tier: UpgradeTier
  prerequisiteTags: string[]
  grantedTags: string[]
  statModifiers: Record<string, number>
  logicTrigger?: string
  description: string
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
