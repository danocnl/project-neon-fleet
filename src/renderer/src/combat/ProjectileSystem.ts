import Phaser from 'phaser'

// Visual config per weapon id
const WEAPON_VISUAL: Record<string, {
  color:       number
  size:        number   // core radius px
  speed:       number   // visual travel speed u/s
  cooldownMs:  number   // 1000 / ROF
}> = {
  light_chaingun: { color: 0xdddddd, size: 2.5, speed: 420, cooldownMs: 125  },
  chaingun:       { color: 0xcccccc, size: 3.5, speed: 440, cooldownMs: 167  },
  heavy_chaingun: { color: 0xbbbbbb, size: 4.5, speed: 460, cooldownMs: 250  },
  pulse_laser:    { color: 0x00ffff, size: 1.6, speed: 700, cooldownMs: 340  },
  beam_laser:     { color: 0x00ccff, size: 2.0, speed: 800, cooldownMs: 100  },
  emp_cannon:     { color: 0x4466ff, size: 5.0, speed: 320, cooldownMs: 1000 },
  arc_cannon:     { color: 0xff8800, size: 4.5, speed: 380, cooldownMs: 833  },
  micro_missile:  { color: 0xffaa00, size: 4.0, speed: 260, cooldownMs: 667  },
  torpedo:        { color: 0xff6600, size: 6.0, speed: 200, cooldownMs: 2857 },
}

interface VisualProjectile {
  x: number; y: number
  vx: number; vy: number
  color: number
  size: number
  lifetimeMs: number
}

interface WeaponSlot {
  id: string
  lateralOffset: number   // px perpendicular to heading — separates hardpoints
  cooldownMs: number
}

export class ProjectileSystem {
  private projectiles: VisualProjectile[] = []
  private slots: WeaponSlot[] = []
  private gfx!: Phaser.GameObjects.Graphics

  init(scene: Phaser.Scene, weaponIds: string[]): void {
    this.gfx = scene.add.graphics().setDepth(7)

    // Spread weapons across hardpoints — 2 weapons → offsets [-8, +8], 1 weapon → [0]
    const offsets = weaponIds.length === 1 ? [0] : [-9, 9]
    this.slots = weaponIds.slice(0, 2).map((id, i) => ({
      id,
      lateralOffset: offsets[i] ?? (i % 2 === 0 ? -9 : 9),
      cooldownMs: 0,
    }))
  }

  update(
    dt: number,
    shipX: number, shipY: number, shipHeading: number,
    targetX: number, targetY: number,
    hasTarget: boolean
  ): void {
    const deltaMs = dt * 1000

    // Fire each weapon slot
    if (hasTarget) {
      const perpX = Math.cos(shipHeading)
      const perpY = Math.sin(shipHeading)

      for (const slot of this.slots) {
        slot.cooldownMs -= deltaMs
        if (slot.cooldownMs > 0) continue

        const visual = WEAPON_VISUAL[slot.id]
        if (!visual) { slot.cooldownMs = 200; continue }

        // Spawn position = ship centre + lateral offset perpendicular to heading
        const sx = shipX + perpX * slot.lateralOffset
        const sy = shipY + perpY * slot.lateralOffset

        const dx = targetX - sx
        const dy = targetY - sy
        const dist = Math.hypot(dx, dy)
        if (dist < 1) continue

        const vx = (dx / dist) * visual.speed
        const vy = (dy / dist) * visual.speed
        // Lifetime long enough to reach target, capped so stray projectiles don't linger
        const lifetime = Math.min((dist / visual.speed) * 1000 + 80, 2000)

        this.projectiles.push({ x: sx, y: sy, vx, vy, color: visual.color, size: visual.size, lifetimeMs: lifetime })
        slot.cooldownMs = visual.cooldownMs
      }
    } else {
      // Drain cooldowns even when no target so weapons are ready when one appears
      for (const slot of this.slots) slot.cooldownMs = Math.max(0, slot.cooldownMs - deltaMs)
    }

    // Advance and cull projectiles
    for (const p of this.projectiles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.lifetimeMs -= deltaMs
    }
    this.projectiles = this.projectiles.filter(p => p.lifetimeMs > 0)
  }

  getStates(): Array<{ x: number; y: number; vx: number; vy: number; color: number; size: number }> {
    return this.projectiles.map(p => ({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, color: p.color, size: p.size }))
  }

  draw(): void {
    const g = this.gfx
    g.clear()

    for (const p of this.projectiles) {
      // Trail — omitted for small/fast projectiles (they look cleaner without it)
      if (p.size >= 2.5) {
        g.lineStyle(p.size * 0.7, p.color, 0.35)
        g.lineBetween(p.x, p.y, p.x - p.vx * 0.055, p.y - p.vy * 0.055)
      }

      // Outer glow (tighter for small projectiles)
      const glowR = p.size < 2.5 ? p.size + 1.2 : p.size + 2.5
      g.fillStyle(p.color, 0.18)
      g.fillCircle(p.x, p.y, glowR)

      // Core
      g.fillStyle(p.color, 1.0)
      g.fillCircle(p.x, p.y, p.size)
    }
  }
}
