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

const KILLS_PER_LEVEL = 3
const LOG_MAX = 6

export class PhysicsScene extends Phaser.Scene {
  private actor!:    ShipActor
  private gridGfx!:  Phaser.GameObjects.Graphics
  private flashGfx!: Phaser.GameObjects.Graphics
  private cx = 0
  private cy = 0
  private runData!: RunData

  // Combat systems
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
  private killCounterText!: Phaser.GameObjects.Text
  private levelText!:       Phaser.GameObjects.Text
  private modulesContainer!: Phaser.GameObjects.Container

  // HUD elements
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
    const { width, height } = this.cameras.main
    this.cx = width / 2
    this.cy = height / 2

    this.gridGfx  = this.add.graphics()
    this.flashGfx = this.add.graphics()
    this.drawGrid()

    this.buildActor()
    this.buildCombatSystems()
    this.buildHUD()
  }

  update(_t: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05)

    // Physics
    this.actor.orbitAngle += this.actor.orbitSpeed * dt
    const { fx, fy } = orbit(
      this.actor.body, this.cx, this.cy,
      this.actor.orbitRadius, this.actor.orbitAngle
    )
    stepPhysics(this.actor.body, fx, fy, dt)
    wrapBounds(this.actor.body, this.cameras.main.width, this.cameras.main.height)

    // Combat tick (shield regen etc.)
    const ship = DataLoader.getShip(this.runData.shipId)!
    const shieldRegenPerMs = ship.baseStats.SHIELD_REGEN / 1000
    this.combatState.tick(delta, shieldRegenPerMs)

    // Redraw ship
    this.actor.gfx.clear()
    const clsColor = CLASS_COLORS[this.runData.classId] ?? 0x00ffff
    const phaseAlpha = this.combatState.isPhased ? 0.3 : 1
    drawNeonShip(this.actor.gfx, this.actor.body, this.actor.geometry, clsColor, phaseAlpha)

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
      this.cx + Math.sin(0) * orbitRadius,
      this.cy - Math.cos(0) * orbitRadius,
      maxSpeed, accel, mass, drag
    )

    this.actor = {
      geometry: geo, body,
      gfx: this.add.graphics(),
      orbitAngle: 0, orbitRadius, orbitSpeed: 0.9,
    }
  }

  private buildCombatSystems(): void {
    const ship = DataLoader.getShip(this.runData.shipId)!

    // Build player state (tag aggregator, computed stats)
    this.playerState  = this.mgr.build(this.runData.shipId, this.runData.classId)!
    this.draftedCards = this.playerState.draftedCards

    // Combat state from ship base stats
    this.combatState = new CombatState(ship, this.runData.classId)

    // Systems
    this.dispatcher = new EventDispatcher()
    this.evaluator  = new TriggerEvaluator()
    this.executor   = new ActionExecutor()

    // Wire dispatcher → evaluator → executor → log
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

        // Kill → progression
        if (event.type === 'ON_KILL') {
          this.killCount++
          this.updateKillCounter()
          if (this.killCount % KILLS_PER_LEVEL === 0 && !this.drafting) {
            this.triggerDraft()
          }
        }
      })
    }

    // Simulator
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
    // Update player state (tags, computed stats)
    this.playerState  = this.mgr.applyUpgrade(this.playerState, card)
    this.draftedCards = this.playerState.draftedCards

    // Apply stat modifiers to live combat state
    for (const mod of card.statModifiers) {
      if (mod.stat === 'HULL' && mod.type === 'flat') {
        this.combatState.maxHull += mod.value
        this.combatState.restoreHull(mod.value)
      } else if (mod.stat === 'SHIELD_MAX' && mod.type === 'flat') {
        this.combatState.maxShield += mod.value
        this.combatState.restoreShield(mod.value)
      } else if (mod.stat === 'SHIELD_MAX' && mod.type === 'percent' && mod.value === -100) {
        // Zero-Shield Fortress converter
        this.combatState.maxShield = 0
        this.combatState.currentShield = 0
      }
    }

    this.updateModulesDisplay()
    this.logTrigger(`Drafted: ${card.name}`, 'UPGRADE')
    this.drafting = false
  }

  // ─── HUD ─────────────────────────────────────────────────────────────────

  private buildHUD(): void {
    const ship = DataLoader.getShip(this.runData.shipId)!
    const cls  = DataLoader.getClass(this.runData.classId)!
    const geo  = getGeometry(this.runData.shipId)
    const clsColor  = CLASS_COLORS[this.runData.classId] ?? 0x00ffff
    const shipHex   = geo  ? `#${geo.color.toString(16).padStart(6, '0')}` : '#ffffff'
    const clsHex    = `#${clsColor.toString(16).padStart(6, '0')}`

    // Pilot / ship / class info
    this.add.text(14, 14, this.runData.pilot, {
      fontSize: '13px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    })
    this.add.text(14, 30, ship.name.replace(' Frame', '').toUpperCase(), {
      fontSize: '11px', color: shipHex, fontFamily: 'monospace',
    })
    this.add.text(14, 46, cls.name, {
      fontSize: '11px', color: clsHex, fontFamily: 'monospace',
    })

    // Bar labels
    const barLabelStyle = { fontSize: '9px', color: '#224433', fontFamily: 'monospace' }
    this.add.text(14, 72, 'HULL', barLabelStyle)
    this.add.text(14, 92, 'SHIELD', barLabelStyle)
    this.add.text(14, 112, 'HEAT', barLabelStyle)

    // Bar graphics
    this.hullBar   = this.add.graphics()
    this.shieldBar = this.add.graphics()
    this.heatBar   = this.add.graphics()

    // Bar value texts
    this.hullText   = this.add.text(220, 70, '', { fontSize: '9px', color: '#336644', fontFamily: 'monospace' })
    this.shieldText = this.add.text(220, 90, '', { fontSize: '9px', color: '#334466', fontFamily: 'monospace' })
    this.heatText   = this.add.text(220, 110, '', { fontSize: '9px', color: '#664433', fontFamily: 'monospace' })

    // Active effects
    this.effectText = this.add.text(14, 134, '', {
      fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace',
    })

    // Trigger log (bottom-left)
    const { height } = this.cameras.main
    this.add.text(14, height - LOG_MAX * 18 - 30, 'TRIGGER LOG', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 3,
    })
    for (let i = 0; i < LOG_MAX; i++) {
      this.logEntries.push(this.add.text(14, height - (LOG_MAX - i) * 18 - 10, '', {
        fontSize: '10px', color: '#335544', fontFamily: 'monospace',
      }))
    }

    // Kill counter + level (top-right)
    const { width } = this.cameras.main
    this.levelText = this.add.text(width - 14, 14, 'LV 1', {
      fontSize: '13px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0)

    this.killCounterText = this.add.text(width - 14, 32, `KILLS  0 / ${KILLS_PER_LEVEL}`, {
      fontSize: '10px', color: '#335544', fontFamily: 'monospace',
    }).setOrigin(1, 0)

    this.add.text(width - 14, 56, 'ACTIVE MODULES', {
      fontSize: '9px', color: '#224433', fontFamily: 'monospace', letterSpacing: 3,
    }).setOrigin(1, 0)

    this.modulesContainer = this.add.container(width, 72)
    this.updateModulesDisplay()
  }

  private updateHUD(): void {
    const cs  = this.combatState
    const BAR_X = 46
    const BAR_W = 170
    const BAR_H = 8

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

    // Active effects
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

  private logTrigger(cardName: string, eventType: string | 'UPGRADE'): void {
    const ts  = new Date().toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const msg = `${ts}  ${eventType}  →  ${cardName}`
    this.logBuffer.unshift(msg)
    if (this.logBuffer.length > LOG_MAX) this.logBuffer.pop()

    this.logEntries.forEach((t, i) => {
      t.setText(this.logBuffer[i] ?? '')
      t.setColor(i === 0 ? '#00ff88' : '#335544')
    })

    // Brief flash on ship
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

  // ─── Grid ────────────────────────────────────────────────────────────────

  private drawGrid(): void {
    const { width, height } = this.cameras.main
    this.gridGfx.lineStyle(1, 0x003366, 0.3)
    for (let x = 0; x <= width;  x += 60) this.gridGfx.lineBetween(x, 0, x, height)
    for (let y = 0; y <= height; y += 60) this.gridGfx.lineBetween(0, y, width, y)
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
