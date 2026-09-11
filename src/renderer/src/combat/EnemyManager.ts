import Phaser from 'phaser'
import { EnemyEntity } from './EnemyEntity'
import { DataLoader } from '../systems/DataLoader'
import { SectorManager } from '../systems/SectorManager'
import type { Enemy } from '../types'
import type { PhysicsBody } from '../physics/PhysicsBody'

const WORLD_W = 1280 * 5
const WORLD_H = 720  * 5
const SPAWN_CLEAR_RADIUS = 700

const WEAPON_STATS: Record<string, { dps: number; range: number; arc: number }> = {
  // Kinetic
  light_chaingun: { dps:  64, range:  300, arc: 25 },
  chaingun:       { dps: 108, range:  380, arc: 25 },
  heavy_chaingun: { dps: 160, range:  450, arc: 20 },
  // Energy
  pulse_laser:    { dps:  60, range:  460, arc: 30 },
  beam_laser:     { dps:  55, range:  520, arc: 15 },
  heavy_beam:     { dps:  90, range:  700, arc: 10 },
  // Precision
  railgun:        { dps: 200, range: 1000, arc: 10 },
  gauss_cannon:   { dps: 300, range: 1300, arc:  8 },
  // Explosive
  micro_missile:  { dps:  48, range:  480, arc: 60 },
  torpedo:        { dps: 120, range:  700, arc: 60 },
  // Special
  emp_cannon:     { dps:  30, range:  420, arc: 60 },
  arc_cannon:     { dps:  50, range:  380, arc: 25 },
}

const ENEMY_COLOR: Record<string, number> = {
  asteroid_xl:     0x99aabb,
  asteroid_large:  0x8899aa,
  asteroid_medium: 0x778899,
  asteroid_small:  0x667788,
  scout_drone:     0xff4422,
  attack_drone:    0xff2200,
  turret:          0xdd1100,
}

// Enemy projectile visual colours by damage type
const PROJ_COLOR: Record<string, number> = {
  ENERGY:  0xff4400,
  KINETIC: 0xdddddd,
}

interface EnemyProjectile {
  x: number; y: number; vx: number; vy: number
  lifetimeMs: number; color: number; size: number
}

interface ImpactParticle {
  x: number; y: number; vx: number; vy: number
  life: number    // 1.0 → 0.0
  decay: number   // per-ms rate
  color: number; size: number
}

interface DeathRing {
  x: number; y: number
  radius: number; maxRadius: number
  life: number; decay: number
  color: number
}

export interface KillResult {
  credits:  number; xp: number; position: { x: number; y: number }
}

export class EnemyManager {
  private entities:         EnemyEntity[] = []
  private defs              = new Map<string, Enemy>()
  private gfx!:             Phaser.GameObjects.Graphics
  private projGfx!:         Phaser.GameObjects.Graphics
  private fxGfx!:           Phaser.GameObjects.Graphics
  private enemyProjs:       EnemyProjectile[] = []
  private impactParticles:  ImpactParticle[]  = []
  private deathRings:       DeathRing[]       = []
  private _currentTarget:   EnemyEntity | null = null

  get currentTarget(): EnemyEntity | null { return this._currentTarget }

  init(scene: Phaser.Scene): void {
    this.gfx     = scene.add.graphics().setDepth(4)
    this.projGfx = scene.add.graphics().setDepth(6)
    this.fxGfx   = scene.add.graphics().setDepth(7)
    const raw = DataLoader.getAllEnemies()
    for (const e of raw) this.defs.set(e.id, e)
  }

  /** Spawn the sector's full wave. Asteroids cluster around 2–3 centres;
   *  drones spawn within 800–1400u of world centre so they reach players fast. */
  spawnSectorWave(sector: SectorManager): void {
    const cx = WORLD_W / 2, cy = WORLD_H / 2
    const wave = sector.getSpawnWave()

    // Build 2–3 asteroid cluster centres away from world centre
    const CLUSTER_R = 550
    const clusterCentres: { x: number; y: number }[] = Array.from({ length: 3 }, () => {
      const angle = Math.random() * Math.PI * 2
      const dist  = SPAWN_CLEAR_RADIUS + 200 + Math.random() * 1200
      return {
        x: ((cx + Math.cos(angle) * dist) % WORLD_W + WORLD_W) % WORLD_W,
        y: ((cy + Math.sin(angle) * dist) % WORLD_H + WORLD_H) % WORLD_H,
      }
    })

    for (const { id, count } of wave) {
      if (id.startsWith('asteroid')) {
        // Cluster asteroids around the pre-chosen centres
        for (let i = 0; i < count; i++) {
          const centre = clusterCentres[i % clusterCentres.length]
          const angle  = Math.random() * Math.PI * 2
          const dist   = Math.random() * CLUSTER_R
          const x = ((centre.x + Math.cos(angle) * dist) % WORLD_W + WORLD_W) % WORLD_W
          const y = ((centre.y + Math.sin(angle) * dist) % WORLD_H + WORLD_H) % WORLD_H
          this.spawnEnemy(id, x, y, Math.random() * Math.PI * 2, sector.hpScale)
        }
      } else {
        // Drones: spawn within 800–1400u of world centre so they're on you quickly
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2
          const dist  = 800 + Math.random() * 600
          const x = ((cx + Math.cos(angle) * dist) % WORLD_W + WORLD_W) % WORLD_W
          const y = ((cy + Math.sin(angle) * dist) % WORLD_H + WORLD_H) % WORLD_H
          this.spawnEnemy(id, x, y, Math.random() * Math.PI * 2, sector.hpScale)
        }
      }
    }
  }

  spawnEnemy(id: string, x: number, y: number, angle: number, sectorScale = 1.0): EnemyEntity | null {
    const def = this.defs.get(id)
    if (!def) return null
    const e = new EnemyEntity(def, x, y, angle, sectorScale)
    this.entities.push(e)
    return e
  }

  // ─── Per-frame update ───────────────────────────────────────────────────

  update(
    dt: number,
    playerX: number, playerY: number,
    playerHeading: number,
    playerRadius: number,
    playerBody: PhysicsBody,
    weaponIds: string[],
    targetPriority: 'any' | 'drones' | 'asteroids',
    sector: SectorManager,
    onEnemyAttack: (damage: number) => void,
    onKill: (result: KillResult) => void,
    dpsMultiplier?: number,
    player2?: {
      x: number; y: number; heading: number; radius: number
      body: PhysicsBody; weaponIds: string[]
      targetPriority: 'any' | 'drones' | 'asteroids'
      onEnemyAttack: (damage: number) => void
    },
    weaponTargetAnchor?: { x: number; y: number }
  ): void {
    const { dps: playerDps, range: playerRange, arc: playerArc } = computeLoadout(weaponIds)
    const deltaMs = dt * 1000

    // Update entities — CHASE enemies target whichever player is closer
    for (const e of this.entities) {
      if (!e.alive) continue
      e.tick(deltaMs)
      this.updateBehavior(e, dt, playerX, playerY, sector, player2 ? { x: player2.x, y: player2.y } : undefined)
      wrapEntity(e)
    }

    // Collision detection — both players
    this.checkCollisions(playerX, playerY, playerRadius, playerBody, onEnemyAttack)
    if (player2) this.checkCollisions(player2.x, player2.y, player2.radius, player2.body, player2.onEnemyAttack)

    // P1 attacks nearest in arc — SUPPORT mode uses partner anchor for ranking
    const target = weaponTargetAnchor
      ? this.nearestAliveToAnchor(weaponTargetAnchor.x, weaponTargetAnchor.y, playerX, playerY, playerRange, playerHeading, playerArc, targetPriority)
      : this.nearestAlive(playerX, playerY, playerRange, playerHeading, playerArc, targetPriority)
    this._currentTarget = target
    if (target) {
      target.takeDamage(playerDps * dt * (dpsMultiplier ?? 1))
      this.spawnHitSparks(target.x, target.y, target.def.stats.COLLISION_RADIUS)
    }

    // P2 attacks nearest in arc (independent target)
    if (player2) {
      const { dps: p2Dps, range: p2Range, arc: p2Arc } = computeLoadout(player2.weaponIds)
      const p2Target = this.nearestAlive(player2.x, player2.y, p2Range, player2.heading, p2Arc, player2.targetPriority)
      if (p2Target) {
        p2Target.takeDamage(p2Dps * dt)
        this.spawnHitSparks(p2Target.x, p2Target.y, p2Target.def.stats.COLLISION_RADIUS)
      }
    }

    // Enemy attacks — target whichever player is closer and in range
    for (const e of this.entities) {
      if (!e.alive || !e.def.weaponId) continue
      const weapon = DataLoader.getWeapon(e.def.weaponId)
      if (!weapon) continue

      // Pick closest player in range
      const d1 = Math.hypot(e.x - playerX, e.y - playerY)
      const d2 = player2 ? Math.hypot(e.x - player2.x, e.y - player2.y) : Infinity
      const useP2 = player2 && d2 < d1 && d2 <= weapon.baseStats.RANGE
      const tgtX = useP2 ? player2!.x : playerX
      const tgtY = useP2 ? player2!.y : playerY
      const tgtAttack = useP2 ? player2!.onEnemyAttack : onEnemyAttack
      const dist = Math.min(d1, d2)
      if (dist > weapon.baseStats.RANGE) continue

      // Firing arc check for CHASE drones
      if (e.def.behavior === 'CHASE') {
        const facingAngle   = Math.atan2(e.vy, e.vx)
        const toPlayerAngle = Math.atan2(tgtY - e.y, tgtX - e.x)
        let diff = Math.abs(toPlayerAngle - facingAngle)
        if (diff > Math.PI) diff = Math.PI * 2 - diff
        const halfArc = (e.def.id === 'scout_drone' ? 50 : 38) * (Math.PI / 180)
        if (diff > halfArc) continue
      }

      const isBeam = weapon.behaviors?.BEAM === true
      if (isBeam) {
        tgtAttack(weapon.baseStats.DAMAGE * dt * sector.rofScale)
      } else {
        const rof = weapon.baseStats.RATE_OF_FIRE * sector.rofScale
        if (e.attackCooldownMs <= 0 && rof > 0) {
          tgtAttack(weapon.baseStats.DAMAGE)
          e.attackCooldownMs = (1 / rof) * 1000
          const dx = tgtX - e.x, dy = tgtY - e.y
          const d  = Math.hypot(dx, dy)
          const spd = weapon.behaviors?.BEAM ? 0 : 280
          this.enemyProjs.push({
            x: e.x, y: e.y,
            vx: (dx / d) * spd, vy: (dy / d) * spd,
            lifetimeMs: Math.min((d / spd) * 1000 + 80, 2500),
            color: PROJ_COLOR[weapon.damageType] ?? 0xff3300,
            size: weapon.size === 'LARGE' ? 4 : weapon.size === 'MEDIUM' ? 3 : 2.5,
          })
        }
      }
    }

    // Update enemy projectiles
    for (const p of this.enemyProjs) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.lifetimeMs -= deltaMs
    }
    this.enemyProjs = this.enemyProjs.filter(p => p.lifetimeMs > 0)

    // Handle deaths
    const dead = this.entities.filter(e => !e.alive)
    this.entities = this.entities.filter(e => e.alive)

    for (const e of dead) {
      if (e.def.breakdown) {
        for (let i = 0; i < e.def.breakdown.count; i++) {
          const a = e.heading + Math.PI * i + (Math.random() - 0.5) * 0.8
          const offset = e.def.stats.COLLISION_RADIUS * 0.6
          this.spawnEnemy(e.def.breakdown.enemyId, e.x + Math.cos(a) * offset, e.y + Math.sin(a) * offset, a)
        }
      }
      this.spawnDeathExplosion(e.x, e.y, e.def.stats.COLLISION_RADIUS, ENEMY_COLOR[e.def.id] ?? 0xff3300)
      onKill({
        credits:  Phaser.Math.Between(e.def.drops.creditsMin, e.def.drops.creditsMax),
        xp:       (e.def as any).xpValue ?? 1,
        position: { x: e.x, y: e.y },
      })
    }

    this.resolveEnemyCollisions()
    this.tickParticles(deltaMs)
    this.draw(playerX, playerY)
    this.drawFX()
  }

  // ─── Collision ───────────────────────────────────────────────────────────

  private checkCollisions(
    px: number, py: number,
    playerRadius: number,
    body: PhysicsBody,
    onDamage: (d: number) => void
  ): void {
    for (const e of this.entities) {
      if (!e.alive) continue
      const dx = px - e.x, dy = py - e.y
      const dist = Math.hypot(dx, dy)
      const minDist = playerRadius + e.def.stats.COLLISION_RADIUS

      // Drones keep a combat gap — don't physically ram the player
      if (e.def.behavior === 'CHASE') {
        const combatGap = minDist + 30
        if (dist < combatGap && dist > 0.5) {
          // Push drone away so it attacks from range, not by ramming
          const nx = dx / dist, ny = dy / dist
          const pushMag = (combatGap - dist) / combatGap * e.def.stats.ACCELERATION * 0.5
          e.vx -= nx * pushMag; e.vy -= ny * pushMag
        }
        continue   // drones deal damage via weapons, not collision
      }

      if (dist >= minDist || dist < 0.5) continue

      const nx = dx / dist, ny = dy / dist

      // Damage = relative approach speed × size — fires once per collision event
      // (collisionCooldownMs prevents per-frame damage during prolonged overlap)
      if (e.collisionCooldownMs <= 0) {
        const relVx = body.vx - e.vx, relVy = body.vy - e.vy
        const approachSpeed = Math.max(0, relVx * nx + relVy * ny)
        const damage = Math.max(1, approachSpeed * (e.def.stats.COLLISION_RADIUS / 55))
        onDamage(damage)
        e.collisionCooldownMs = 900   // ~1s before this entity can deal collision damage again
      }

      // Physics bounce — reflect velocity component along collision normal
      const dot = body.vx * nx + body.vy * ny
      body.vx -= dot * nx * 1.4   // partial velocity reflection
      body.vy -= dot * ny * 1.4
      // Additional push-away impulse proportional to object size
      const bounce = e.def.stats.COLLISION_RADIUS * 0.7
      body.vx += nx * bounce
      body.vy += ny * bounce

      // Moving enemies pushed back
      if (e.def.behavior !== 'STATIC') {
        e.vx -= nx * bounce * 0.3
        e.vy -= ny * bounce * 0.3
      }
    }
  }

  // ─── AI ─────────────────────────────────────────────────────────────────

  private updateBehavior(
    e: EnemyEntity, dt: number, px: number, py: number, sector: SectorManager,
    p2?: { x: number; y: number }
  ): void {
    switch (e.def.behavior) {
      case 'DRIFT':
        e.x += e.vx * dt; e.y += e.vy * dt
        e.heading = Math.atan2(e.vx, -e.vy)
        break
      case 'CHASE': {
        const leash = e.def.leash ?? Infinity
        const d1 = Math.hypot(px - e.x, py - e.y)
        const d2 = p2 ? Math.hypot(p2.x - e.x, p2.y - e.y) : Infinity
        // Chase the nearest player — simple and aggressive
        const tgtX = (p2 && d2 < d1) ? p2.x : px
        const tgtY = (p2 && d2 < d1) ? p2.y : py
        const dx = tgtX - e.x, dy = tgtY - e.y
        const dist = Math.hypot(dx, dy)

        if (dist <= leash && dist > 1) {
          const accel        = e.def.stats.ACCELERATION
          const maxSpeed     = e.def.stats.SPEED * sector.speedScale
          const effectiveMax = e.freezeMs > 0 ? maxSpeed * 0.4 : maxSpeed
          const turnRateRad  = e.def.id === 'scout_drone' ? 7.0 : 5.0

          // Drones maintain an engagement distance — they target a point at
          // ENGAGE_DIST from the player rather than the player directly.
          // When too close (inside ENGAGE_DIST), the target flips behind the
          // drone so it naturally backs away rather than ramming.
          const ENGAGE_DIST  = 100   // u from player centre
          const engX = dist > 0 ? tgtX - (dx / dist) * ENGAGE_DIST : tgtX
          const engY = dist > 0 ? tgtY - (dy / dist) * ENGAGE_DIST : tgtY
          const edx  = engX - e.x, edy = engY - e.y
          const desiredAngle = Math.atan2(edy, edx)
          const speed        = Math.hypot(e.vx, e.vy)

          if (speed > 2) {
            // Rotate the velocity vector directly at the turn rate.
            // Adding force at an angle then clamping speed barely changes direction
            // when already at max speed — direct rotation guarantees the drone
            // actually loops back instead of flying in a straight line.
            const curAngle = Math.atan2(e.vy, e.vx)
            let angleDiff  = desiredAngle - curAngle
            if (angleDiff >  Math.PI) angleDiff -= Math.PI * 2
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2
            const newAngle = curAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnRateRad * dt)
            const newSpeed = Math.min(speed + accel * dt, effectiveMax)
            e.vx = Math.cos(newAngle) * newSpeed
            e.vy = Math.sin(newAngle) * newSpeed
          } else {
            // Near-stationary: accelerate directly toward target
            e.vx += Math.cos(desiredAngle) * accel * dt
            e.vy += Math.sin(desiredAngle) * accel * dt
            const spd = Math.hypot(e.vx, e.vy)
            if (spd > effectiveMax) { e.vx = (e.vx / spd) * effectiveMax; e.vy = (e.vy / spd) * effectiveMax }
          }
        } else {
          e.vx *= Math.pow(0.92, dt * 60)
          e.vy *= Math.pow(0.92, dt * 60)
        }
        e.x += e.vx * dt; e.y += e.vy * dt
        if (Math.hypot(e.vx, e.vy) > 3) e.heading = Math.atan2(e.vx, -e.vy)
        break
      }
      case 'STATIC':
        // Face whichever player is closer
        if (p2 && Math.hypot(p2.x - e.x, p2.y - e.y) < Math.hypot(px - e.x, py - e.y)) {
          e.heading = Math.atan2(p2.x - e.x, -(p2.y - e.y))
        } else {
          e.heading = Math.atan2(px - e.x, -(py - e.y))
        }
        break
    }
  }

  // ─── Drawing ─────────────────────────────────────────────────────────────

  private draw(playerX: number, playerY: number): void {
    this.gfx.clear()
    this.projGfx.clear()

    // Enemy shapes + health bars
    for (const e of this.entities) this.drawEnemy(e)

    // Turret beams — draw a beam line for beam-type weapons
    for (const e of this.entities) {
      if (!e.def.weaponId) continue
      const w = DataLoader.getWeapon(e.def.weaponId)
      if (!w?.behaviors?.BEAM) continue
      const dist = Math.hypot(e.x - playerX, e.y - playerY)
      if (dist > w.baseStats.RANGE) continue
      const a = 0.4 + 0.3 * Math.sin(Date.now() / 120)
      this.projGfx.lineStyle(2, 0xff2200, a)
      this.projGfx.lineBetween(e.x, e.y, playerX, playerY)
      this.projGfx.lineStyle(5, 0xff2200, a * 0.3)
      this.projGfx.lineBetween(e.x, e.y, playerX, playerY)
    }

    // Enemy projectiles
    for (const p of this.enemyProjs) {
      this.projGfx.lineStyle(p.size * 0.7, p.color, 0.4)
      this.projGfx.lineBetween(p.x, p.y, p.x - p.vx * 0.05, p.y - p.vy * 0.05)
      this.projGfx.fillStyle(p.color, 0.2)
      this.projGfx.fillCircle(p.x, p.y, p.size + 1.5)
      this.projGfx.fillStyle(p.color, 1.0)
      this.projGfx.fillCircle(p.x, p.y, p.size)
    }
  }

  private drawEnemy(e: EnemyEntity): void {
    const color = ENEMY_COLOR[e.def.id] ?? 0xff3300
    const cos   = Math.cos(e.heading), sin = Math.sin(e.heading)
    const pts   = e.shape.map(([x, y]): Phaser.Types.Math.Vector2Like => ({
      x: e.x + x * cos - y * sin,
      y: e.y + x * sin + y * cos,
    }))
    this.gfx.lineStyle(8, color, 0.05); this.gfx.strokePoints(pts, true)
    this.gfx.lineStyle(3, color, 0.25); this.gfx.strokePoints(pts, true)
    this.gfx.lineStyle(1.5, color, 1.0); this.gfx.strokePoints(pts, true)

    // Hit flash — bright white outline when taking damage
    if (e.hitFlashMs > 0) {
      const ft = Math.min(e.hitFlashMs / 80, 1)
      this.gfx.lineStyle(4, 0xffffff, ft * 0.85); this.gfx.strokePoints(pts, true)
    }
    // Cryo freeze — blue tint while slowed
    if (e.freezeMs > 0) {
      const ft = Math.min(e.freezeMs / 3000, 1)
      this.gfx.lineStyle(4, 0x44aaff, ft * 0.6); this.gfx.strokePoints(pts, true)
    }

    if (e.hullRatio < 1) {
      const bw = e.def.stats.COLLISION_RADIUS * 1.8
      const bx = e.x - bw / 2, by = e.y - e.def.stats.COLLISION_RADIUS - 10
      this.gfx.fillStyle(0x111111, 0.8); this.gfx.fillRect(bx, by, bw, 4)
      this.gfx.fillStyle(color, 1);      this.gfx.fillRect(bx, by, bw * e.hullRatio, 4)
    }
    if (e.def.stats.SHIELD_MAX > 0 && e.currentShield > 0) {
      const bw = e.def.stats.COLLISION_RADIUS * 1.8
      const bx = e.x - bw / 2, by = e.y - e.def.stats.COLLISION_RADIUS - 16
      this.gfx.fillStyle(0x111111, 0.8); this.gfx.fillRect(bx, by, bw, 3)
      this.gfx.fillStyle(0x4488ff, 1);   this.gfx.fillRect(bx, by, bw * e.shieldRatio, 3)
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private nearestAlive(
    x: number, y: number, range: number, heading: number, arcDeg: number,
    priority: 'any' | 'drones' | 'asteroids' = 'any'
  ): EnemyEntity | null {
    const halfArc = (arcDeg / 2) * (Math.PI / 180)

    const scan = (filter: (e: EnemyEntity) => boolean): EnemyEntity | null => {
      let best: EnemyEntity | null = null, bestDist = range
      for (const e of this.entities) {
        if (!e.alive || !filter(e)) continue
        const dx = e.x - x, dy = e.y - y
        const dist = Math.hypot(dx, dy)
        if (dist >= bestDist) continue
        if (arcDeg < 360) {
          const a = Math.atan2(dx, -dy)
          let diff = Math.abs(a - heading)
          if (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2)
          if (diff > halfArc) continue
        }
        best = e; bestDist = dist
      }
      return best
    }

    if (priority === 'drones')    return scan(e => e.def.behavior !== 'DRIFT') ?? scan(() => true)
    if (priority === 'asteroids') return scan(e => e.def.behavior === 'DRIFT') ?? scan(() => true)
    return scan(() => true)
  }

  // SUPPORT mode: rank enemies by distance to anchor (partner), but gate by shooter's arc/range
  nearestAliveToAnchor(
    anchorX: number, anchorY: number,
    shooterX: number, shooterY: number,
    range: number, heading: number, arcDeg: number,
    priority: 'any' | 'drones' | 'asteroids' = 'any'
  ): EnemyEntity | null {
    const halfArc = (arcDeg / 2) * (Math.PI / 180)

    const scan = (filter: (e: EnemyEntity) => boolean): EnemyEntity | null => {
      let best: EnemyEntity | null = null, bestAnchorDist = Infinity
      for (const e of this.entities) {
        if (!e.alive || !filter(e)) continue
        // Arc/range gate from shooter
        const sdx = e.x - shooterX, sdy = e.y - shooterY
        const shooterDist = Math.hypot(sdx, sdy)
        if (shooterDist >= range) continue
        if (arcDeg < 360) {
          const a = Math.atan2(sdx, -sdy)
          let diff = Math.abs(a - heading)
          if (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2)
          if (diff > halfArc) continue
        }
        // Rank by distance to anchor (partner)
        const anchorDist = Math.hypot(e.x - anchorX, e.y - anchorY)
        if (anchorDist < bestAnchorDist) { best = e; bestAnchorDist = anchorDist }
      }
      return best
    }

    if (priority === 'drones')    return scan(e => e.def.behavior !== 'DRIFT') ?? scan(() => true)
    if (priority === 'asteroids') return scan(e => e.def.behavior === 'DRIFT') ?? scan(() => true)
    return scan(() => true)
  }

  // Called on sector advance — spawns enemies in a ring around the player for immediate action
  spawnSectorTransitionWave(sector: SectorManager, playerX: number, playerY: number): void {
    const wave = sector.getSpawnWave()
    for (const { id, count } of wave) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist  = 500 + Math.random() * 500   // 500-1000u ring around player
        let x = ((playerX + Math.cos(angle) * dist) % WORLD_W + WORLD_W) % WORLD_W
        let y = ((playerY + Math.sin(angle) * dist) % WORLD_H + WORLD_H) % WORLD_H
        this.spawnEnemy(id, x, y, Math.random() * Math.PI * 2, sector.hpScale)
      }
    }
  }

  // ─── Particles & FX ──────────────────────────────────────────────────────

  private spawnHitSparks(x: number, y: number, radius: number): void {
    if (Math.random() > 0.5) return   // thin out to ~30 sparks/s at 60fps
    const angle = Math.random() * Math.PI * 2
    const spd   = 90 + Math.random() * 130
    const jx    = (Math.random() - 0.5) * radius * 0.8
    const jy    = (Math.random() - 0.5) * radius * 0.8
    this.impactParticles.push({
      x: x + jx, y: y + jy,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      life: 1, decay: 1 / (120 + Math.random() * 130),
      color: Math.random() > 0.4 ? 0xffffff : 0xffcc44,
      size: 1.2 + Math.random() * 1.8,
    })
  }

  private spawnDeathExplosion(x: number, y: number, radius: number, color: number): void {
    const count = radius > 50 ? 16 : radius > 25 ? 10 : 7
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const spd   = 70 + Math.random() * 220
      this.impactParticles.push({
        x, y,
        vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
        life: 1, decay: 1 / (280 + Math.random() * 420),
        color: Math.random() > 0.35 ? color : 0xffffff,
        size: 2 + Math.random() * (radius > 50 ? 5 : 3),
      })
    }
    // Expanding shockwave ring
    this.deathRings.push({
      x, y,
      radius: radius * 0.3, maxRadius: radius * 2.8,
      life: 1, decay: 1 / 380,
      color,
    })
    // Bright central flash (second smaller ring)
    this.deathRings.push({
      x, y,
      radius: 0, maxRadius: radius * 1.2,
      life: 1, decay: 1 / 160,
      color: 0xffffff,
    })
  }

  private tickParticles(deltaMs: number): void {
    for (const p of this.impactParticles) {
      p.x += p.vx * (deltaMs / 1000)
      p.y += p.vy * (deltaMs / 1000)
      p.vx *= 0.97; p.vy *= 0.97   // drag
      p.life -= p.decay * deltaMs
    }
    this.impactParticles = this.impactParticles.filter(p => p.life > 0)

    for (const r of this.deathRings) {
      r.radius += (r.maxRadius - r.radius) * 0.12   // eased expansion
      r.life   -= r.decay * deltaMs
    }
    this.deathRings = this.deathRings.filter(r => r.life > 0)
  }

  private drawFX(): void {
    const g = this.fxGfx
    g.clear()

    // Death rings (shockwaves)
    for (const r of this.deathRings) {
      const alpha = r.life * 0.8
      g.lineStyle(2.5, r.color, alpha * 0.7)
      g.strokeCircle(r.x, r.y, r.radius)
      g.lineStyle(6, r.color, alpha * 0.15)
      g.strokeCircle(r.x, r.y, r.radius)
    }

    // Impact / debris particles
    for (const p of this.impactParticles) {
      const alpha = p.life
      // Draw as a small streak in the direction of travel
      const spd = Math.hypot(p.vx, p.vy)
      if (spd > 10) {
        const trailLen = Math.min(spd * 0.04, p.size * 3)
        g.lineStyle(p.size * 0.8, p.color, alpha * 0.6)
        g.lineBetween(
          p.x, p.y,
          p.x - (p.vx / spd) * trailLen,
          p.y - (p.vy / spd) * trailLen
        )
      }
      g.fillStyle(p.color, alpha)
      g.fillCircle(p.x, p.y, p.size * 0.6)
    }
  }

  getEnemyProjectileStates(): Array<{ x: number; y: number; vx: number; vy: number; color: number; size: number }> {
    return this.enemyProjs.map(p => ({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, color: p.color, size: p.size }))
  }

  applyCryoPulse(x: number, y: number, radius: number, durationMs: number): void {
    for (const e of this.entities) {
      if (!e.alive) continue
      if (Math.hypot(e.x - x, e.y - y) <= radius) {
        e.freezeMs = Math.max(e.freezeMs, durationMs)
      }
    }
    // Blue expanding ring
    this.deathRings.push({ x, y, radius: 30, maxRadius: radius, life: 1, decay: 1 / 600, color: 0x44aaff })
  }

  /** Separate all overlapping enemy pairs so entities don't stack. */
  private resolveEnemyCollisions(): void {
    for (let i = 0; i < this.entities.length; i++) {
      const a = this.entities[i]
      if (!a.alive) continue
      for (let j = i + 1; j < this.entities.length; j++) {
        const b = this.entities[j]
        if (!b.alive) continue
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.hypot(dx, dy)
        const minDist = a.def.stats.COLLISION_RADIUS + b.def.stats.COLLISION_RADIUS
        if (dist >= minDist || dist < 0.5) continue

        const nx = dx / dist, ny = dy / dist
        const overlap = (minDist - dist) * 0.5

        const aMovable = a.def.behavior !== 'STATIC'
        const bMovable = b.def.behavior !== 'STATIC'

        if (aMovable) { a.x -= nx * overlap; a.y -= ny * overlap }
        if (bMovable) { b.x += nx * overlap; b.y += ny * overlap }

        // Bounce velocity component along normal
        if (aMovable) {
          const dot = a.vx * nx + a.vy * ny
          if (dot < 0) { a.vx -= dot * nx * 0.7; a.vy -= dot * ny * 0.7 }
        }
        if (bMovable) {
          const dot = b.vx * nx + b.vy * ny
          if (dot > 0) { b.vx -= dot * nx * 0.7; b.vy -= dot * ny * 0.7 }
        }
      }
    }
  }

  get count(): number { return this.entities.length }

  getEntities(): readonly EnemyEntity[] { return this.entities }

  getRemoteStates(): Array<{ instanceId: string; defId: string; x: number; y: number; heading: number; hullRatio: number; shieldRatio: number }> {
    return this.entities.map(e => ({
      instanceId: e.instanceId,
      defId:      e.def.id,
      x: e.x, y: e.y, heading: e.heading,
      hullRatio:   e.hullRatio,
      shieldRatio: e.shieldRatio,
    }))
  }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function computeLoadout(ids: string[]): { dps: number; range: number; arc: number } {
  let dps = 0, range = 0, arc = 0
  for (const id of ids) {
    const w = WEAPON_STATS[id]
    if (w) { dps += w.dps; range = Math.max(range, w.range); arc = Math.max(arc, w.arc) }
  }
  return { dps: dps || 64, range: range || 250, arc: arc || 90 }
}

function wrapEntity(e: EnemyEntity): void {
  if (e.x < 0) e.x += WORLD_W; if (e.x > WORLD_W) e.x -= WORLD_W
  if (e.y < 0) e.y += WORLD_H; if (e.y > WORLD_H) e.y -= WORLD_H
}
