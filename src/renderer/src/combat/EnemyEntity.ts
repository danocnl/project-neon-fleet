import type { Enemy, EnemySize } from '../types'

let _idCounter = 0

export class EnemyEntity {
  readonly def:        Enemy
  readonly instanceId: string

  x = 0; y = 0
  vx = 0; vy = 0
  heading = 0

  readonly maxHull:   number
  readonly maxShield: number
  currentHull:   number
  currentShield: number
  shieldDelayMs = 0

  readonly shape: [number, number][]

  alive = true
  attackCooldownMs = 0
  hitFlashMs       = 0   // counts down after taking damage; drives the hit-flash draw

  constructor(def: Enemy, x: number, y: number, driftAngle: number, sectorScale = 1.0) {
    this.def        = def
    this.instanceId = `${def.id}_${++_idCounter}`
    this.x = x; this.y = y
    this.heading = driftAngle

    this.maxHull   = Math.round(def.stats.HULL   * sectorScale)
    this.maxShield = Math.round(def.stats.SHIELD_MAX * sectorScale)
    this.currentHull   = this.maxHull
    this.currentShield = this.maxShield

    this.shape = buildShape(def.id, def.size, _idCounter)

    if (def.behavior === 'DRIFT') {
      this.vx = Math.cos(driftAngle) * def.stats.SPEED
      this.vy = Math.sin(driftAngle) * def.stats.SPEED
    }
  }

  takeDamage(rawDamage: number): void {
    this.shieldDelayMs = 0
    this.hitFlashMs = Math.max(this.hitFlashMs, 110)
    let dmg = rawDamage

    if (this.currentShield > 0) {
      const absorbed = Math.min(this.currentShield, dmg)
      this.currentShield -= absorbed
      dmg -= absorbed
    }

    if (dmg > 0) {
      dmg *= (1 - this.def.stats.ARMOR / 100)
      this.currentHull = Math.max(0, this.currentHull - dmg)
    }

    if (this.currentHull <= 0) this.alive = false
  }

  tick(deltaMs: number): void {
    if (this.hitFlashMs > 0) this.hitFlashMs = Math.max(0, this.hitFlashMs - deltaMs)
    if (this.maxShield > 0 && this.currentShield < this.maxShield) {
      this.shieldDelayMs += deltaMs
      if (this.shieldDelayMs >= this.def.stats.SHIELD_DELAY * 1000) {
        this.currentShield = Math.min(
          this.maxShield,
          this.currentShield + this.def.stats.SHIELD_REGEN * (deltaMs / 1000)
        )
      }
    }
    if (this.attackCooldownMs > 0) this.attackCooldownMs -= deltaMs
  }

  get hullRatio():   number { return this.currentHull  / this.maxHull }
  get shieldRatio(): number { return this.maxShield > 0 ? this.currentShield / this.maxShield : 0 }
}

// ─── Shape generation ────────────────────────────────────────────────────────

function buildShape(id: string, size: EnemySize, seed: number): [number, number][] {
  if (id.startsWith('asteroid')) return asteroidShape(size, seed)
  if (id === 'scout_drone')      return [[0,-12],[5,8],[0,4],[-5,8]]
  if (id === 'attack_drone')     return [[0,-18],[12,4],[8,14],[0,10],[-8,14],[-12,4]]
  if (id === 'turret')           return [[-14,-14],[14,-14],[14,14],[-14,14]]
  return [[0,-8],[8,8],[-8,8]]
}

function asteroidShape(size: EnemySize, seed: number): [number, number][] {
  const radii:  Record<string, number> = { XL: 68, L: 44, M: 24, S: 11 }
  const counts: Record<string, number> = { XL: 11, L: 9,  M: 7,  S: 6  }
  const r = radii[size]  ?? 20
  const n = counts[size] ?? 7

  return Array.from({ length: n }, (_, i) => {
    const angle  = (i / n) * Math.PI * 2
    const jitter = 0.62 + ((seed * (i + 3) * 6271 + i * 1031) % 380) / 1000
    return [Math.cos(angle) * r * jitter, Math.sin(angle) * r * jitter] as [number, number]
  })
}
