import type { ShipFrame } from '../types'

export interface ActiveEffect {
  type: 'PHASE' | 'SPEED_BOOST' | 'FIRE_RATE_BOOST' | 'ARMOR_BOOST'
  remainingMs: number
  value: number   // magnitude — e.g. 0.4 = 40% boost
}

export class CombatState {
  readonly shipId:  string
  readonly classId: string

  maxHull:   number
  maxShield: number
  maxHeat  = 100

  currentHull:   number
  currentShield: number
  currentHeat  = 0

  shieldDelayMs:  number   // time since last hit before regen starts
  shieldDelayTimer = 0     // ms since last hit

  activeEffects: ActiveEffect[] = []
  harmonicStacks = 0

  // Derived flags read by other systems
  get isPhased(): boolean {
    return this.activeEffects.some(e => e.type === 'PHASE' && e.remainingMs > 0)
  }
  get isOverheated(): boolean { return this.currentHeat >= this.maxHeat }

  constructor(ship: ShipFrame, classId: string) {
    this.shipId  = ship.id
    this.classId = classId

    this.maxHull   = ship.baseStats.HULL
    this.maxShield = ship.baseStats.SHIELD_MAX
    this.shieldDelayMs = ship.baseStats.SHIELD_DELAY * 1000

    this.currentHull   = this.maxHull
    this.currentShield = this.maxShield
  }

  // ─── Mutations called by ActionExecutor ──────────────────────────────────

  takeDamage(amount: number): void {
    if (this.isPhased) return
    this.shieldDelayTimer = 0

    if (this.currentShield > 0) {
      const absorbed = Math.min(this.currentShield, amount)
      this.currentShield -= absorbed
      amount -= absorbed
    }
    this.currentHull = Math.max(0, this.currentHull - amount)
  }

  restoreHull(amount: number): void {
    this.currentHull = Math.min(this.maxHull, this.currentHull + amount)
  }

  restoreShield(amount: number): void {
    this.currentShield = Math.min(this.maxShield, this.currentShield + amount)
  }

  addHeat(amount: number): void {
    this.currentHeat = Math.min(this.maxHeat, this.currentHeat + amount)
  }

  coolHeat(amount: number): void {
    this.currentHeat = Math.max(0, this.currentHeat - amount)
  }

  applyEffect(type: ActiveEffect['type'], durationMs: number, value: number): void {
    // Replace existing effect of same type
    const existing = this.activeEffects.find(e => e.type === type)
    if (existing) {
      existing.remainingMs = Math.max(existing.remainingMs, durationMs)
      existing.value = Math.max(existing.value, value)
    } else {
      this.activeEffects.push({ type, remainingMs: durationMs, value })
    }
  }

  hasEffect(type: ActiveEffect['type']): boolean {
    return this.activeEffects.some(e => e.type === type && e.remainingMs > 0)
  }

  // ─── Tick — called every frame ────────────────────────────────────────────

  tick(deltaMs: number, shieldRegenPerMs: number): void {
    // Decay active effects
    this.activeEffects = this.activeEffects
      .map(e => ({ ...e, remainingMs: e.remainingMs - deltaMs }))
      .filter(e => e.remainingMs > 0)

    // Shield regen after delay
    this.shieldDelayTimer += deltaMs
    if (this.shieldDelayTimer >= this.shieldDelayMs && this.currentShield < this.maxShield) {
      this.currentShield = Math.min(this.maxShield, this.currentShield + shieldRegenPerMs * deltaMs)
    }
  }
}
