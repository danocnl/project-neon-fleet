import Phaser from 'phaser'
import { getGeometry, type ShipGeometry } from '../ships/ShipGeometry'
import { createBody, stepPhysics, wrapBounds, type PhysicsBody } from '../physics/PhysicsBody'
import { orbit } from '../physics/NavBehaviors'
import { DataLoader } from '../systems/DataLoader'

interface ShipActor {
  shipId: string
  geometry: ShipGeometry
  body: PhysicsBody
  gfx: Phaser.GameObjects.Graphics
  labelName: Phaser.GameObjects.Text
  labelStats: Phaser.GameObjects.Text
  orbitAngle: number
  orbitRadius: number
  orbitSpeed: number   // radians per second
}

const PROTOTYPE_SHIPS = ['sidewinder', 'chieftain', 'anaconda']

export class PhysicsScene extends Phaser.Scene {
  private actors: ShipActor[] = []
  private gridGfx!: Phaser.GameObjects.Graphics
  private cx = 0
  private cy = 0

  constructor() {
    super({ key: 'PhysicsScene' })
  }

  create(): void {
    const { width, height } = this.cameras.main
    this.cx = width / 2
    this.cy = height / 2

    this.gridGfx = this.add.graphics()
    this.drawGrid()

    this.add.text(width / 2, 18, 'PHASE 2 — PHYSICS SANDBOX', {
      fontSize: '14px', color: '#444444', fontFamily: 'monospace'
    }).setOrigin(0.5)

    this.buildActors()
  }

  private buildActors(): void {
    const configs: { id: string; radius: number; speed: number }[] = [
      { id: 'sidewinder', radius: 160, speed: 1.4 },
      { id: 'chieftain',  radius: 240, speed: 0.8 },
      { id: 'anaconda',   radius: 310, speed: 0.45 },
    ]

    for (const cfg of configs) {
      const geo  = getGeometry(cfg.id)
      const ship = DataLoader.getShip(cfg.id)
      if (!geo || !ship) continue

      // Derive physics params from ship base stats
      // maxSpeed: scale from TOP_SPEED stat (range 150–620 → 80–300 px/s)
      const maxSpeed   = remap(ship.baseStats.TOP_SPEED, 150, 620, 80, 300)
      // accel: scale from ACCELERATION stat
      const accel      = remap(ship.baseStats.ACCELERATION, 100, 600, 60, 220)
      // mass: direct from stat
      const mass       = ship.baseStats.MASS
      // drag: heavier ships retain momentum longer (less drag)
      const drag       = remap(mass, 1, 12, 0.82, 0.94)

      // Start the ship at its orbit position
      const startAngle = Math.random() * Math.PI * 2
      const startX     = this.cx + Math.sin(startAngle) * cfg.radius
      const startY     = this.cy - Math.cos(startAngle) * cfg.radius

      const body = createBody(startX, startY, maxSpeed, accel, mass, drag)

      const gfx = this.add.graphics()

      const labelName = this.add.text(0, 0, ship.name.replace(' Frame', ''), {
        fontSize: '11px', color: `#${geo.color.toString(16).padStart(6, '0')}`,
        fontFamily: 'monospace'
      }).setOrigin(0.5, 1).setAlpha(0.9)

      const labelStats = this.add.text(0, 0,
        `SPD ${Math.round(ship.baseStats.TOP_SPEED)} · MASS ${mass}`, {
        fontSize: '9px', color: '#555555', fontFamily: 'monospace'
      }).setOrigin(0.5, 0)

      this.actors.push({
        shipId: cfg.id,
        geometry: geo,
        body,
        gfx,
        labelName,
        labelStats,
        orbitAngle: startAngle,
        orbitRadius: cfg.radius,
        orbitSpeed: cfg.speed,
      })
    }
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05) // seconds, capped to avoid spiral on tab switch

    for (const actor of this.actors) {
      // Advance orbit angle
      actor.orbitAngle += actor.orbitSpeed * dt

      // Nav: seek the current orbit target position
      const { fx, fy } = orbit(
        actor.body,
        this.cx, this.cy,
        actor.orbitRadius,
        actor.orbitAngle
      )

      stepPhysics(actor.body, fx, fy, dt)
      wrapBounds(actor.body, this.cameras.main.width, this.cameras.main.height)

      // Redraw ship
      actor.gfx.clear()
      drawNeonShip(actor.gfx, actor.body, actor.geometry)

      // Move labels
      const labelY = actor.body.y - 46
      actor.labelName.setPosition(actor.body.x, labelY)
      actor.labelStats.setPosition(actor.body.x, labelY + 2)
    }
  }

  private drawGrid(): void {
    const { width, height } = this.cameras.main
    this.gridGfx.clear()
    this.gridGfx.lineStyle(1, 0x003366, 0.35)
    const size = 60
    for (let x = 0; x <= width;  x += size) this.gridGfx.lineBetween(x, 0, x, height)
    for (let y = 0; y <= height; y += size) this.gridGfx.lineBetween(0, y, width, y)

    // Faint orbit rings for reference
    this.gridGfx.lineStyle(1, 0x004488, 0.2)
    for (const r of [160, 240, 310]) {
      this.gridGfx.strokeCircle(this.cx, this.cy, r)
    }
  }
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function drawNeonShip(
  gfx: Phaser.GameObjects.Graphics,
  body: PhysicsBody,
  geo: ShipGeometry
): void {
  const cos = Math.cos(body.heading)
  const sin = Math.sin(body.heading)

  const rot = (x: number, y: number): Phaser.Types.Math.Vector2Like => ({
    x: body.x + x * cos - y * sin,
    y: body.y + x * sin + y * cos,
  })

  const pts = geo.outline.map(([x, y]) => rot(x, y))

  // Outer glow
  gfx.lineStyle(10, geo.color, 0.04)
  gfx.strokePoints(pts, true)
  // Mid glow
  gfx.lineStyle(5, geo.color, 0.15)
  gfx.strokePoints(pts, true)
  // Inner glow
  gfx.lineStyle(2.5, geo.color, 0.5)
  gfx.strokePoints(pts, true)
  // Core line
  gfx.lineStyle(1.5, geo.color, 1.0)
  gfx.strokePoints(pts, true)

  // Detail lines
  for (const [x1, y1, x2, y2] of geo.details) {
    const p1 = rot(x1, y1)
    const p2 = rot(x2, y2)
    gfx.lineStyle(1, geo.color, 0.5)
    gfx.lineBetween(p1.x, p1.y, p2.x, p2.y)
  }
}

function remap(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin)
}
