import Phaser from 'phaser'
import { getGeometry, type ShipGeometry } from '../ships/ShipGeometry'
import { createBody, stepPhysics, wrapBounds, type PhysicsBody } from '../physics/PhysicsBody'
import { orbit } from '../physics/NavBehaviors'
import { DataLoader } from '../systems/DataLoader'
import { CLASS_COLORS } from '../ships/ClassIcons'

interface RunData {
  pilot:   string
  shipId:  string
  classId: string
}

interface ShipActor {
  geometry:    ShipGeometry
  body:        PhysicsBody
  gfx:         Phaser.GameObjects.Graphics
  orbitAngle:  number
  orbitRadius: number
  orbitSpeed:  number
}

export class PhysicsScene extends Phaser.Scene {
  private actor!: ShipActor
  private gridGfx!: Phaser.GameObjects.Graphics
  private cx = 0
  private cy = 0
  private runData!: RunData

  constructor() {
    super({ key: 'PhysicsScene' })
  }

  init(data: RunData): void {
    this.runData = {
      pilot:   data?.pilot   ?? 'PILOT',
      shipId:  data?.shipId  ?? 'sidewinder',
      classId: data?.classId ?? 'chrono_architect',
    }
  }

  create(): void {
    const { width, height } = this.cameras.main
    this.cx = width / 2
    this.cy = height / 2

    this.gridGfx = this.add.graphics()
    this.drawGrid()
    this.buildActor()
    this.buildHUD()
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05)

    this.actor.orbitAngle += this.actor.orbitSpeed * dt
    const { fx, fy } = orbit(
      this.actor.body,
      this.cx, this.cy,
      this.actor.orbitRadius,
      this.actor.orbitAngle
    )
    stepPhysics(this.actor.body, fx, fy, dt)
    wrapBounds(this.actor.body, this.cameras.main.width, this.cameras.main.height)

    this.actor.gfx.clear()
    const shipColor = CLASS_COLORS[this.runData.classId] ?? 0x00ffff
    drawNeonShip(this.actor.gfx, this.actor.body, this.actor.geometry, shipColor)
  }

  // ─── Build ─────────────────────────────────────────────────────────────────

  private buildActor(): void {
    const { shipId } = this.runData
    const geo  = getGeometry(shipId)
    const ship = DataLoader.getShip(shipId)
    if (!geo || !ship) return

    const maxSpeed = remap(ship.baseStats.TOP_SPEED,    150, 620, 80, 300)
    const accel    = remap(ship.baseStats.ACCELERATION, 100, 600, 60, 220)
    const mass     = ship.baseStats.MASS
    const drag     = remap(mass, 1, 12, 0.82, 0.94)

    const orbitRadius = 180
    const startAngle  = 0
    const startX = this.cx + Math.sin(startAngle) * orbitRadius
    const startY = this.cy - Math.cos(startAngle) * orbitRadius

    const body = createBody(startX, startY, maxSpeed, accel, mass, drag)
    const gfx  = this.add.graphics()

    this.actor = {
      geometry:    geo,
      body,
      gfx,
      orbitAngle:  startAngle,
      orbitRadius,
      orbitSpeed:  0.9,
    }
  }

  private buildHUD(): void {
    const ship = DataLoader.getShip(this.runData.shipId)
    const cls  = DataLoader.getClass(this.runData.classId)
    if (!ship || !cls) return

    const geo = getGeometry(this.runData.shipId)
    const shipHex  = geo  ? `#${geo.color.toString(16).padStart(6, '0')}` : '#00ffff'
    const classColor = CLASS_COLORS[this.runData.classId] ?? 0xff00ff
    const classHex = `#${classColor.toString(16).padStart(6, '0')}`

    // Pilot callsign
    this.add.text(14, 14, this.runData.pilot, {
      fontSize: '13px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    })

    // Ship name
    this.add.text(14, 32, ship.name.replace(' Frame', '').toUpperCase(), {
      fontSize: '11px', color: shipHex, fontFamily: 'monospace',
    })

    // Class name
    this.add.text(14, 48, cls.name, {
      fontSize: '11px', color: classHex, fontFamily: 'monospace',
    })
  }

  private drawGrid(): void {
    const { width, height } = this.cameras.main
    this.gridGfx.clear()
    this.gridGfx.lineStyle(1, 0x003366, 0.3)
    const size = 60
    for (let x = 0; x <= width;  x += size) this.gridGfx.lineBetween(x, 0, x, height)
    for (let y = 0; y <= height; y += size) this.gridGfx.lineBetween(0, y, width, y)
  }
}

// ─── Rendering ─────────────────────────────────────────────────────────────

function drawNeonShip(
  gfx: Phaser.GameObjects.Graphics,
  body: PhysicsBody,
  geo: ShipGeometry,
  color: number
): void {
  const cos = Math.cos(body.heading)
  const sin = Math.sin(body.heading)
  const s   = geo.scale

  const rot = (x: number, y: number): Phaser.Types.Math.Vector2Like => ({
    x: body.x + (x * cos - y * sin) * s,
    y: body.y + (x * sin + y * cos) * s,
  })

  const pts = geo.outline.map(([x, y]) => rot(x, y))

  // 4-layer neon glow in class colour
  gfx.lineStyle(10, color, 0.04); gfx.strokePoints(pts, true)
  gfx.lineStyle(5,  color, 0.15); gfx.strokePoints(pts, true)
  gfx.lineStyle(2.5,color, 0.55); gfx.strokePoints(pts, true)
  gfx.lineStyle(1.5,color, 1.0);  gfx.strokePoints(pts, true)

  for (const [x1, y1, x2, y2] of geo.details) {
    const p1 = rot(x1, y1)
    const p2 = rot(x2, y2)
    gfx.lineStyle(1, color, 0.45)
    gfx.lineBetween(p1.x, p1.y, p2.x, p2.y)
  }
}

function remap(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin)
}
