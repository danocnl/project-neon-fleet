import Phaser from 'phaser'
import { EnemyEntity } from './EnemyEntity'
import { DataLoader } from '../systems/DataLoader'
import type { Enemy } from '../types'

const WORLD_W = 1280 * 5
const WORLD_H = 720  * 5
const SPAWN_CLEAR_RADIUS = 700   // keep enemies away from world centre at spawn

// Hardcoded DPS + range + firing arc for default loadout weapons
const WEAPON_STATS: Record<string, { dps: number; range: number; arc: number }> = {
  light_chaingun: { dps: 64,  range: 250, arc: 90  },
  chaingun:       { dps: 108, range: 300, arc: 90  },
  pulse_laser:    { dps: 60,  range: 300, arc: 90  },
  emp_cannon:     { dps: 30,  range: 350, arc: 120 },
  arc_cannon:     { dps: 50,  range: 320, arc: 90  },
}

// Colours per enemy category
const ENEMY_COLOR: Record<string, number> = {
  asteroid_xl:     0x99aabb,
  asteroid_large:  0x8899aa,
  asteroid_medium: 0x778899,
  asteroid_small:  0x667788,
  scout_drone:     0xff4422,
  attack_drone:    0xff2200,
  turret:          0xdd1100,
}

export interface KillResult {
  credits:  number
  xp:       number
  position: { x: number; y: number }
}

export class EnemyManager {
  private entities:      EnemyEntity[] = []
  private defs           = new Map<string, Enemy>()
  private gfx!:          Phaser.GameObjects.Graphics
  private attackGfx!:    Phaser.GameObjects.Graphics
  private _currentTarget: EnemyEntity | null = null

  get currentTarget(): EnemyEntity | null { return this._currentTarget }

  init(scene: Phaser.Scene): void {
    this.gfx       = scene.add.graphics().setDepth(4)
    this.attackGfx = scene.add.graphics().setDepth(6).setScrollFactor(1)

    // Load all enemy definitions
    const rawEnemies = DataLoader.getAllEnemies()
    for (const e of rawEnemies) this.defs.set(e.id, e)
  }

  spawnInitial(): void {
    const cx = WORLD_W / 2, cy = WORLD_H / 2

    const spawn = (id: string, count: number, minDist = SPAWN_CLEAR_RADIUS) => {
      for (let i = 0; i < count; i++) {
        let x: number, y: number
        do {
          x = Math.random() * WORLD_W
          y = Math.random() * WORLD_H
        } while (Math.hypot(x - cx, y - cy) < minDist)
        this.spawnEnemy(id, x, y, Math.random() * Math.PI * 2)
      }
    }

    spawn('asteroid_xl',    12, 800)
    spawn('asteroid_large',  8, 500)
    spawn('asteroid_medium', 6, 400)
    spawn('scout_drone',     3, 500)
    spawn('attack_drone',    2, 600)
    spawn('turret',          1, 800)
  }

  spawnEnemy(id: string, x: number, y: number, angle: number): EnemyEntity | null {
    const def = this.defs.get(id)
    if (!def) return null
    const e = new EnemyEntity(def, x, y, angle)
    this.entities.push(e)
    return e
  }

  // ─── Per-frame update ───────────────────────────────────────────────────

  update(
    dt: number,
    playerX: number, playerY: number,
    playerHeading: number,
    weaponIds: string[],
    onEnemyAttack: (damage: number) => void,
    onKill: (result: KillResult) => void
  ): void {
    const { dps: playerDps, range: playerRange, arc: playerArc } = computeLoadout(weaponIds)

    // Update all entities
    for (const e of this.entities) {
      if (!e.alive) continue
      e.tick(dt * 1000)
      this.updateBehavior(e, dt, playerX, playerY)
      wrapEntity(e)
    }

    // Player attacks nearest enemy within weapon range AND firing arc
    const target = this.nearestAlive(playerX, playerY, playerRange, playerHeading, playerArc)
    this._currentTarget = target
    if (target) {
      target.takeDamage(playerDps * dt)
    }

    // Enemies attack player
    for (const e of this.entities) {
      if (!e.alive || !e.def.weapon) continue
      const dist = Math.hypot(e.x - playerX, e.y - playerY)
      if (dist > e.def.weapon.range) continue

      if (e.def.weapon.isBeam) {
        // Continuous beam — damage per frame
        onEnemyAttack(e.def.weapon.damage * dt)
      } else {
        // Discrete shots — use cooldown
        if (e.attackCooldownMs <= 0) {
          onEnemyAttack(e.def.weapon.damage)
          e.attackCooldownMs = (1 / e.def.weapon.rateOfFire) * 1000
        }
      }
    }

    // Collect dead entities
    const dead = this.entities.filter(e => !e.alive)
    this.entities = this.entities.filter(e => e.alive)

    for (const e of dead) {
      // Spawn breakdown children
      if (e.def.breakdown) {
        for (let i = 0; i < e.def.breakdown.count; i++) {
          const a = e.heading + Math.PI * i + (Math.random() - 0.5) * 0.8
          const offset = e.def.stats.COLLISION_RADIUS * 0.6
          this.spawnEnemy(
            e.def.breakdown.enemyId,
            e.x + Math.cos(a) * offset,
            e.y + Math.sin(a) * offset,
            a
          )
        }
      }
      onKill({
        credits:  Phaser.Math.Between(e.def.drops.creditsMin, e.def.drops.creditsMax),
        xp:       (e.def as any).xpValue ?? 1,
        position: { x: e.x, y: e.y },
      })
    }

    this.draw()
  }

  // ─── AI behavior ────────────────────────────────────────────────────────

  private updateBehavior(e: EnemyEntity, dt: number, px: number, py: number): void {
    switch (e.def.behavior) {
      case 'DRIFT':
        e.x += e.vx * dt
        e.y += e.vy * dt
        e.heading = Math.atan2(e.vx, -e.vy)
        break

      case 'CHASE': {
        const dx = px - e.x, dy = py - e.y
        const dist = Math.hypot(dx, dy)
        if (dist > 1) {
          const accel = e.def.stats.ACCELERATION
          e.vx += (dx / dist) * accel * dt
          e.vy += (dy / dist) * accel * dt
          // Clamp to max speed
          const spd = Math.hypot(e.vx, e.vy)
          if (spd > e.def.stats.SPEED) {
            e.vx = (e.vx / spd) * e.def.stats.SPEED
            e.vy = (e.vy / spd) * e.def.stats.SPEED
          }
        }
        e.x += e.vx * dt
        e.y += e.vy * dt
        if (Math.hypot(e.vx, e.vy) > 5) e.heading = Math.atan2(e.vx, -e.vy)
        break
      }

      case 'STATIC':
        // Turret rotates to face player
        e.heading = Math.atan2(px - e.x, -(py - e.y))
        break
    }
  }

  // ─── Drawing ─────────────────────────────────────────────────────────────

  private draw(): void {
    this.gfx.clear()
    this.attackGfx.clear()
    for (const e of this.entities) {
      this.drawEnemy(e)
    }
  }

  private drawEnemy(e: EnemyEntity): void {
    const color = ENEMY_COLOR[e.def.id] ?? 0xff3300
    const cos   = Math.cos(e.heading)
    const sin   = Math.sin(e.heading)

    // Rotate shape points
    const pts = e.shape.map(([x, y]): Phaser.Types.Math.Vector2Like => ({
      x: e.x + x * cos - y * sin,
      y: e.y + x * sin + y * cos,
    }))

    // Neon glow layers
    this.gfx.lineStyle(8, color, 0.05); this.gfx.strokePoints(pts, true)
    this.gfx.lineStyle(3, color, 0.25); this.gfx.strokePoints(pts, true)
    this.gfx.lineStyle(1.5, color, 1.0); this.gfx.strokePoints(pts, true)

    // HP bar (shown when damaged)
    if (e.hullRatio < 1) {
      const bw = e.def.stats.COLLISION_RADIUS * 1.8
      const bx = e.x - bw / 2
      const by = e.y - e.def.stats.COLLISION_RADIUS - 10

      this.gfx.fillStyle(0x111111, 0.8)
      this.gfx.fillRect(bx, by, bw, 4)
      this.gfx.fillStyle(color, 1)
      this.gfx.fillRect(bx, by, bw * e.hullRatio, 4)
    }

    // Shield bar (blue, only when has shields)
    if (e.def.stats.SHIELD_MAX > 0 && e.currentShield > 0) {
      const bw = e.def.stats.COLLISION_RADIUS * 1.8
      const bx = e.x - bw / 2
      const by = e.y - e.def.stats.COLLISION_RADIUS - 16

      this.gfx.fillStyle(0x111111, 0.8)
      this.gfx.fillRect(bx, by, bw, 3)
      this.gfx.fillStyle(0x4488ff, 1)
      this.gfx.fillRect(bx, by, bw * e.shieldRatio, 3)
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private nearestAlive(
    x: number, y: number,
    range: number,
    shipHeading: number,
    arcDegrees: number
  ): EnemyEntity | null {
    let best: EnemyEntity | null = null
    let bestDist = range
    const halfArc = (arcDegrees / 2) * (Math.PI / 180)

    for (const e of this.entities) {
      if (!e.alive) continue
      const dx = e.x - x, dy = e.y - y
      const dist = Math.hypot(dx, dy)
      if (dist >= bestDist) continue

      // Check firing arc — skip if target is outside the weapon's cone
      if (arcDegrees < 360) {
        const angleToTarget = Math.atan2(dx, -dy)  // same convention as body.heading (0 = up)
        let diff = Math.abs(angleToTarget - shipHeading)
        if (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2)
        if (diff > halfArc) continue
      }

      best = e; bestDist = dist
    }
    return best
  }

  get count(): number { return this.entities.length }

  getEntities(): readonly EnemyEntity[] { return this.entities }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function computeLoadout(weaponIds: string[]): { dps: number; range: number; arc: number } {
  let dps = 0, range = 0, arc = 0
  for (const id of weaponIds) {
    const w = WEAPON_STATS[id]
    if (w) { dps += w.dps; range = Math.max(range, w.range); arc = Math.max(arc, w.arc) }
  }
  return { dps: dps || 64, range: range || 250, arc: arc || 90 }
}

function wrapEntity(e: EnemyEntity): void {
  if (e.x < 0) e.x += WORLD_W
  if (e.x > WORLD_W) e.x -= WORLD_W
  if (e.y < 0) e.y += WORLD_H
  if (e.y > WORLD_H) e.y -= WORLD_H
}
