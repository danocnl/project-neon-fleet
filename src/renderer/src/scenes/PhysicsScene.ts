import Phaser from 'phaser'
import { getGeometry, type ShipGeometry } from '../ships/ShipGeometry'
import { createBody, stepPhysics, wrapBounds, type PhysicsBody } from '../physics/PhysicsBody'
import { chase } from '../physics/NavBehaviors'
import { DataLoader } from '../systems/DataLoader'
import { LoadoutManager } from '../systems/LoadoutManager'
import type { PlayerState } from '../systems/LoadoutManager'
import { CLASS_COLORS } from '../ships/ClassIcons'
import { CombatState } from '../combat/CombatState'
import { EventDispatcher } from '../combat/EventDispatcher'
import { TriggerEvaluator } from '../combat/TriggerEvaluator'
import { ActionExecutor } from '../combat/ActionExecutor'
import { CombatSimulator } from '../combat/CombatSimulator'
import { EnemyManager } from '../combat/EnemyManager'
import { ProjectileSystem } from '../combat/ProjectileSystem'
import type { UpgradeCard } from '../types'

// ─── World & layout constants ─────────────────────────────────────────────────
const VIEW_W   = 1280
const VIEW_H   = 720
const WORLD_W  = VIEW_W * 5   // 6400
const WORLD_H  = VIEW_H * 5   // 3600
const GRID_SZ  = 60

const KILLS_PER_LEVEL = 3
const LOG_MAX = 6

const DEFAULT_LOADOUTS: Record<string, { weapons: string[]; modules: string[] }> = {
  sidewinder: { weapons: ['light_chaingun', 'light_chaingun'], modules: ['thruster_pack_s', 'shield_booster_s', 'cooling_fin_s'] },
  cobra:      { weapons: ['pulse_laser', 'chaingun'],          modules: ['shield_capacitor_m', 'shield_booster_s', 'power_cell_s'] },
  mamba:      { weapons: ['light_chaingun', 'light_chaingun'], modules: ['cryo_module_m', 'cooling_fin_s', 'thruster_pack_s'] },
}

// Minimap (screen-space, top-right)
const MM_X = 1042
const MM_Y = 60
const MM_W = 228
const MM_H = 128

interface RunData { pilot: string; shipId: string; classId: string }

interface ShipActor {
  geometry:  ShipGeometry
  body:      PhysicsBody
  gfx:       Phaser.GameObjects.Graphics
  waypoint:  { x: number; y: number }
  arrivalR:  number   // distance at which a new waypoint is chosen
}

export class PhysicsScene extends Phaser.Scene {
  private actor!:    ShipActor
  private gridGfx!:  Phaser.GameObjects.Graphics   // screen-space virtual grid
  private flashGfx!: Phaser.GameObjects.Graphics   // world-space flash
  private minimapGfx!: Phaser.GameObjects.Graphics // screen-space minimap

  // World centre — spawn and first waypoint reference
  private readonly wx = WORLD_W / 2
  private readonly wy = WORLD_H / 2

  private runData!: RunData

  // Combat
  private combatState!:    CombatState
  private dispatcher!:     EventDispatcher
  private evaluator!:      TriggerEvaluator
  private executor!:       ActionExecutor
  private simulator!:      CombatSimulator
  private enemies!:        EnemyManager
  private projectiles!:    ProjectileSystem
  private playerState!:    PlayerState
  private draftedCards:    UpgradeCard[] = []
  private readonly mgr = new LoadoutManager()

  // Progression
  private killCount       = 0
  private level           = 1
  private drafting        = false
  private pendingUpgrades = 0
  private runCredits      = 0
  private upgradeBtnGfx!: Phaser.GameObjects.Graphics
  private upgradeBtnText!: Phaser.GameObjects.Text
  private upgradeBtnZone!: Phaser.GameObjects.Zone
  private upgradePulse    = 0   // phase for sine pulse
  private killCounterText!:  Phaser.GameObjects.Text
  private levelText!:        Phaser.GameObjects.Text
  private modulesContainer!: Phaser.GameObjects.Container

  // HUD bars
  private hullBar!:    Phaser.GameObjects.Graphics
  private shieldBar!:  Phaser.GameObjects.Graphics
  private heatBar!:    Phaser.GameObjects.Graphics
  private energyBar!:  Phaser.GameObjects.Graphics
  private effectText!: Phaser.GameObjects.Text
  private speedText!:  Phaser.GameObjects.Text
  private logEntries:  Phaser.GameObjects.Text[] = []
  private hullText!:   Phaser.GameObjects.Text
  private shieldText!: Phaser.GameObjects.Text
  private heatText!:   Phaser.GameObjects.Text
  private energyText!: Phaser.GameObjects.Text

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
    this.buildEnemies()
    this.buildHUD()
  }

  update(_t: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05)

    // Waypoint navigation — pick a new target when ship arrives
    const dx = this.actor.waypoint.x - this.actor.body.x
    const dy = this.actor.waypoint.y - this.actor.body.y
    if (Math.hypot(dx, dy) < this.actor.arrivalR) {
      this.actor.waypoint = this.nextWaypoint()
    }

    const { fx, fy } = chase(this.actor.body, this.actor.waypoint.x, this.actor.waypoint.y)
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

    // Enemy update
    const loadout = DEFAULT_LOADOUTS[this.runData.shipId] ?? { weapons: [], modules: [] }
    this.enemies.update(
      dt,
      this.actor.body.x, this.actor.body.y,
      this.actor.body.heading,
      loadout.weapons,
      (damage) => this.combatState.takeDamage(damage),
      (result) => {
        this.runCredits += result.credits
        this.dispatcher.emit({ type: 'ON_KILL', sourceId: this.runData.shipId, value: 1, timestamp: performance.now() })
      }
    )

    // Projectiles
    const tgt = this.enemies.currentTarget
    this.projectiles.update(
      dt,
      this.actor.body.x, this.actor.body.y, this.actor.body.heading,
      tgt?.x ?? 0, tgt?.y ?? 0,
      tgt !== null
    )
    this.projectiles.draw()

    this.updateGrid()
    this.updateMinimap(clsColor)
    this.updateHUD()
    this.pulseUpgradeButton(dt)
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

    // Start near world centre
    const body = createBody(
      this.wx + Phaser.Math.Between(-300, 300),
      this.wy + Phaser.Math.Between(-300, 300),
      maxSpeed, accel, mass, drag
    )

    this.actor = {
      geometry: geo,
      body,
      gfx: this.add.graphics().setDepth(5),
      waypoint:  this.randomWaypointFrom(this.wx, this.wy),
      arrivalR:  120,
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

    // Simulator still fires hits/heat for ambient combat feel — kill events now come from EnemyManager
    this.simulator = new CombatSimulator(this, this.combatState, this.dispatcher)
    this.simulator.start()
  }

  private buildEnemies(): void {
    this.enemies = new EnemyManager()
    this.enemies.init(this)
    this.enemies.spawnInitial()

    const loadout = DEFAULT_LOADOUTS[this.runData.shipId] ?? { weapons: [], modules: [] }
    this.projectiles = new ProjectileSystem()
    this.projectiles.init(this, loadout.weapons)
  }

  private triggerDraft(): void {
    // Don't pause — queue the upgrade and let the player claim it when ready
    this.level++
    this.pendingUpgrades++
    this.updateUpgradeButton()
  }

  private claimUpgrade(): void {
    if (this.drafting || this.pendingUpgrades <= 0) return
    this.drafting = true

    const offer = this.mgr.getDraftOffer(this.playerState, 4)
    this.scene.launch('DraftScene', {
      cards:       offer,
      rerollsFn:   () => this.mgr.getDraftOffer(this.playerState, 4),
      onPick:      (card: UpgradeCard) => {
        this.applyDraftedCard(card)
        this.pendingUpgrades = Math.max(0, this.pendingUpgrades - 1)
        this.drafting = false
        this.updateUpgradeButton()
      },
      onSkip:      () => {
        this.pendingUpgrades = Math.max(0, this.pendingUpgrades - 1)
        this.drafting = false
        this.updateUpgradeButton()
      },
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

  // ─── Waypoint helpers ────────────────────────────────────────────────────

  private nextWaypoint(): { x: number; y: number } {
    return this.randomWaypointFrom(this.actor.body.x, this.actor.body.y)
  }

  private randomWaypointFrom(fromX: number, fromY: number): { x: number; y: number } {
    // Pick a point 500–1400 px away in a random direction, wrapping at world edges
    const angle = Math.random() * Math.PI * 2
    const dist  = Phaser.Math.Between(500, 1400)
    const x = ((fromX + Math.cos(angle) * dist) % WORLD_W + WORLD_W) % WORLD_W
    const y = ((fromY + Math.sin(angle) * dist) % WORLD_H + WORLD_H) % WORLD_H
    return { x, y }
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

    // Enemy dots
    for (const e of this.enemies.getEntities()) {
      const ex = MM_X + (e.x / WORLD_W) * MM_W
      const ey = MM_Y + (e.y / WORLD_H) * MM_H
      const col = e.def.id.startsWith('asteroid') ? 0x667788 : 0xff3322
      g.fillStyle(col, 0.7)
      g.fillCircle(ex, ey, e.def.id.startsWith('asteroid') ? 1.5 : 2)
    }

    // Player dot (drawn on top of enemies)
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
    barLabel('ENERGY', 132)

    this.hullBar   = this.add.graphics(); add(this.hullBar)
    this.shieldBar = this.add.graphics(); add(this.shieldBar)
    this.heatBar   = this.add.graphics(); add(this.heatBar)
    this.energyBar = this.add.graphics(); add(this.energyBar)

    this.hullText   = this.add.text(220, 70,  '', { fontSize: '9px', color: '#336644', fontFamily: 'monospace' }); add(this.hullText)
    this.shieldText = this.add.text(220, 90,  '', { fontSize: '9px', color: '#334466', fontFamily: 'monospace' }); add(this.shieldText)
    this.heatText   = this.add.text(220, 110, '', { fontSize: '9px', color: '#664433', fontFamily: 'monospace' }); add(this.heatText)
    this.energyText = this.add.text(220, 130, '', { fontSize: '9px', color: '#445533', fontFamily: 'monospace' }); add(this.energyText)

    this.effectText = this.add.text(14, 154, '', { fontSize: '10px', color: '#ffcc00', fontFamily: 'monospace' }); add(this.effectText)

    this.speedText = this.add.text(14, 172, '', { fontSize: '10px', color: '#224433', fontFamily: 'monospace' }); add(this.speedText)

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

    // Upgrade ready button — visible only when pendingUpgrades > 0
    const BW = 210, BH = 32
    const BX = VIEW_W / 2 - BW / 2
    const BY = VIEW_H - 54
    this.upgradeBtnGfx  = this.add.graphics().setScrollFactor(0).setDepth(50)
    this.upgradeBtnText = this.add.text(VIEW_W / 2, BY + BH / 2, '', {
      fontSize: '12px', color: '#00ffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setVisible(false)
    this.upgradeBtnZone = this.add.zone(BX, BY, BW, BH).setOrigin(0, 0).setScrollFactor(0).setDepth(52)
    this.upgradeBtnZone.setInteractive()
    this.upgradeBtnZone.on('pointerdown', () => this.claimUpgrade())
    this.upgradeBtnZone.disableInteractive()


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

    drawBar(this.hullBar,   72,  cs.currentHull   / cs.maxHull,    0x00cc44)
    drawBar(this.shieldBar, 92,  cs.currentShield / cs.maxShield,   0x4488ff)
    drawBar(this.heatBar,   112, cs.currentHeat   / cs.maxHeat,     cs.isOverheated ? 0xff2200 : 0xff8800)
    drawBar(this.energyBar, 132, cs.energyRatio,                    0x88ff44)

    this.hullText.setText(`${Math.round(cs.currentHull)} / ${cs.maxHull}`)
    this.shieldText.setText(`${Math.round(cs.currentShield)} / ${cs.maxShield}`)
    this.heatText.setText(`${Math.round(cs.currentHeat)} / ${cs.maxHeat}${cs.isOverheated ? ' OVERHEAT' : ''}`)
    this.energyText.setText(`${Math.round(cs.currentEnergy)} / ${cs.maxEnergy}`)

    const currentSpeed = Math.round(Math.hypot(this.actor.body.vx, this.actor.body.vy))
    const maxSpeed     = DataLoader.getShip(this.runData.shipId)?.baseStats.TOP_SPEED ?? 0
    this.speedText.setText(`SPD  ${currentSpeed} / ${maxSpeed} u/s`)

    const effects = cs.activeEffects.map(e =>
      `${e.type.replace('_', ' ')} ${(e.remainingMs / 1000).toFixed(1)}s`
    )
    this.effectText.setText(effects.join('  '))
  }

  private pulseUpgradeButton(dt: number): void {
    if (this.pendingUpgrades <= 0) return
    this.upgradePulse += dt * 3.5
    const a = 0.35 + 0.3 * Math.sin(this.upgradePulse)  // oscillates 0.05–0.65

    const BW = 210, BH = 32
    const BX = VIEW_W / 2 - BW / 2
    const BY = VIEW_H - 54

    const g = this.upgradeBtnGfx
    g.clear()
    g.lineStyle(1.5, 0x00ffff, a)
    g.strokeRect(BX, BY, BW, BH)
    g.fillStyle(0x00ffff, a * 0.25)
    g.fillRect(BX, BY, BW, BH)
  }

  private updateUpgradeButton(): void {
    const visible = this.pendingUpgrades > 0
    this.upgradeBtnText.setVisible(visible)
    if (visible) {
      this.upgradeBtnZone.setInteractive()
      const label = this.pendingUpgrades === 1
        ? '▸ UPGRADE READY'
        : `▸ ${this.pendingUpgrades} UPGRADES READY`
      this.upgradeBtnText.setText(label)
    } else {
      this.upgradeBtnZone.disableInteractive()
      this.upgradeBtnGfx.clear()
    }
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
