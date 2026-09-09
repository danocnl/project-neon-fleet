import Phaser from 'phaser'
import { getGeometry, type ShipGeometry } from '../ships/ShipGeometry'
import { createBody, stepPhysics, wrapBounds, type PhysicsBody } from '../physics/PhysicsBody'
import { orbit } from '../physics/NavBehaviors'
import { DataLoader } from '../systems/DataLoader'
import { LoadoutManager } from '../systems/LoadoutManager'
import type { PlayerState } from '../systems/LoadoutManager'
import { CLASS_COLORS } from '../ships/ClassIcons'
import { CombatState } from '../combat/CombatState'
import { EventDispatcher } from '../combat/EventDispatcher'
import { TriggerEvaluator } from '../combat/TriggerEvaluator'
import { ActionExecutor } from '../combat/ActionExecutor'
import { CombatSimulator } from '../combat/CombatSimulator'
import type { UpgradeCard } from '../types'

// ─── World & layout constants ─────────────────────────────────────────────────
const VIEW_W   = 1280
const VIEW_H   = 720
const WORLD_W  = VIEW_W * 5   // 6400
const WORLD_H  = VIEW_H * 5   // 3600
const GRID_SZ  = 60

const KILLS_PER_LEVEL = 3
const LOG_MAX = 6

// Minimap (screen-space, top-right)
const MM_X = 1042
const MM_Y = 60
const MM_W = 228
const MM_H = 128

interface RunData { pilot: string; shipId: string; classId: string }

interface ShipActor {
  geometry:    ShipGeometry
  body:        PhysicsBody
  gfx:         Phaser.GameObjects.Graphics
  orbitAngle:  number
  orbitRadius: number
  orbitSpeed:  number
}

export class PhysicsScene extends Phaser.Scene {
  private actor!:    ShipActor
  private gridGfx!:  Phaser.GameObjects.Graphics   // screen-space virtual grid
  private flashGfx!: Phaser.GameObjects.Graphics   // world-space flash
  private minimapGfx!: Phaser.GameObjects.Graphics // screen-space minimap

  // World centre (orbit point)
  private wx = WORLD_W / 2
  private wy = WORLD_H / 2

  private runData!: RunData

  // Combat
  private combatState!:    CombatState
  private dispatcher!:     EventDispatcher
  private evaluator!:      TriggerEvaluator
  private executor!:       ActionExecutor
  private simulator!:      CombatSimulator
  private playerState!:    PlayerState
  private draftedCards:    UpgradeCard[] = []
  private readonly mgr = new LoadoutManager()

  // Progression
  private killCount  = 0
  private level      = 1
  private drafting   = false
  private killCounterText!:  Phaser.GameObjects.Text
  private levelText!:        Phaser.GameObjects.Text
  private modulesContainer!: Phaser.GameObjects.Container

  // HUD bars
  private hullBar!:    Phaser.GameObjects.Graphics
  private shieldBar!:  Phaser.GameObjects.Graphics
  private heatBar!:    Phaser.GameObjects.Graphics
  private effectText!: Phaser.GameObjects.Text
  private logEntries:  Phaser.GameObjects.Text[] = []
  private hullText!:   Phaser.GameObjects.Text
  private shieldText!: Phaser.GameObjects.Text
  private heatText!:   Phaser.GameObjects.Text

  constructor() { super({ key: 'PhysicsScene' }) }

  init(data: RunData): void {
    this.runData = {
      pilot:   data?.pilot   ?? 'PILOT',
      shipId:  data?.shipId  ?? 'sidewinder',
      classId: data?.classId ?? 'chrono_architect',
    }
  }

  create(): void {
    // Virtual grid — screen-space, redrawn each frame
    this.gridGfx = this.add.graphics().setScrollFactor(0).setDepth(0)

    // World-space flash (follows camera naturally)
    this.flashGfx = this.add.graphics().setDepth(10)

    // Minimap — screen-space overlay
    this.minimapGfx = this.add.graphics().setScrollFactor(0).setDepth(100)

    this.buildActor()
    this.buildCombatSystems()
    this.buildHUD()
  }

  update(_t: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05)

    // Physics
    this.actor.orbitAngle += this.actor.orbitSpeed * dt
    const { fx, fy } = orbit(
      this.actor.body, this.wx, this.wy,
      this.actor.orbitRadius, this.actor.orbitAngle
    )
    stepPhysics(this.actor.body, fx, fy, dt)
    wrapBounds(this.actor.body, WORLD_W, WORLD_H)

    // Camera follows ship
    this.cameras.main.centerOn(this.actor.body.x, this.actor.body.y)

    // Combat tick
    const ship = DataLoader.getShip(this.runData.shipId)!
    this.combatState.tick(delta, ship.baseStats.SHIELD_REGEN / 1000)

    // Redraw
    const clsColor   = CLASS_COLORS[this.runData.classId] ?? 0x00ffff
    const phaseAlpha = this.combatState.isPhased ? 0.3 : 1

    this.actor.gfx.clear()
    drawNeonShip(this.actor.gfx, this.actor.body, this.actor.geometry, clsColor, phaseAlpha)

    this.updateGrid()
    this.updateMinimap(clsColor)
    this.updateHUD()
  }

  // ─── Build ───────────────────────────────────────────────────────────────

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
    const body = createBody(
      this.wx + Math.sin(0) * orbitRadius,
      this.wy - Math.cos(0) * orbitRadius,
      maxSpeed, accel, mass, drag
    )

    this.actor = {
      geometry: geo,
      body,
      gfx: this.add.graphics().setDepth(5),
      orbitAngle: 0,
      orbitRadius,
      orbitSpeed: 0.9,
    }
  }

  private buildCombatSystems(): void {
    const ship = DataLoader.getShip(this.runData.shipId)!

    this.playerState  = this.mgr.build(this.runData.shipId, this.runData.classId)!
    this.draftedCards = this.playerState.draftedCards
    this.combatState  = new CombatState(ship, this.runData.classId)

    this.dispatcher = new EventDispatcher()
    this.evaluator  = new TriggerEvaluator()
    this.executor   = new ActionExecutor()

    const eventTypes: Array<Parameters<EventDispatcher['on']>[0]> =
      ['ON_HIT', 'ON_CRIT', 'ON_KILL', 'ON_SHIELD_DROP', 'ON_OVERHEAT']

    for (const type of eventTypes) {
      this.dispatcher.on(type, event => {
        const fired = this.evaluator.evaluate(
          event, this.draftedCards, this.combatState, performance.now()
        )
        for (const trigger of fired) {
          const result = this.executor.execute(trigger, this.combatState)
          if (result.applied) this.logTrigger(trigger.cardName, event.type)
        }
        if (event.type === 'ON_KILL') {
          this.killCount++
          this.updateKillCounter()
          if (this.killCount % KILLS_PER_LEVEL === 0 && !this.drafting) {
            this.triggerDraft()
          }
        }
      })
    }

    this.simulator = new CombatSimulator(this, this.combatState, this.dispatcher)
    this.simulator.start()
  }

  private triggerDraft(): void {
    this.drafting = true
    this.level++
    const offer = this.mgr.getDraftOffer(this.playerState, 4)
    this.scene.launch('DraftScene', {
      cards:       offer,
      rerollsFn:   () => this.mgr.getDraftOffer(this.playerState, 4),
      onPick:      (card: UpgradeCard) => this.applyDraftedCard(card),
      onSkip:      () => { this.drafting = false },
      rerollsLeft: 2,
      level:       this.level,
      classId:     this.runData.classId,
    })
    this.scene.pause('PhysicsScene')
  }

  private applyDraftedCard(card: UpgradeCard): void {
    this.playerState  = this.mgr.applyUpgrade(this.playerState, card)
    this.draftedCards = this.playerState.draftedCards
    for (const mod of card.statModifiers) {
      if (mod.stat === 'HULL' && mod.type === 'flat') {
        this.combatState.maxHull += mod.value
        this.combatState.restoreHull(mod.value)
      } else if (mod.stat === 'SHIELD_MAX' && mod.type === 'flat') {
        this.combatState.maxShield += mod.value
        this.combatState.restoreShield(mod.value)
      } else if (mod.stat === 'SHIELD_MAX' && mod.type === 'percent' && mod.value === -100) {
        this.combatState.maxShield = 0
        this.combatState.currentShield = 0
      }
    }
    this.updateModulesDisplay()
    this.logTrigger(`Drafted: ${card.name}`, 'UPGRADE')
    this.drafting = false
  }

  // ─── Grid (virtual, screen-space) ────────────────────────────────────────

  private updateGrid(): void {
    const cam     = this.cameras.main
    const offsetX = cam.scrollX % GRID_SZ
    const offsetY = cam.scrollY % GRID_SZ

    this.gridGfx.clear()
    this.gridGfx.lineStyle(1, 0x003366, 0.3)

    for (let x = -offsetX; x <= VIEW_W; x += GRID_SZ) {
      this.gridGfx.lineBetween(x, 0, x, VIEW_H)
    }
    for (let y = -offsetY; y <= VIEW_H; y += GRID_SZ) {
      this.gridGfx.lineBetween(0, y, VIEW_W, y)
    }
  }

  // ─── Minimap ─────────────────────────────────────────────────────────────

  private updateMinimap(clsColor: number): void {
    const g   = this.minimapGfx
    const cam = this.cameras.main
    g.clear()

    // Background
    g.fillStyle(0x000000, 0.75)
    g.fillRect(MM_X, MM_Y, MM_W, MM_H)

    // Faint world grid on minimap (5 cells each axis)
    g.lineStyle(1, 0x111f2a, 1)
    for (let i = 1; i < 5; i++) {
      const mx = MM_X + (i / 5) * MM_W
      const my = MM_Y + (i / 5) * MM_H
      g.lineBetween(mx, MM_Y, mx, MM_Y + MM_H)
      g.lineBetween(MM_X, my, MM_X + MM_W, my)
    }

    // Camera viewport rectangle on minimap
    const vx = MM_X + (cam.scrollX / WORLD_W) * MM_W
    const vy = MM_Y + (cam.scrollY / WORLD_H) * MM_H
    const vw = (VIEW_W / WORLD_W) * MM_W
    const vh = (VIEW_H / WORLD_H) * MM_H
    g.lineStyle(1, 0x224433, 0.6)
    g.strokeRect(vx, vy, vw, vh)

    // Player dot
    const px = MM_X + (this.actor.body.x / WORLD_W) * MM_W
    const py = MM_Y + (this.actor.body.y / WORLD_H) * MM_H
    g.fillStyle(clsColor, 1)
    g.fillCircle(px, py, 3)
    g.lineStyle(1, clsColor, 0.4)
    g.strokeCircle(px, py, 5)

    // Border + label
    g.lineStyle(1, 0x224433, 0.8)
    g.strokeRect(MM_X, MM_Y, MM_W, MM_H)
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  private buildHUD(): void {
    const ship = DataLoader.getShip(this.runData.shipId)!
    const cls  = DataLoader.getClass(this.runData.classId)!
    const geo  = getGeometry(this.runData.shipId)
    const clsColor = CLASS_COLORS[this.runData.classId] ?? 0x00ffff
    const shipHex  = geo  ? `#${geo.color.toString(16).padStart(6, '0')}` : '#ffffff'
    const clsHex   = `#${clsColor.toString(16).padStart(6, '0')}`

    const add = (obj: Phaser.GameObjects.GameObject) =>
      (obj as any).setScrollFactor(0).setDepth(50)

    // Pilot / ship / class
    add(this.add.text(14, 14, this.runData.pilot, {
      fontSize: '13px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }))
    add(this.add.text(14, 30, ship.name.replace(' Frame', '').toUpperCase(), {
      fontSize: '11px', color: shipHex, fontFamily: 'monospace',
    }))
    add(this.add.text(14, 46, cls.name, {
      fontSize: '11px', color: clsHex, fontFamily: 'monospace',
    }))

    // Bars
    const barLabel = (txt: string, y: number) =>
      add(this.add.text(14, y, txt, { fontSize: '9px', color: '#224433', fontFamily: 'monospace' }))
    barLabel('HULL',   72)
    barLabel('SHIELD', 92)
    barLabel('HEAT',   112)

    this.hullBar   = this.add.graphics(); add(this.hullBar)
    this.shieldBar = this.add.graphics(); add(this.shieldBar)
    this.heatBar   = this.add.graphics(); add(this.heatBar)

    this.hullText   = this.add.text(220, 70,  '', { fontSize: '9px', color: '#336644', fontFamily: 'monospace' }); add(this.hullText)
    this.shieldText = this.add.text(220, 90,  '', { fontSize: '9px', color: '#334466', fontFamily: 'monospace' }); add(this.shieldText)
    this.heatText   = this.add.text(220, 110, '', { fontSize: '9px', color: '#664433', fontFamily: 'monospace' }); add(this.heatText)

    this.effectText = this.add.text(14, 134, '', { fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace' }); add(this.effectText)

    // Trigger log
    add(this.add.text(14, VIEW_H - LOG_MAX * 18 - 30, 'TRIGGER LOG', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 3,
    }))
    for (let i = 0; i < LOG_MAX; i++) {
      const t = this.add.text(14, VIEW_H - (LOG_MAX - i) * 18 - 10, '', {
        fontSize: '10px', color: '#335544', fontFamily: 'monospace',
      })
      add(t)
      this.logEntries.push(t)
    }

    // Top-right: level + kills (above minimap)
    this.levelText = this.add.text(VIEW_W - 14, 14, 'LV 1', {
      fontSize: '13px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0); add(this.levelText)

    this.killCounterText = this.add.text(VIEW_W - 14, 32, `KILLS  0 / ${KILLS_PER_LEVEL}`, {
      fontSize: '10px', color: '#335544', fontFamily: 'monospace',
    }).setOrigin(1, 0); add(this.killCounterText)

    // Minimap label
    add(this.add.text(MM_X, MM_Y - 14, 'SECTOR MAP', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 3,
    }))

    // Active modules (below minimap)
    add(this.add.text(MM_X, MM_Y + MM_H + 10, 'ACTIVE MODULES', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 3,
    }))

    this.modulesContainer = this.add.container(VIEW_W, MM_Y + MM_H + 26)
    add(this.modulesContainer)
    this.updateModulesDisplay()
  }

  private updateHUD(): void {
    const cs    = this.combatState
    const BAR_X = 46, BAR_W = 170, BAR_H = 8

    const drawBar = (gfx: Phaser.GameObjects.Graphics, y: number, ratio: number, color: number) => {
      gfx.clear()
      gfx.fillStyle(0x111111, 0.8)
      gfx.fillRect(BAR_X, y, BAR_W, BAR_H)
      gfx.fillStyle(color, 1)
      gfx.fillRect(BAR_X, y, BAR_W * Math.max(0, Math.min(1, ratio)), BAR_H)
      gfx.lineStyle(1, color, 0.3)
      gfx.strokeRect(BAR_X, y, BAR_W, BAR_H)
    }

    drawBar(this.hullBar,   72,  cs.currentHull   / cs.maxHull,   0x00cc44)
    drawBar(this.shieldBar, 92,  cs.currentShield / cs.maxShield,  0x4488ff)
    drawBar(this.heatBar,   112, cs.currentHeat   / cs.maxHeat,    cs.isOverheated ? 0xff2200 : 0xff8800)

    this.hullText.setText(`${Math.round(cs.currentHull)} / ${cs.maxHull}`)
    this.shieldText.setText(`${Math.round(cs.currentShield)} / ${cs.maxShield}`)
    this.heatText.setText(`${Math.round(cs.currentHeat)}%${cs.isOverheated ? ' OVERHEAT' : ''}`)

    const effects = cs.activeEffects.map(e =>
      `${e.type.replace('_', ' ')} ${(e.remainingMs / 1000).toFixed(1)}s`
    )
    this.effectText.setText(effects.join('  '))
  }

  private updateKillCounter(): void {
    const progress = this.killCount % KILLS_PER_LEVEL
    this.killCounterText?.setText(`KILLS  ${progress} / ${KILLS_PER_LEVEL}`)
    this.levelText?.setText(`LV ${this.level}`)
  }

  private updateModulesDisplay(): void {
    if (!this.modulesContainer) return
    this.modulesContainer.removeAll(true)
    const cards = this.playerState?.draftedCards ?? []
    if (cards.length === 0) {
      const t = this.add.text(-14, 0, 'none drafted yet', {
        fontSize: '9px', color: '#223333', fontFamily: 'monospace',
      }).setOrigin(1, 0)
      this.modulesContainer.add(t)
      return
    }
    cards.forEach((card, i) => {
      const t = this.add.text(-14, i * 16, `[T${card.tier}] ${card.name}`, {
        fontSize: '9px', color: '#335544', fontFamily: 'monospace',
      }).setOrigin(1, 0)
      this.modulesContainer.add(t)
    })
  }

  private logBuffer: string[] = []

  private logTrigger(cardName: string, eventType: string): void {
    const ts  = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    this.logBuffer.unshift(`${ts}  ${eventType}  →  ${cardName}`)
    if (this.logBuffer.length > LOG_MAX) this.logBuffer.pop()

    this.logEntries.forEach((t, i) => {
      t.setText(this.logBuffer[i] ?? '')
      t.setColor(i === 0 ? '#00ff88' : '#335544')
    })

    this.flashShip()
  }

  private flashShip(): void {
    const clsColor = CLASS_COLORS[this.runData.classId] ?? 0x00ffff
    this.flashGfx.clear()
    this.flashGfx.fillStyle(clsColor, 0.25)
    this.flashGfx.fillCircle(this.actor.body.x, this.actor.body.y, 60)
    this.tweens.add({
      targets: this.flashGfx,
      alpha: { from: 1, to: 0 },
      duration: 400,
      onComplete: () => { this.flashGfx.setAlpha(1); this.flashGfx.clear() },
    })
  }
}

// ─── Rendering ───────────────────────────────────────────────────────────────

function drawNeonShip(
  gfx: Phaser.GameObjects.Graphics,
  body: PhysicsBody,
  geo: ShipGeometry,
  color: number,
  alpha = 1
): void {
  const cos = Math.cos(body.heading)
  const sin = Math.sin(body.heading)
  const s   = geo.scale

  const rot = (x: number, y: number): Phaser.Types.Math.Vector2Like => ({
    x: body.x + (x * cos - y * sin) * s,
    y: body.y + (x * sin + y * cos) * s,
  })

  const pts = geo.outline.map(([x, y]) => rot(x, y))

  gfx.lineStyle(10, color, 0.04 * alpha); gfx.strokePoints(pts, true)
  gfx.lineStyle(5,  color, 0.15 * alpha); gfx.strokePoints(pts, true)
  gfx.lineStyle(2.5,color, 0.55 * alpha); gfx.strokePoints(pts, true)
  gfx.lineStyle(1.5,color, 1.0  * alpha); gfx.strokePoints(pts, true)

  for (const [x1, y1, x2, y2] of geo.details) {
    const p1 = rot(x1, y1); const p2 = rot(x2, y2)
    gfx.lineStyle(1, color, 0.45 * alpha)
    gfx.lineBetween(p1.x, p1.y, p2.x, p2.y)
  }
}

function remap(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + ((v - inMin) / (inMax - inMin)) * (outMax - outMin)
}
