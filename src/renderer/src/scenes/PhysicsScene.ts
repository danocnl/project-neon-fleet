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
import { SaveManager } from '../systems/SaveManager'
import { SectorManager } from '../systems/SectorManager'
import { network } from '../systems/NetworkManager'
import type { RemoteShipState, RemoteEnemyState, GameStateSnapshot } from '../systems/NetworkManager'
import type { UpgradeCard, FlightMode } from '../types'

// ─── World & layout constants ─────────────────────────────────────────────────
const VIEW_W   = 1280
const VIEW_H   = 720
const WORLD_W  = VIEW_W * 5   // 6400
const WORLD_H  = VIEW_H * 5   // 3600
const GRID_SZ  = 60

// ─── Remote enemy shape helpers (mirrors EnemyEntity logic for guest rendering) ──
function remoteEnemyRadius(defId: string): number {
  const map: Record<string, number> = {
    asteroid_xl: 68, asteroid_large: 44, asteroid_medium: 24, asteroid_small: 11,
    scout_drone: 12, attack_drone: 18, turret: 22,
  }
  return map[defId] ?? 14
}

function remoteEnemyShape(defId: string, instanceId: string): [number, number][] {
  if (defId === 'scout_drone')  return [[0,-12],[5,8],[0,4],[-5,8]]
  if (defId === 'attack_drone') return [[0,-18],[12,4],[8,14],[0,10],[-8,14],[-12,4]]
  if (defId === 'turret')       return [[-14,-14],[14,-14],[14,14],[-14,14]]
  if (defId.startsWith('asteroid')) {
    const seed  = parseInt(instanceId.split('_').pop() ?? '1', 10)
    const sizeKey = defId.includes('_xl') ? 'XL' : defId.includes('large') ? 'L'
                  : defId.includes('medium') ? 'M' : 'S'
    const radii:  Record<string, number> = { XL: 68, L: 44, M: 24, S: 11 }
    const counts: Record<string, number> = { XL: 11, L: 9,  M: 7,  S: 6  }
    const r = radii[sizeKey] ?? 20, n = counts[sizeKey] ?? 7
    return Array.from({ length: n }, (_, i) => {
      const angle  = (i / n) * Math.PI * 2
      const jitter = 0.62 + ((seed * (i + 3) * 6271 + i * 1031) % 380) / 1000
      return [Math.cos(angle) * r * jitter, Math.sin(angle) * r * jitter] as [number, number]
    })
  }
  return [[0,-8],[8,8],[-8,8]]
}

// ─── Background types ─────────────────────────────────────────────────────────
interface Star       { nx: number; ny: number; size: number; parallax: number; alpha: number }
interface NebulaBlob { nx: number; ny: number; radius: number; phase: number; alpha: number }

const COPILOT_COLOR     = 0x9933ff   // purple used for the co-pilot ship on both sides
const COPILOT_COLOR_HEX = '#9933ff'

const KILLS_PER_LEVEL = 3
const LOG_MAX = 6
const MODULE_MAX_LEVEL = 20   // passiveBonuses in modules.json = the Lv20 target value

const DEFAULT_LOADOUTS: Record<string, { weapons: string[]; modules: string[] }> = {
  sidewinder: { weapons: ['pulse_laser', 'pulse_laser'],       modules: ['thruster_pack_s', 'shield_booster_s', 'cooling_fin_s'] },
  cobra:      { weapons: ['chaingun', 'chaingun'],             modules: ['shield_capacitor_m', 'shield_booster_s', 'power_cell_s'] },
  mamba:      { weapons: ['beam_laser'],                        modules: ['cryo_module_m', 'cooling_fin_s', 'thruster_pack_s'] },
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
  private bgGfx!:        Phaser.GameObjects.Graphics
  private gridGfx!:      Phaser.GameObjects.Graphics
  private flashGfx!:     Phaser.GameObjects.Graphics
  private damageFlashGfx!: Phaser.GameObjects.Graphics
  private minimapGfx!:   Phaser.GameObjects.Graphics
  private stars:       Star[]       = []
  private nebulaBlobs: NebulaBlob[] = []

  private shieldFlashTimer = 0   // 0–1, decays to 0
  private hullFlashTimer   = 0

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
  private projectiles2?:   ProjectileSystem   // actor2's visual projectiles (host only)
  private playerState!:    PlayerState
  private draftedCards:    UpgradeCard[] = []
  private readonly mgr = new LoadoutManager()

  // Sector progression
  private sector = new SectorManager()

  // Progression
  private killCount       = 0
  private level           = 1
  private drafting        = false
  private pendingUpgrades = 0
  private runCredits      = 0
  private isDead          = false
  private p1Dead          = false   // host ship dead
  private p2Dead          = false   // guest ship dead
  private spectating      = false
  private spectatorText?: Phaser.GameObjects.Text
  private godMode         = false
  private godModeText!:   Phaser.GameObjects.Text

  // ─── Class active ability ─────────────────────────────────────────────────
  private activeCooldownMs  = 0      // counts down to 0 (ready)
  private activeRemainingMs = 0      // duration of current active effect
  private activeCooldownMax = 0      // set from class
  private activeGfx!:       Phaser.GameObjects.Graphics
  private activeCooldownBar!: Phaser.GameObjects.Graphics
  private activeLabel!:     Phaser.GameObjects.Text
  private flightMode:     FlightMode = 'ASSAULT'
  private upgradeBtnGfx!: Phaser.GameObjects.Graphics
  private upgradeBtnText!: Phaser.GameObjects.Text
  private upgradeBtnZone!: Phaser.GameObjects.Zone
  private upgradePulse    = 0   // phase for sine pulse
  private killCounterText!:  Phaser.GameObjects.Text
  private levelText!:        Phaser.GameObjects.Text
  private sectorText!:       Phaser.GameObjects.Text
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

  // ─── Multiplayer ──────────────────────────────────────────────────────────
  private netRole:        'solo' | 'host' | 'guest' = 'solo'
  private actor2?:        ShipActor
  private combatState2?:  CombatState
  private actor2Waypoint:    { x: number; y: number } = { x: 0, y: 0 }
  private guestFlightMode:  FlightMode = 'ASSAULT'
  // SUPPORT orbit angles
  private supportOrbitAngle  = 0
  private actor2OrbitAngle   = 0
  // ASSAULT lock-on
  private lockedTargetId:       string | null = null
  private actor2LockedTargetId: string | null = null
  private assaultOrbitAngle  = 0
  private actor2AssaultAngle = 0
  // PATROL orbit angles
  private patrolOrbitAngle   = 0
  private actor2PatrolAngle  = 0
  // KITE angle
  private kiteAngle          = 0
  private netSendTimer  = 0
  private remoteEnemies:          RemoteEnemyState[] = []
  private remoteP1Projectiles:    import('../systems/NetworkManager').RemoteProjectile[] = []
  private remoteP2Projectiles:    import('../systems/NetworkManager').RemoteProjectile[] = []
  private remoteEnemyProjectiles: import('../systems/NetworkManager').RemoteProjectile[] = []
  private remoteP1?:     RemoteShipState
  private remoteGfx?:    Phaser.GameObjects.Graphics
  private p2HullBar?:    Phaser.GameObjects.Graphics
  private p2ShieldBar?:  Phaser.GameObjects.Graphics
  private p2NameText?:   Phaser.GameObjects.Text

  constructor() { super({ key: 'PhysicsScene' }) }

  init(data: RunData & { netRole?: string; guestPilot?: string; guestShipId?: string; guestClassId?: string }): void {
    this.runData = {
      pilot:   data?.pilot   ?? 'PILOT',
      shipId:  data?.shipId  ?? 'sidewinder',
      classId: data?.classId ?? 'chrono_architect',
    }
    this.netRole = (data?.netRole as 'host' | 'guest' | undefined) ?? 'solo'
    // Store guest info for host to use in create()
    if (this.netRole === 'host') {
      ;(this as any)._guestShipId  = data?.guestShipId  ?? 'sidewinder'
      ;(this as any)._guestClassId = data?.guestClassId ?? 'chrono_architect'
      ;(this as any)._guestPilot   = data?.guestPilot   ?? 'CO-PILOT'
    }
  }

  create(): void {
    // Background starfield + nebula — screen-space, depth -1
    this.bgGfx = this.add.graphics().setScrollFactor(0).setDepth(-1)
    this.buildBackground()

    // Virtual grid — screen-space, redrawn each frame
    this.gridGfx = this.add.graphics().setScrollFactor(0).setDepth(0)

    // World-space flash (follows camera naturally)
    this.flashGfx      = this.add.graphics().setDepth(10)
    this.damageFlashGfx = this.add.graphics().setDepth(9)

    // Minimap — screen-space overlay
    this.minimapGfx = this.add.graphics().setScrollFactor(0).setDepth(100)

    this.buildActor()
    this.buildCombatSystems()
    this.buildEnemies()
    this.buildHUD()

    if (this.netRole === 'host') this.setupHostNet()
    if (this.netRole === 'guest') this.setupGuestNet()
    if (this.netRole !== 'solo') this.buildP2HUD()
  }

  update(_t: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05)

    // In guest mode the host fully drives this ship — skip local physics.
    // actor.body is updated from snap.p2 in setupGuestNet's GAME_STATE handler.
    if (this.netRole !== 'guest') {
    // Always pursue: lock nearest drone/turret, asteroid fallback
    {
      const pursuitTarget = this.resolveHunterTarget(
        this.actor.body.x, this.actor.body.y,
        this.enemies.getEntities(),
        this.enemies.currentTarget,
        (id) => { this.lockedTargetId = id }
      )
      if (pursuitTarget) {
        this.actor.waypoint = {
          x: ((pursuitTarget.x % WORLD_W) + WORLD_W) % WORLD_W,
          y: ((pursuitTarget.y % WORLD_H) + WORLD_H) % WORLD_H,
        }
      } else {
        const dx = this.actor.waypoint.x - this.actor.body.x
        const dy = this.actor.waypoint.y - this.actor.body.y
        if (Math.hypot(dx, dy) < this.actor.arrivalR) {
          this.actor.waypoint = this.randomWaypointFrom(this.actor.body.x, this.actor.body.y)
        }
      }
    }

    // Use shortest wrapped path so the ship crosses edges rather than going "the long way round"
    const wp = this.wrappedWaypoint()
    const rawF   = chase(this.actor.body, wp.x, wp.y)
    const avoid  = this.asteroidAvoidanceForce()

    // Throttle thrust when a weapon target is close — ship slows to keep target in arc
    const tgt     = this.enemies.currentTarget
    const tgtDist = tgt ? Math.hypot(tgt.x - this.actor.body.x, tgt.y - this.actor.body.y) : Infinity
    const inRange = tgt !== null && tgtDist <= 350

    // Active braking when in range: reverse-thrust proportional to current velocity
    // so the ship dumps speed fast rather than coasting through the target
    const bx = this.actor.body, spd = Math.hypot(bx.vx, bx.vy)
    const brakeX = inRange && spd > 6 ? -(bx.vx / spd) * bx.accel * 4.0 : 0
    const brakeY = inRange && spd > 6 ? -(bx.vy / spd) * bx.accel * 4.0 : 0

    const throttle = inRange ? 0.02 : 1.0
    const { fx, fy } = this.steerForce(
      (rawF.fx + avoid.x) * throttle + brakeX,
      (rawF.fy + avoid.y) * throttle + brakeY,
      this.actor.body,
      this.getLateralScale(this.runData.shipId)
    )
    stepPhysics(this.actor.body, fx, fy, dt)
    wrapBounds(this.actor.body, WORLD_W, WORLD_H)
    // Heading smoothly rotates toward destination each frame.
    // ASSAULT: face locked target; all other modes: face the current waypoint.
    // This decouples the visual rotation from physics drift so the ship always
    // looks like it's going where it intends, not sliding sideways.
    {
      // Always face the locked target so weapons fire accurately
      const lt = this.enemies.getEntities().find(e => e.instanceId === this.lockedTargetId && e.alive)
      let targetHeading = this.actor.body.heading
      if (lt) {
        targetHeading = Math.atan2(lt.x - this.actor.body.x, -(lt.y - this.actor.body.y))
      } else {
        const wp = this.wrappedWaypoint()
        const wdx = wp.x - this.actor.body.x, wdy = wp.y - this.actor.body.y
        if (Math.hypot(wdx, wdy) > 15) targetHeading = Math.atan2(wdx, -wdy)
      }
      const rotRate = this.getLateralScale(this.runData.shipId) * 20
      let hDiff = targetHeading - this.actor.body.heading
      if (hDiff >  Math.PI) hDiff -= 2 * Math.PI
      if (hDiff < -Math.PI) hDiff += 2 * Math.PI
      this.actor.body.heading += Math.sign(hDiff) * Math.min(Math.abs(hDiff), rotRate * dt)
    }
    } // end if (this.netRole !== 'guest')

    // Camera follows ship
    // Spectator mode: follow the live partner's ship
    if (this.spectating) {
      const target = this.netRole === 'host' && this.actor2   ? this.actor2.body
                   : this.netRole === 'guest' && this.remoteP1 ? this.remoteP1
                   : this.actor.body
      this.cameras.main.centerOn(target.x, target.y)
    } else {
      this.cameras.main.centerOn(this.actor.body.x, this.actor.body.y)
    }

    // Combat tick
    const ship = DataLoader.getShip(this.runData.shipId)!
    this.combatState.tick(delta, ship.baseStats.SHIELD_REGEN / 1000)

    // Redraw
    const clsColor   = CLASS_COLORS[this.runData.classId] ?? 0x00ffff
    const phaseAlpha = this.combatState.isPhased ? 0.3 : 1

    this.actor.gfx.clear()
    drawNeonShip(this.actor.gfx, this.actor.body, this.actor.geometry, clsColor, phaseAlpha)

    // Snapshot combat state before enemy damage so we detect what was hit
    const shieldBefore = this.combatState.currentShield
    const hullBefore   = this.combatState.currentHull

    // Enemy update — use saved loadout if available, else hardcoded defaults
    const loadout = SaveManager.getLoadout(this.runData.shipId)
              ?? DEFAULT_LOADOUTS[this.runData.shipId]
              ?? { weapons: [], modules: [] }
    const playerRadius   = this.getPlayerCollisionRadius()
    // ASSAULT targets whatever is nearest (any type — drones AND asteroids)
    // SUPPORT fires at whatever enters the firing arc while orbiting the partner
    const targetPriority = 'any'
    const supportAnchor  = undefined   // no partner anchor — fire on whatever is in arc

    // Guest: skip local enemy simulation — render from host state instead
    if (this.netRole !== 'guest') {
      // Build optional player2 arg for co-op host
      const p2 = (this.netRole === 'host' && this.actor2 && this.combatState2) ? {
        x: this.actor2.body.x, y: this.actor2.body.y,
        heading: this.actor2.body.heading,
        radius: 16,
        body: this.actor2.body,
        weaponIds: DEFAULT_LOADOUTS[(this as any)._guestShipId ?? 'sidewinder']?.weapons ?? [],
        targetPriority: 'any' as const,
        onEnemyAttack: (damage: number) => this.combatState2!.takeDamage(damage),
      } : undefined

      this.enemies.update(
        dt,
        this.actor.body.x, this.actor.body.y,
        this.actor.body.heading,
        playerRadius,
        this.actor.body,
        loadout.weapons,
        targetPriority,
        this.sector,
        (damage) => this.combatState.takeDamage(damage),
        (result) => {
          this.runCredits += result.credits
          this.sector.addKill()
          this.dispatcher.emit({ type: 'ON_KILL', sourceId: this.runData.shipId, value: 1, timestamp: performance.now() })
          if (!this.isDead && !this.sector.atMaxSector && this.enemies.count === 0) {
            const newSector = this.sector.advance()
            this.onSectorAdvance(newSector)
          }
          this.updateKillCounter()
          // Cryo Warhead: AoE freeze at kill position
          if (this.draftedCards.some(c => c.id === 'test_cryo_warhead')) {
            this.enemies.applyCryoPulse(result.position.x, result.position.y, 400, 3000)
            if (this.netRole === 'host') network.send({ type: 'CRYO_PULSE', x: result.position.x, y: result.position.y })
          }
        },
        this.getBaseClass() === 'conductor' && this.activeRemainingMs > 0 ? 1.5 : 1,
        p2,
        supportAnchor
      )
    } else {
      // Guest: draw remote entities only
      this.drawRemoteEntities()
    }

    // Host: update P2 ship and broadcast state
    if (this.netRole === 'host' && this.actor2) {
      this.updateActor2(dt)
      this.handleShipCollision()   // resolve P1↔P2 overlap after both physics steps
      if (this.combatState2) {
        const ship2 = DataLoader.getShip((this as any)._guestShipId ?? 'sidewinder')
        if (ship2) this.combatState2.tick(delta, ship2.baseStats.SHIELD_REGEN / 1000)
        this.actor2.gfx.clear()
        if (!this.p2Dead) {
          // Tick guest active on host side
          if (this._p2ActiveMs > 0) {
            this._p2ActiveMs -= delta
            if (this._p2ActiveBase === 'architect') {
              this.combatState2.currentHull   = this.combatState2.maxHull
              this.combatState2.currentShield = this.combatState2.maxShield
            }
            if (this._p2ActiveBase === 'conductor') {
              this.combatState2.currentHeat = Math.max(0, this.combatState2.currentHeat - this.combatState2.maxHeat * 0.08)
            }
            if (this._p2ActiveBase === 'weaver') {
              this.combatState2.currentShield = Math.min(this.combatState2.maxShield,
                this.combatState2.currentShield + this.combatState2.maxShield * 0.15)
            }
          }
          const p2Alpha = this.combatState2.isPhased ? 0.3 : 1
          drawNeonShip(this.actor2.gfx, this.actor2.body, this.actor2.geometry, COPILOT_COLOR, p2Alpha)
        }
        // Update actor2's visual projectiles — target nearest enemy to actor2
        if (this.projectiles2) {
          const a2body = this.actor2.body
          const a2tgt = this.enemies.getEntities()
            .filter(e => e.alive)
            .reduce<import('../combat/EnemyEntity').EnemyEntity | null>((best, e) => {
              const d = Math.hypot(e.x - a2body.x, e.y - a2body.y)
              return !best || d < Math.hypot(best.x - a2body.x, best.y - a2body.y) ? e : best
            }, null)
          // Only show visual projectiles when within engagement range — prevents
          // shots streaking across the full viewport when target is far away
          const a2dist = a2tgt ? Math.hypot(a2tgt.x - a2body.x, a2tgt.y - a2body.y) : Infinity
          // Arc check — only fire visual projectiles when target is in the weapon's forward cone
          const a2toAngle  = a2tgt ? Math.atan2(a2tgt.x - a2body.x, -(a2tgt.y - a2body.y)) : 0
          let   a2arcDiff  = Math.abs(a2toAngle - a2body.heading)
          if (a2arcDiff > Math.PI) a2arcDiff = Math.PI * 2 - a2arcDiff
          const a2HalfArc  = 15 * Math.PI / 180   // 30° total — matches pulse_laser
          const a2InRange  = a2dist <= 450 && a2arcDiff <= a2HalfArc
          this.projectiles2.update(
            dt, a2body.x, a2body.y, a2body.heading,
            a2tgt?.x ?? 0, a2tgt?.y ?? 0, a2InRange
          )
          this.projectiles2.draw()
        }
      }
      this.netSendTimer += delta
      if (this.netSendTimer >= 50) {
        this.netSendTimer = 0
        this.broadcastGameState()
      }
    }

    if (this.netRole === 'guest') {
      this.updateP2HUD()
      // Position is now host-driven — no need to send it back
    }

    // Projectiles — only fire visuals when target is within engagement range
    const projTgt  = this.enemies.currentTarget
    const projDist = projTgt ? Math.hypot(projTgt.x - this.actor.body.x, projTgt.y - this.actor.body.y) : Infinity
    this.projectiles.update(
      dt,
      this.actor.body.x, this.actor.body.y, this.actor.body.heading,
      projTgt?.x ?? 0, projTgt?.y ?? 0,
      projTgt !== null && projDist <= 450
    )
    this.projectiles.draw()

    // God mode — reset hull and shield to max every frame
    if (this.godMode) {
      this.combatState.currentHull   = this.combatState.maxHull
      this.combatState.currentShield = this.combatState.maxShield
    }

    // Death check
    // ── Death handling ────────────────────────────────────────────────────────
    if (!this.p1Dead && this.combatState.currentHull <= 0) {
      this.p1Dead = true
      if (this.netRole === 'solo') {
        this.isDead = true
        this.triggerBenchmarkWarp()
        return
      }
      this.enterSpectatorMode()
      if (this.netRole === 'host') network.send({ type: 'P1_DEAD' })
    }
    if (this.netRole === 'host' && this.combatState2 && !this.p2Dead && this.combatState2.currentHull <= 0) {
      this.p2Dead = true
      network.send({ type: 'P2_DEAD' })
    }
    if (!this.isDead && this.netRole !== 'solo' && this.p1Dead && this.p2Dead) {
      this.isDead = true
      if (this.netRole === 'host') {
        network.send({ type: 'GAME_OVER' })
        this.triggerBenchmarkWarp()
        return
      }
    }
    if (this.isDead) return

    // Trigger damage flashes
    if (this.combatState.currentShield < shieldBefore) this.shieldFlashTimer = 1.0
    if (this.combatState.currentHull   < hullBefore)   this.hullFlashTimer   = 1.0
    this.shieldFlashTimer = Math.max(0, this.shieldFlashTimer - dt / 0.22)
    this.hullFlashTimer   = Math.max(0, this.hullFlashTimer   - dt / 0.18)
    this.drawDamageFlash()

    this.updateBackground()
    this.updateGrid()
    this.updateMinimap(clsColor)
    this.updateHUD()
    this.tickClassActive(delta)
    this.pulseUpgradeButton(dt)
  }

  private onSectorAdvance(sector: number): void {
    this.enemies.spawnSectorTransitionWave(this.sector, this.actor.body.x, this.actor.body.y)
    this.showSectorAdvanceEffect(sector)
    // Notify guest so they see the same event
    if (this.netRole === 'host') network.send({ type: 'SECTOR_ADVANCE', sector })
  }

  /** Visual-only sector advance effects — safe to call on both host and guest. */
  private showSectorAdvanceEffect(sector: number): void {
    const txt = this.add.text(VIEW_W / 2, VIEW_H / 2 - 40, `SECTOR  ${sector}`, {
      fontSize: '52px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#ffffff', strokeThickness: 2,
      shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 24, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0)

    const sub = this.add.text(VIEW_W / 2, VIEW_H / 2 + 22, 'SECTOR ADVANCE', {
      fontSize: '12px', color: '#335544', fontFamily: 'monospace', letterSpacing: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0)

    this.tweens.add({
      targets: [txt, sub],
      alpha: { from: 0, to: 1 },
      duration: 400, yoyo: true, hold: 900,
      onComplete: () => { txt.destroy(); sub.destroy() },
    })

    const flash = this.add.graphics().setScrollFactor(0).setDepth(199)
    const gridCol = this.sector.getGridColor()
    flash.fillStyle(gridCol, 0.35).fillRect(0, 0, VIEW_W, VIEW_H)
    this.tweens.add({
      targets: flash, alpha: { from: 1, to: 0 }, duration: 600,
      onComplete: () => flash.destroy(),
    })
  }

  private drawDamageFlash(): void {
    const g = this.damageFlashGfx
    g.clear()
    const { x, y } = this.actor.body

    if (this.shieldFlashTimer > 0) {
      const t  = this.shieldFlashTimer
      const r  = 44 + (1 - t) * 28
      // Outer glow ring
      g.lineStyle(10, 0x4488ff, t * 0.12); g.strokeCircle(x, y, r)
      // Crisp ring
      g.lineStyle(2, 0x4488ff, t * 0.9);   g.strokeCircle(x, y, r)
      // Screen-edge vignette (screen-space graphics still follow world coords — use fill behind)
      g.fillStyle(0x2255cc, t * 0.10);     g.fillCircle(x, y, r + 8)
    }

    if (this.hullFlashTimer > 0) {
      const t  = this.hullFlashTimer
      const r  = 34 + (1 - t) * 22
      // Outer glow
      g.lineStyle(14, 0xff2200, t * 0.18); g.strokeCircle(x, y, r)
      // Crisp ring
      g.lineStyle(2.5, 0xff8800, t * 0.95); g.strokeCircle(x, y, r)
      // Inner flash fill
      g.fillStyle(0xff2200, t * 0.08);     g.fillCircle(x, y, r)
    }
  }

  // ─── Build ───────────────────────────────────────────────────────────────

  private buildActor(): void {
    const { shipId } = this.runData
    const geo  = getGeometry(shipId)
    const ship = DataLoader.getShip(shipId)
    if (!geo || !ship) return

    const maxSpeed = remap(ship.baseStats.TOP_SPEED,    150, 620, 35, 150)
    const accel    = remap(ship.baseStats.ACCELERATION, 100, 600, 25,  90)
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

    // Apply equipped module bonuses (level-stacked)
    const equippedMods = SaveManager.getEquippedModules(this.runData.shipId)
    for (const moduleId of equippedMods) {
      const mod = DataLoader.getModule(moduleId)
      const level = SaveManager.getModuleLevel(moduleId)
      if (!mod || level === 0) continue
      // passiveBonuses represent the Lv20 target — divide by 20 so Lv1 is tiny
      const bonuses = mod.passiveBonuses as Record<string, number>
      const scale = level / MODULE_MAX_LEVEL
      if (bonuses.HULL) {
        const add = Math.round(bonuses.HULL * scale)
        this.combatState.maxHull += add
        this.combatState.currentHull = this.combatState.maxHull
      }
      if (bonuses.SHIELD_MAX) {
        const add = Math.round(bonuses.SHIELD_MAX * scale)
        this.combatState.maxShield += add
        this.combatState.currentShield = this.combatState.maxShield
      }
      if (bonuses.HEAT_CAPACITY) {
        this.combatState.maxHeat += Math.round(bonuses.HEAT_CAPACITY * scale)
      }
      if (bonuses.ENERGY_GRID) {
        const add = Math.round(bonuses.ENERGY_GRID * scale)
        this.combatState.maxEnergy += add
        this.combatState.currentEnergy = this.combatState.maxEnergy
      }
    }

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
        if (event.type === 'ON_KILL' && this.netRole !== 'guest') {
          // Guest kill count and level-up are managed by the GAME_STATE sync handler
          // to avoid double-triggering (dispatcher fires + explicit level loop both fire)
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

  private getPlayerCollisionRadius(): number {
    const ship = DataLoader.getShip(this.runData.shipId)
    if (!ship) return 16
    if (ship.weightClass === 'Heavy')  return 28
    if (ship.weightClass === 'Medium') return 20
    return 15   // Light
  }

  private triggerBenchmarkWarp(): void {
    this.simulator.stop()
    // For co-op: disconnect after a brief delay so GAME_OVER reaches the guest first
    if (this.netRole !== 'solo') {
      this.time.delayedCall(300, () => network.disconnect())
    }

    // White flash then fade to black → BenchmarkScene
    this.cameras.main.flash(250, 255, 255, 255)
    this.time.delayedCall(350, () => {
      this.cameras.main.fade(400, 0, 0, 0)
      this.time.delayedCall(450, () => {
        const ship = DataLoader.getShip(this.runData.shipId)
        this.scene.start('BenchmarkScene', {
          pilot:          this.runData.pilot,
          shipId:         this.runData.shipId,
          classId:        this.runData.classId,
          killsThisRun:   this.killCount,
          creditsThisRun: this.runCredits,
          levelReached:   this.level,
          sectorReached:  this.sector.sector,
          maxHull:        ship?.baseStats.HULL ?? 900,
        })
      })
    })
  }

  private buildEnemies(): void {
    this.enemies = new EnemyManager()
    this.enemies.init(this)
    // Guest receives enemy state from host — don't spawn a parallel simulation
    if (this.netRole !== 'guest') this.enemies.spawnSectorWave(this.sector)

    const loadout = SaveManager.getLoadout(this.runData.shipId)
              ?? DEFAULT_LOADOUTS[this.runData.shipId]
              ?? { weapons: [], modules: [] }
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
      } else if (mod.stat === 'SHIELD_DELAY' && mod.type === 'flat') {
        this.combatState.shieldDelayMs = Math.max(500, this.combatState.shieldDelayMs + mod.value * 1000)
      } else if (mod.stat === 'FIRE_RATE' && mod.type === 'percent') {
        // Reduce visual projectile cooldown by mod.value fraction (e.g. 0.10 = 10% faster)
        this.projectiles.applyFireRateBoost(mod.value)
        this.projectiles2?.applyFireRateBoost(mod.value)
      }
    }
    this.updateModulesDisplay()
    this.logTrigger(`Drafted: ${card.name}`, 'UPGRADE')
    this.drafting = false
  }

  // ─── Waypoint helpers ────────────────────────────────────────────────────

  private nextWaypoint(): { x: number; y: number } {
    const bx = this.actor.body.x, by = this.actor.body.y
    const entities = this.enemies.getEntities()
    const KITE_RANGE = 280

    switch (this.flightMode) {
      case 'PATROL': {
        // Orbit the centroid of ALL live enemies — wider radius ensures
        // the sweep activates enemies across the whole sector
        const alive = entities.filter(e => e.alive)
        if (alive.length === 0) return this.randomWaypointFrom(bx, by)
        const cx = alive.reduce((s, e) => s + e.x, 0) / alive.length
        const cy = alive.reduce((s, e) => s + e.y, 0) / alive.length
        this.patrolOrbitAngle += Math.PI / 4
        return {
          x: ((cx + Math.cos(this.patrolOrbitAngle) * 480) % WORLD_W + WORLD_W) % WORLD_W,
          y: ((cy + Math.sin(this.patrolOrbitAngle) * 480) % WORLD_H + WORLD_H) % WORLD_H,
        }
      }

      case 'KITE': {
        // Dance perpendicular to nearest threat at ~85% weapon range
        const threat = entities.filter(e => e.alive)
          .reduce<typeof entities[0] | null>((best, e) => {
            const d = Math.hypot(e.x - bx, e.y - by)
            return (!best || d < Math.hypot(best.x - bx, best.y - by)) ? e : best
          }, null)
        if (!threat) return this.randomWaypointFrom(bx, by)
        const dist = Math.hypot(threat.x - bx, threat.y - by)
        const awayAngle = Math.atan2(by - threat.y, bx - threat.x)
        if (dist < KITE_RANGE * 0.6) {
          // Too close — retreat directly away
          this.kiteAngle = awayAngle
        } else {
          // Strafe: advance angle with random lateral jitter
          this.kiteAngle = awayAngle + (Math.random() - 0.5) * (Math.PI / 3)
        }
        const targetDist = KITE_RANGE * 0.85
        return {
          x: ((threat.x + Math.cos(this.kiteAngle) * targetDist) % WORLD_W + WORLD_W) % WORLD_W,
          y: ((threat.y + Math.sin(this.kiteAngle) * targetDist) % WORLD_H + WORLD_H) % WORLD_H,
        }
      }

      case 'ASSAULT':
        // Per-frame lock-on handled in update() — this branch is never reached
        return this.randomWaypointFrom(bx, by)

      case 'SUPPORT': {
        // Circular orbit around partner; solo fallback → PATROL centroid
        const partner = this.netRole === 'host'  ? this.actor2?.body
                      : this.netRole === 'guest' ? this.remoteP1
                      : null
        if (partner) {
          this.supportOrbitAngle += Math.PI / 5
          return {
            x: ((partner.x + Math.cos(this.supportOrbitAngle) * 140) % WORLD_W + WORLD_W) % WORLD_W,
            y: ((partner.y + Math.sin(this.supportOrbitAngle) * 140) % WORLD_H + WORLD_H) % WORLD_H,
          }
        }
        // Solo: behave like PATROL
        const alive2 = entities.filter(e => e.alive)
          .sort((a, b) => Math.hypot(a.x - bx, a.y - by) - Math.hypot(b.x - bx, b.y - by))
          .slice(0, 5)
        if (alive2.length === 0) return this.randomWaypointFrom(bx, by)
        const cx2 = alive2.reduce((s, e) => s + e.x, 0) / alive2.length
        const cy2 = alive2.reduce((s, e) => s + e.y, 0) / alive2.length
        this.supportOrbitAngle += Math.PI / 4
        return {
          x: ((cx2 + Math.cos(this.supportOrbitAngle) * 350) % WORLD_W + WORLD_W) % WORLD_W,
          y: ((cy2 + Math.sin(this.supportOrbitAngle) * 350) % WORLD_H + WORLD_H) % WORLD_H,
        }
      }

      default: // PATROL fallback
        return this.randomWaypointFrom(bx, by)
    }
  }

  /**
   * Resolve the current HUNTER lock target.
   * Keeps the current lock until the target dies, then switches to nearest.
   * If another enemy is already in the firing line (closer + currently being shot),
   * it can take priority.
   */
  private resolveHunterTarget(
    px: number, py: number,
    entities: readonly import('../combat/EnemyEntity').EnemyEntity[],
    currentFiringTarget: import('../combat/EnemyEntity').EnemyEntity | null,
    setLock: (id: string | null) => void
  ): import('../combat/EnemyEntity').EnemyEntity | null {
    // Retrieve whichever lock applies to the caller
    const lockedId = entities === this.enemies.getEntities()
      ? (currentFiringTarget !== null ? this.lockedTargetId : this.actor2LockedTargetId)
      : this.actor2LockedTargetId

    // Check if the firing target is significantly closer — opportunistic switch
    if (currentFiringTarget?.alive && lockedId && currentFiringTarget.instanceId !== lockedId) {
      const lockedEnt  = entities.find(e => e.instanceId === lockedId && e.alive)
      const fDist      = Math.hypot(currentFiringTarget.x - px, currentFiringTarget.y - py)
      const lDist      = lockedEnt ? Math.hypot(lockedEnt.x - px, lockedEnt.y - py) : Infinity
      if (fDist < lDist * 0.65) {
        setLock(currentFiringTarget.instanceId)
        return currentFiringTarget
      }
    }

    // Keep existing lock if still alive
    if (lockedId) {
      const locked = entities.find(e => e.instanceId === lockedId && e.alive)
      if (locked) return locked
    }

    // Lock onto nearest non-drift (drone/turret) first, then asteroid
    const preferred = entities
      .filter(e => e.def.behavior !== 'DRIFT' && e.alive)
      .sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py))
    const fallback = entities
      .filter(e => e.def.behavior === 'DRIFT' && e.alive)
      .sort((a, b) => Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py))

    const next = preferred[0] ?? fallback[0] ?? null
    setLock(next?.instanceId ?? null)
    return next
  }

  private randomWaypointFrom(fromX: number, fromY: number): { x: number; y: number } {
    const angle = Math.random() * Math.PI * 2
    const dist  = Phaser.Math.Between(500, 1400)
    const x = ((fromX + Math.cos(angle) * dist) % WORLD_W + WORLD_W) % WORLD_W
    const y = ((fromY + Math.sin(angle) * dist) % WORLD_H + WORLD_H) % WORLD_H
    return { x, y }
  }

  // ─── Multiplayer methods ──────────────────────────────────────────────────

  private enterSpectatorMode(): void {
    this.spectating = true
    this.actor.gfx.setVisible(false)   // hide dead ship entirely
    const partnerName = this.netRole === 'host'
      ? ((this as any)._guestPilot ?? 'CO-PILOT')
      : this.runData.pilot
    this.spectatorText = this.add.text(VIEW_W / 2, 36, `◈ SPECTATING  ${partnerName.toUpperCase()}`, {
      fontSize: '12px', color: '#9933ff', fontFamily: 'monospace', letterSpacing: 3,
      shadow: { offsetX: 0, offsetY: 0, color: '#9933ff', blur: 10, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(55)
  }

  private setupHostNet(): void {
    network.on('FLIGHT_MODE', (msg) => {
      this.guestFlightMode = msg.mode as FlightMode
      if (this.guestFlightMode !== 'ASSAULT') {
        this.actor2LockedTargetId = null
        this.actor2AssaultAngle   = 0
        // Immediately repick waypoint for non-assault modes
        if (this.actor2) {
          this.actor2Waypoint = this.nextWaypointFor(
            this.actor2.body.x, this.actor2.body.y, this.guestFlightMode
          )
        }
      }
    })
    // Guest reports their real position — snap actor2 to it so the host sees the actual ship
    network.on('PLAYER_ACTIVE', (msg) => {
      if (!this.combatState2) return
      const base     = msg.base as string
      const duration = msg.duration as number
      if (base === 'architect') {
        // Bulwark: restore P2 to full immediately and for duration via broadcast
        this._p2ActiveBase = 'architect'; this._p2ActiveMs = duration
      } else if (base === 'conductor') {
        this._p2ActiveBase = 'conductor'; this._p2ActiveMs = duration
      } else if (base === 'weaver') {
        this.combatState2.activeEffects.push({ type: 'PHASE', remainingMs: duration, value: 1 })
        this._p2ActiveBase = 'weaver'; this._p2ActiveMs = duration
      }
    })

    // Host drives actor2 fully via pursuit — ignore guest's reported position
    network.on('PEER_DISCONNECTED', () => {
      this.guestFlightMode = 'PATROL'
      this.p2NameText?.setText('CO-PILOT DISCONNECTED')
    })

    const guestShipId  = (this as any)._guestShipId  ?? 'sidewinder'
    const guestClassId = (this as any)._guestClassId ?? 'chrono_architect'
    this.buildActor2(guestShipId)
    this.buildCombatState2(guestShipId, guestClassId)
    this.remoteActiveGfx = this.add.graphics().setDepth(196)
    // Visual projectiles for actor2
    const loadout2 = DEFAULT_LOADOUTS[guestShipId] ?? { weapons: [], modules: [] }
    this.projectiles2 = new ProjectileSystem()
    this.projectiles2.init(this, loadout2.weapons)
  }

  private _hostShipId?:   string
  private _hostClassId?:  string
  private _p1Dead         = false
  private _p2ActiveBase?: string    // host: tracks guest active for simulation
  private _p2ActiveMs     = 0
  private _remoteActiveBase?: string  // guest: received host active state
  private _remoteActiveMs   = 0
  private remoteActiveGfx?: Phaser.GameObjects.Graphics  // draws partner's glow
  private _remoteP1Phased   = false
  private _remoteCryoPulses: Array<{x:number;y:number;life:number;decay:number;radius:number;maxRadius:number}> = []

  private setupGuestNet(): void {
    this.remoteGfx        = this.add.graphics().setDepth(5)
    this.remoteActiveGfx  = this.add.graphics().setDepth(196)
    network.on('GAME_STATE', (msg) => {
      const snap = msg as unknown as GameStateSnapshot
      this.remoteP1               = snap.p1
      this.remoteEnemies          = snap.enemies
      // Host drives this ship's position — update actor.body from authoritative snap.p2
      if (snap.p2) {
        this.actor.body.x  = snap.p2.x
        this.actor.body.y  = snap.p2.y
        this.actor.body.vx = snap.p2.vx
        this.actor.body.vy = snap.p2.vy
        // Smooth heading (avoid snap on phase/heading changes)
        let snapHDiff = snap.p2.heading - this.actor.body.heading
        if (snapHDiff >  Math.PI) snapHDiff -= 2 * Math.PI
        if (snapHDiff < -Math.PI) snapHDiff += 2 * Math.PI
        this.actor.body.heading += snapHDiff * 0.35
      }
      this._remoteActiveBase      = snap.p1ActiveBase
      this._remoteActiveMs        = snap.p1ActiveMs ?? 0
      this._remoteP1Phased        = snap.p1Phased   ?? false
      this.remoteP1Projectiles    = snap.p1Projectiles    ?? []
      this.remoteP2Projectiles    = snap.p2Projectiles    ?? []
      this.remoteEnemyProjectiles = snap.enemyProjectiles ?? []
      if (snap.hostShipId  && !this._hostShipId)  this._hostShipId  = snap.hostShipId
      if (snap.hostClassId && !this._hostClassId) this._hostClassId = snap.hostClassId
      // Authoritative P2 state from host — skip during active (active protects locally)
      if (this.combatState && snap.p2 && this.activeRemainingMs <= 0) {
        this.combatState.currentHull   = snap.p2.hullRatio   * this.combatState.maxHull
        this.combatState.currentShield = snap.p2.shieldRatio * (this.combatState.maxShield || 1)
      }
      // Shared kill count — trigger drafts and guest trigger cards
      if (snap.kills > this.killCount) {
        const prevLevel = Math.floor(this.killCount / KILLS_PER_LEVEL)
        const newKills  = snap.kills - this.killCount
        // Fire ON_KILL events so guest's trigger cards (Kill Feed, Phase Reaction, etc.) activate
        for (let k = 0; k < Math.min(newKills, 5); k++) {
          this.dispatcher.emit({ type: 'ON_KILL', sourceId: this.runData.shipId, value: 1, timestamp: performance.now() })
        }
        this.killCount = snap.kills
        this.updateKillCounter()
        const newLevel = Math.floor(this.killCount / KILLS_PER_LEVEL)
        for (let i = prevLevel; i < newLevel; i++) {
          if (!this.drafting) this.triggerDraft()
        }
      }
    })
    network.on('P2_DEAD', () => {
      if (!this.p2Dead) {
        this.p2Dead = true
        this.enterSpectatorMode()
      }
    })
    network.on('P1_DEAD', () => {
      this._p1Dead = true
      if (this.p2NameText) this.p2NameText.setText('HOST IN SPECTATOR')
    })
    network.on('CRYO_PULSE', (msg) => {
      this._remoteCryoPulses.push({
        x: msg.x as number, y: msg.y as number,
        life: 1, decay: 1 / 600, radius: 30, maxRadius: 400,
      })
    })
    network.on('SECTOR_ADVANCE', (msg) => {
      // Update local sector number and show the same visual effect as host
      const s = msg.sector as number
      this.sector['_sector'] = s   // sync sector state
      this.showSectorAdvanceEffect(s)
      this.sectorText?.setText(`SECTOR ${s}`)
    })
    network.on('GAME_OVER', () => {
      if (!this.isDead) {
        this.isDead = true
        this.triggerBenchmarkWarp()
      }
    })
    network.on('PEER_DISCONNECTED', () => {
      this.p2NameText?.setText('HOST DISCONNECTED')
    })
  }

  private buildActor2(shipId: string): void {
    const geo  = getGeometry(shipId)
    const ship = DataLoader.getShip(shipId)
    if (!geo || !ship) return

    const maxSpeed = remap(ship.baseStats.TOP_SPEED,    150, 620, 35, 150)
    const accel    = remap(ship.baseStats.ACCELERATION, 100, 600, 25,  90)
    const mass     = ship.baseStats.MASS
    const drag     = remap(mass, 1, 12, 0.82, 0.94)

    const body = createBody(
      this.wx + 320 + Phaser.Math.Between(-100, 100),
      this.wy + Phaser.Math.Between(-100, 100),
      maxSpeed, accel, mass, drag
    )

    this.actor2 = {
      geometry: geo,
      body,
      gfx: this.add.graphics().setDepth(5),
      waypoint: this.randomWaypointFrom(this.wx + 320, this.wy),
      arrivalR: 120,
    }
    this.actor2Waypoint = this.actor2.waypoint
  }

  private buildCombatState2(shipId: string, classId: string): void {
    const ship = DataLoader.getShip(shipId)
    if (!ship) return
    this.combatState2 = new CombatState(ship, classId)
  }

  private updateActor2(dt: number): void {
    if (!this.actor2) return
    const body = this.actor2.body

    // Actor2 always pursues like P1
    {
      const a2Target = this.resolveHunterTarget(
        body.x, body.y,
        this.enemies.getEntities(),
        null,
        (id) => { this.actor2LockedTargetId = id }
      )
      if (a2Target) {
        this.actor2Waypoint = {
          x: ((a2Target.x % WORLD_W) + WORLD_W) % WORLD_W,
          y: ((a2Target.y % WORLD_H) + WORLD_H) % WORLD_H,
        }
      } else {
        const dx = this.actor2Waypoint.x - body.x
        const dy = this.actor2Waypoint.y - body.y
        if (Math.hypot(dx, dy) < 120) {
          this.actor2Waypoint = this.randomWaypointFrom(body.x, body.y)
        }
      }
    }
    // Wrapped waypoint
    let wdx = this.actor2Waypoint.x - body.x
    let wdy = this.actor2Waypoint.y - body.y
    if (wdx >  WORLD_W / 2) wdx -= WORLD_W
    if (wdx < -WORLD_W / 2) wdx += WORLD_W
    if (wdy >  WORLD_H / 2) wdy -= WORLD_H
    if (wdy < -WORLD_H / 2) wdy += WORLD_H
    const wp2 = { x: body.x + wdx, y: body.y + wdy }
    const rawF2 = chase(body, wp2.x, wp2.y)
    // Throttle when P2 has a close weapon target
    const a2WeaponTgt = this.enemies.getEntities()
      .filter(e => e.alive)
      .reduce<import('../combat/EnemyEntity').EnemyEntity | null>((best, e) => {
        const d = Math.hypot(e.x - body.x, e.y - body.y)
        return !best || d < Math.hypot(best.x - body.x, best.y - body.y) ? e : best
      }, null)
    const a2TgtDist  = a2WeaponTgt ? Math.hypot(a2WeaponTgt.x - body.x, a2WeaponTgt.y - body.y) : Infinity
    const a2InRange  = a2WeaponTgt !== null && a2TgtDist <= 350
    const a2Spd     = Math.hypot(body.vx, body.vy)
    const a2BrakeX  = a2InRange && a2Spd > 6 ? -(body.vx / a2Spd) * body.accel * 4.0 : 0
    const a2BrakeY  = a2InRange && a2Spd > 6 ? -(body.vy / a2Spd) * body.accel * 4.0 : 0
    const a2Throttle = a2InRange ? 0.02 : 1.0
    // P2 avoids P1
    let a2AvoidX = 0, a2AvoidY = 0
    if (!this.p1Dead) {
      const aaDx = body.x - this.actor.body.x, aaDy = body.y - this.actor.body.y
      const aaDist = Math.hypot(aaDx, aaDy)
      if (aaDist < 200 && aaDist > 0.5) {
        const t = 1 - aaDist / 200
        const push = t * t * body.accel * 3.0
        a2AvoidX = (aaDx / aaDist) * push
        a2AvoidY = (aaDy / aaDist) * push
      }
    }
    const { fx: fx2, fy: fy2 } = this.steerForce(
      rawF2.fx * a2Throttle + a2AvoidX + a2BrakeX,
      rawF2.fy * a2Throttle + a2AvoidY + a2BrakeY,
      body, this.getLateralScale((this as any)._guestShipId ?? 'sidewinder')
    )
    stepPhysics(body, fx2, fy2, dt)
    wrapBounds(body, WORLD_W, WORLD_H)
    {
      const lt2 = this.enemies.getEntities().find(e => e.instanceId === this.actor2LockedTargetId && e.alive)
      let targetH2 = body.heading
      if (lt2) {
        targetH2 = Math.atan2(lt2.x - body.x, -(lt2.y - body.y))
      } else {
        const wdx = this.actor2Waypoint.x - body.x, wdy = this.actor2Waypoint.y - body.y
        if (Math.hypot(wdx, wdy) > 15) targetH2 = Math.atan2(wdx, -wdy)
      }
      const rotRate2 = this.getLateralScale((this as any)._guestShipId ?? 'sidewinder') * 20
      let hDiff2 = targetH2 - body.heading
      if (hDiff2 >  Math.PI) hDiff2 -= 2 * Math.PI
      if (hDiff2 < -Math.PI) hDiff2 += 2 * Math.PI
      body.heading += Math.sign(hDiff2) * Math.min(Math.abs(hDiff2), rotRate2 * dt)
    }
  }

  // Mirrors nextWaypoint() for actor2 using explicit coordinates.
  private nextWaypointFor(fromX: number, fromY: number, mode: FlightMode): { x: number; y: number } {
    const bx = fromX, by = fromY
    const entities = this.enemies.getEntities()
    const KITE_RANGE = 280

    switch (mode) {
      case 'PATROL': {
        const alive = entities.filter(e => e.alive)
          .sort((a, b) => Math.hypot(a.x - bx, a.y - by) - Math.hypot(b.x - bx, b.y - by))
          .slice(0, 5)
        if (alive.length === 0) return this.randomWaypointFrom(bx, by)
        const cx = alive.reduce((s, e) => s + e.x, 0) / alive.length
        const cy = alive.reduce((s, e) => s + e.y, 0) / alive.length
        this.actor2PatrolAngle += Math.PI / 4
        return {
          x: ((cx + Math.cos(this.actor2PatrolAngle) * 350) % WORLD_W + WORLD_W) % WORLD_W,
          y: ((cy + Math.sin(this.actor2PatrolAngle) * 350) % WORLD_H + WORLD_H) % WORLD_H,
        }
      }

      case 'KITE': {
        const threat = entities.filter(e => e.alive)
          .reduce<typeof entities[0] | null>((best, e) => {
            const d = Math.hypot(e.x - bx, e.y - by)
            return (!best || d < Math.hypot(best.x - bx, best.y - by)) ? e : best
          }, null)
        if (!threat) return this.randomWaypointFrom(bx, by)
        const dist = Math.hypot(threat.x - bx, threat.y - by)
        const awayAngle = Math.atan2(by - threat.y, bx - threat.x)
        const kiteAngle = dist < KITE_RANGE * 0.6
          ? awayAngle
          : awayAngle + (Math.random() - 0.5) * (Math.PI / 3)
        return {
          x: ((threat.x + Math.cos(kiteAngle) * KITE_RANGE * 0.85) % WORLD_W + WORLD_W) % WORLD_W,
          y: ((threat.y + Math.sin(kiteAngle) * KITE_RANGE * 0.85) % WORLD_H + WORLD_H) % WORLD_H,
        }
      }

      case 'ASSAULT':
        // Per-frame in updateActor2 — this case is never reached
        return this.randomWaypointFrom(bx, by)

      case 'SUPPORT': {
        this.actor2OrbitAngle += Math.PI / 5
        const p1 = this.actor.body
        return {
          x: ((p1.x + Math.cos(this.actor2OrbitAngle) * 140) % WORLD_W + WORLD_W) % WORLD_W,
          y: ((p1.y + Math.sin(this.actor2OrbitAngle) * 140) % WORLD_H + WORLD_H) % WORLD_H,
        }
      }

      default: // PATROL fallback
        return this.randomWaypointFrom(bx, by)
    }
  }

  private broadcastGameState(): void {
    const p1 = this.actor.body
    const p2 = this.actor2?.body
    const cs  = this.combatState
    const cs2 = this.combatState2

    const shipState = (body: typeof p1, s: CombatState): RemoteShipState => ({
      x: body.x, y: body.y, vx: body.vx, vy: body.vy, heading: body.heading,
      hullRatio:   s.currentHull   / s.maxHull,
      shieldRatio: s.currentShield / (s.maxShield || 1),
      heatRatio:   s.currentHeat   / s.maxHeat,
      energyRatio: s.energyRatio,
    })

    const snap: GameStateSnapshot = {
      tick:        Date.now(),
      p1:          shipState(p1, cs),
      p2:          p2 && cs2 ? shipState(p2, cs2) : shipState(p1, cs),
      enemies:     this.enemies.getRemoteStates(),
      sector:      this.sector.sector,
      kills:       this.killCount,
      hostShipId:  this.runData.shipId,
      hostClassId: this.runData.classId,
      p1Projectiles:    this.projectiles.getStates(),
      p2Projectiles:    this.projectiles2?.getStates() ?? [],
      enemyProjectiles: this.enemies.getEnemyProjectileStates(),
      p1ActiveBase: this.activeRemainingMs > 0 ? (this.getBaseClass() ?? undefined) : undefined,
      p1ActiveMs:   this.activeRemainingMs > 0 ? this.activeRemainingMs : undefined,
      p1Phased:     this.combatState.isPhased,
      p2Phased:     this.combatState2?.isPhased ?? false,
    }
    network.sendState(snap)
  }

  private drawRemoteEntities(): void {
    const g = this.remoteGfx
    if (!g) return
    g.clear()

    // Remote P1 — hidden once the host ship is destroyed
    if (this.remoteP1 && !this._p1Dead) {
      const geo = this._hostShipId ? getGeometry(this._hostShipId) : null
      if (geo) {
        const fakeBody = {
          x: this.remoteP1.x, y: this.remoteP1.y,
          vx: this.remoteP1.vx, vy: this.remoteP1.vy,
          heading: this.remoteP1.heading,
        } as import('../physics/PhysicsBody').PhysicsBody
        drawNeonShip(g, fakeBody, geo, COPILOT_COLOR, this._remoteP1Phased ? 0.3 : 1)
      } else {
        // Fallback: cyan diamond
        const { x, y, heading } = this.remoteP1
        const cos = Math.cos(heading), sin = Math.sin(heading)
        g.lineStyle(6, COPILOT_COLOR, 0.1); g.strokeTriangle(x+cos*14,y+sin*14, x-cos*8+sin*8,y-sin*8-cos*8, x-cos*8-sin*8,y-sin*8+cos*8)
        g.lineStyle(2, COPILOT_COLOR, 0.9); g.strokeTriangle(x+cos*14,y+sin*14, x-cos*8+sin*8,y-sin*8-cos*8, x-cos*8-sin*8,y-sin*8+cos*8)
      }
    }

    // Remote enemies — reconstruct exact shapes using the same algorithm as EnemyEntity
    const ENEMY_COLOR_MAP: Record<string, number> = {
      asteroid_xl: 0x99aabb, asteroid_large: 0x8899aa, asteroid_medium: 0x778899, asteroid_small: 0x667788,
      scout_drone: 0xff4422, attack_drone: 0xff2200, turret: 0xdd1100,
    }
    for (const e of this.remoteEnemies) {
      const color  = ENEMY_COLOR_MAP[e.defId] ?? 0xff3300
      const shape  = remoteEnemyShape(e.defId, e.instanceId)
      const cos    = Math.cos(e.heading), sin = Math.sin(e.heading)
      const pts    = shape.map(([x, y]) => ({
        x: e.x + x * cos - y * sin,
        y: e.y + x * sin + y * cos,
      }))

      g.lineStyle(8,   color, 0.05); g.strokePoints(pts, true)
      g.lineStyle(3,   color, 0.25); g.strokePoints(pts, true)
      g.lineStyle(1.5, color, 1.0);  g.strokePoints(pts, true)

      const r = remoteEnemyRadius(e.defId)
      if (e.hullRatio < 1) {
        const bw = r * 1.8, bx = e.x - bw / 2, by = e.y - r - 10
        g.fillStyle(0x111111, 0.8); g.fillRect(bx, by, bw, 4)
        g.fillStyle(color, 1);      g.fillRect(bx, by, bw * e.hullRatio, 4)
      }
      if (e.shieldRatio > 0) {
        const bw = r * 1.8, bx = e.x - bw / 2, by = e.y - r - 16
        g.fillStyle(0x111111, 0.8); g.fillRect(bx, by, bw, 3)
        g.fillStyle(0x4488ff, 1);   g.fillRect(bx, by, bw * e.shieldRatio, 3)
      }
    }

    // Draw received projectiles — P1 (host), P2 (co-pilot on host), and enemy shots
    const drawProjs = (projs: import('../systems/NetworkManager').RemoteProjectile[]) => {
      for (const p of projs) {
        g.lineStyle(p.size * 0.7, p.color, 0.35)
        g.lineBetween(p.x, p.y, p.x - p.vx * 0.055, p.y - p.vy * 0.055)
        g.fillStyle(p.color, 0.18); g.fillCircle(p.x, p.y, p.size + 2.5)
        g.fillStyle(p.color, 1.0);  g.fillCircle(p.x, p.y, p.size)
      }
    }
    drawProjs(this.remoteP1Projectiles)
    drawProjs(this.remoteP2Projectiles)
    drawProjs(this.remoteEnemyProjectiles)

    // Remote cryo pulses (host's warhead detonations, guest visual only)
    for (const p of this._remoteCryoPulses) {
      p.radius += (p.maxRadius - p.radius) * 0.12
      p.life   -= p.decay
      if (p.life > 0) {
        g.lineStyle(2.5, 0x44aaff, p.life * 0.8);  g.strokeCircle(p.x, p.y, p.radius)
        g.lineStyle(6,   0x44aaff, p.life * 0.15);  g.strokeCircle(p.x, p.y, p.radius)
      }
    }
    this._remoteCryoPulses = this._remoteCryoPulses.filter(p => p.life > 0)
  }

  private buildP2HUD(): void {
    const addHUD = (obj: Phaser.GameObjects.GameObject) =>
      (obj as any).setScrollFactor(0).setDepth(50)

    const guestPilot = (this as any)._guestPilot ?? 'CO-PILOT'
    this.p2NameText = this.add.text(VIEW_W - 14, 214, guestPilot.toUpperCase(), {
      fontSize: '11px', color: COPILOT_COLOR_HEX, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0); addHUD(this.p2NameText)

    this.add.text(VIEW_W - 14, 230, 'CO-PILOT', {
      fontSize: '9px', color: '#441166', fontFamily: 'monospace',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(50)

    this.p2HullBar   = this.add.graphics(); addHUD(this.p2HullBar)
    this.p2ShieldBar = this.add.graphics(); addHUD(this.p2ShieldBar)

    this.add.text(VIEW_W - 222, 246, 'HULL',   { fontSize: '9px', color: '#553355', fontFamily: 'monospace' }).setScrollFactor(0).setDepth(50)
    this.add.text(VIEW_W - 222, 262, 'SHIELD', { fontSize: '9px', color: '#553355', fontFamily: 'monospace' }).setScrollFactor(0).setDepth(50)

    // Room code — visible to host so they can share it mid-session
    if (this.netRole === 'host' && network.roomCode) {
      this.add.text(VIEW_W / 2, 14, `SESSION  ${network.roomCode}`, {
        fontSize: '11px', color: '#335544', fontFamily: 'monospace', letterSpacing: 3,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(50)
    }
  }

  private updateP2HUD(): void {
    if (!this.p2HullBar || !this.p2ShieldBar || !this.combatState) return
    const cs = this.combatState  // guest: our own combat state updated from host
    const BAR_X = VIEW_W - 175, BAR_W = 130, BAR_H = 6

    const drawBar = (gfx: Phaser.GameObjects.Graphics, y: number, ratio: number, color: number) => {
      gfx.clear()
      gfx.fillStyle(0x111111, 0.8); gfx.fillRect(BAR_X, y, BAR_W, BAR_H)
      gfx.fillStyle(color, 1);      gfx.fillRect(BAR_X, y, BAR_W * Math.max(0, Math.min(1, ratio)), BAR_H)
    }
    drawBar(this.p2HullBar,   246, cs.currentHull   / cs.maxHull,    0xcc44ff)
    drawBar(this.p2ShieldBar, 262, cs.currentShield / (cs.maxShield || 1), 0x8844ff)
  }

  // ─── Background ──────────────────────────────────────────────────────────

  // ─── Class active ability ─────────────────────────────────────────────────

  private buildActiveHUD(add: (obj: Phaser.GameObjects.GameObject) => Phaser.GameObjects.GameObject): void {
    const base = this.getBaseClass()
    if (!base) return

    const labels: Record<string, { key: string; cooldown: number; color: string }> = {
      architect: { key: 'BULWARK',     cooldown: 45000, color: '#ffffff' },
      conductor: { key: 'OVERCLOCK',   cooldown: 40000, color: '#ff8800' },
      weaver:    { key: 'PHASE SHIFT', cooldown: 35000, color: '#cc44ff' },
    }
    const def = labels[base]
    this.activeCooldownMax = def.cooldown

    // Label above flight modes
    this.activeLabel = this.add.text(14, 216, `SPACE  ·  ${def.key}`, {
      fontSize: '9px', color: def.color, fontFamily: 'monospace', letterSpacing: 2,
    }); add(this.activeLabel)

    // Cooldown bar underneath label
    this.activeCooldownBar = this.add.graphics(); add(this.activeCooldownBar)
    this.activeGfx = this.add.graphics().setDepth(195)   // world-space — camera follows ship
  }

  private getBaseClass(): 'architect' | 'conductor' | 'weaver' | null {
    const id = this.runData.classId.toLowerCase()
    if (id.includes('architect')) return 'architect'
    if (id.includes('conductor')) return 'conductor'
    if (id.includes('weaver'))    return 'weaver'
    return null
  }

  private triggerClassActive(): void {
    if (this.activeCooldownMs > 0 || this.activeRemainingMs > 0 || this.p1Dead) return
    const base = this.getBaseClass()
    if (!base) return

    const durations: Record<string, number> = { architect: 3000, conductor: 6000, weaver: 4000 }
    this.activeRemainingMs = durations[base]
    this.activeCooldownMs  = this.activeCooldownMax
    // Notify host so P2's active effect is honoured in the authoritative simulation
    if (this.netRole === 'guest') network.send({ type: 'PLAYER_ACTIVE', base, duration: durations[base] })

    // Immediate effect on activation
    if (base === 'weaver') {
      // Start PHASE — use existing CombatState effect system
      this.combatState.activeEffects.push({ type: 'PHASE', remainingMs: this.activeRemainingMs, value: 1 })
    }
    if (base === 'architect') {
      // Flash white around ship immediately
      const g = this.activeGfx
      g.fillStyle(0xffffff, 0.25).fillCircle(this.actor.body.x, this.actor.body.y, 80)
      this.time.delayedCall(200, () => g.clear())
    }
  }

  private tickClassActive(deltaMs: number): void {
    if (this.activeCooldownMs > 0)  this.activeCooldownMs  = Math.max(0, this.activeCooldownMs  - deltaMs)
    if (this.activeRemainingMs > 0) this.activeRemainingMs = Math.max(0, this.activeRemainingMs - deltaMs)

    // Update cooldown bar
    if (this.activeCooldownBar) {
      const base = this.getBaseClass()
      const ready = this.activeCooldownMs <= 0
      const ratio = ready ? 1 : 1 - this.activeCooldownMs / this.activeCooldownMax
      const barColors: Record<string, number> = { architect: 0xffffff, conductor: 0xff8800, weaver: 0xcc44ff }
      const col = barColors[base ?? 'architect'] ?? 0x00ffff
      const BW = 130, BH = 5, BX = 14, BY = 227
      this.activeCooldownBar.clear()
      this.activeCooldownBar.fillStyle(0x111111, 0.8); this.activeCooldownBar.fillRect(BX, BY, BW, BH)
      this.activeCooldownBar.fillStyle(col, ready ? 1 : 0.6)
      this.activeCooldownBar.fillRect(BX, BY, BW * ratio, BH)
      if (ready) this.activeLabel?.setAlpha(1)
      else        this.activeLabel?.setAlpha(0.4)
    }

    const base = this.getBaseClass()
    const durations: Record<string, number> = { architect: 3000, conductor: 6000, weaver: 4000 }

    // Own active — mechanics + glow
    this.activeGfx?.clear()
    if (base && this.activeRemainingMs > 0) {
      if (base === 'architect') {
        this.combatState.currentHull   = this.combatState.maxHull
        this.combatState.currentShield = this.combatState.maxShield
      }
      if (base === 'conductor') {
        this.combatState.currentHeat = Math.max(0, this.combatState.currentHeat - this.combatState.maxHeat * 0.08)
      }
      if (base === 'weaver') {
        this.combatState.currentShield = Math.min(this.combatState.maxShield,
          this.combatState.currentShield + this.combatState.maxShield * 0.15)
      }
      if (this.activeGfx)
        this.drawActiveGlow(this.activeGfx, this.actor.body.x, this.actor.body.y, base, this.activeRemainingMs, durations[base])
    }

    // Partner's active glow — host draws actor2's, guest draws remoteP1's
    this.remoteActiveGfx?.clear()
    if (this.remoteActiveGfx) {
      if (this.netRole === 'host' && this._p2ActiveMs > 0 && this._p2ActiveBase && this.actor2) {
        this.drawActiveGlow(this.remoteActiveGfx, this.actor2.body.x, this.actor2.body.y,
          this._p2ActiveBase, this._p2ActiveMs, durations[this._p2ActiveBase] ?? 4000)
      }
      if (this.netRole === 'guest' && this._remoteActiveMs > 0 && this._remoteActiveBase && this.remoteP1) {
        this.drawActiveGlow(this.remoteActiveGfx, this.remoteP1.x, this.remoteP1.y,
          this._remoteActiveBase, this._remoteActiveMs, durations[this._remoteActiveBase] ?? 4000)
      }
    }
  }

  /**
   * Lateral force scale by weight class.
   * Full forward/braking thrust; lateral (turning) thrust is reduced.
   * Creates natural arc-into-turn behaviour without post-physics hacks.
   *   Light  0.40 → responsive arcs
   *   Medium 0.26 → noticeable sweep
   *   Heavy  0.15 → wide committed arcs
   */
  private getLateralScale(shipId: string): number {
    const wc = DataLoader.getShip(shipId)?.weightClass
    if (wc === 'Heavy')  return 0.55
    if (wc === 'Medium') return 0.70
    return 0.85
  }

  /**
   * Decompose `{ fx, fy }` into forward (along current velocity) and lateral
   * components, then damp the lateral part by `lateralScale`.
   * Ships near-stationary pivot freely; moving ships must arc into turns.
   */
  private steerForce(
    fx: number, fy: number,
    body: import('../physics/PhysicsBody').PhysicsBody,
    lateralScale: number
  ): { fx: number; fy: number } {
    const speed = Math.hypot(body.vx, body.vy)
    if (speed < 8) return { fx, fy }   // near-stationary: full force allowed

    const hx = body.vx / speed, hy = body.vy / speed   // unit heading
    const fwd  = fx * hx + fy * hy                      // forward component (scalar)
    const latX = fx - hx * fwd                          // lateral remainder
    const latY = fy - hy * fwd
    return { fx: hx * fwd + latX * lateralScale, fy: hy * fwd + latY * lateralScale }
  }

  /** Shared glow renderer — called for local active AND remote partner active. */
  private drawActiveGlow(g: Phaser.GameObjects.Graphics, x: number, y: number, base: string, remainingMs: number, totalMs: number): void {
    const t = Math.max(0, remainingMs / totalMs)
    if (base === 'architect') {
      g.lineStyle(4, 0xffffff, t * 0.65);  g.strokeCircle(x, y, 40 + (1-t)*20)
      g.lineStyle(12, 0xffffff, t * 0.15); g.strokeCircle(x, y, 62 + (1-t)*20)
    } else if (base === 'conductor') {
      g.lineStyle(4, 0xff8800, t * 0.55);  g.strokeCircle(x, y, 38)
      g.lineStyle(14, 0xff8800, t * 0.14); g.strokeCircle(x, y, 58)
    } else if (base === 'weaver') {
      g.lineStyle(4, 0xcc44ff, t * 0.70);  g.strokeCircle(x, y, 38)
      g.lineStyle(12, 0xcc44ff, t * 0.18); g.strokeCircle(x, y, 60)
    }
  }

  private buildBackground(): void {
    const rng = (lo: number, hi: number) => lo + Math.random() * (hi - lo)

    // Three parallax layers of stars (nx/ny are normalised [0,1] base positions)
    for (let i = 0; i < 55; i++)
      this.stars.push({ nx: Math.random(), ny: Math.random(), size: 0.5,  parallax: 0.04, alpha: rng(0.20, 0.45) })
    for (let i = 0; i < 35; i++)
      this.stars.push({ nx: Math.random(), ny: Math.random(), size: 1.0,  parallax: 0.10, alpha: rng(0.35, 0.60) })
    for (let i = 0; i < 18; i++)
      this.stars.push({ nx: Math.random(), ny: Math.random(), size: 1.6,  parallax: 0.19, alpha: rng(0.55, 0.85) })

    // Nebula blobs — large soft circles spread across the view
    this.nebulaBlobs = [
      { nx: 0.22, ny: 0.28, radius: 300, phase: 0.0, alpha: 0.055 },
      { nx: 0.74, ny: 0.62, radius: 340, phase: 1.9, alpha: 0.065 },
      { nx: 0.50, ny: 0.12, radius: 240, phase: 3.5, alpha: 0.045 },
      { nx: 0.12, ny: 0.78, radius: 270, phase: 5.2, alpha: 0.050 },
      { nx: 0.86, ny: 0.42, radius: 200, phase: 2.4, alpha: 0.040 },
    ]
  }

  private updateBackground(): void {
    const g   = this.bgGfx
    const cam = this.cameras.main
    g.clear()

    // Deep-space fill
    g.fillStyle(0x000008, 1)
    g.fillRect(0, 0, VIEW_W, VIEW_H)

    // Nebula blobs — soft stacked circles give a gradient-like look
    const nc = this.getNebulaColor()
    const t  = this.time.now * 0.00025
    for (const blob of this.nebulaBlobs) {
      // Very slow drift: camera parallax (0.012) + gentle oscillation
      const bx = ((blob.nx * VIEW_W + cam.scrollX * 0.012 + Math.sin(t + blob.phase) * 12) % VIEW_W + VIEW_W) % VIEW_W
      const by = ((blob.ny * VIEW_H + cam.scrollY * 0.012 + Math.cos(t * 0.7 + blob.phase) * 9) % VIEW_H + VIEW_H) % VIEW_H
      g.fillStyle(nc, blob.alpha * 0.30); g.fillCircle(bx, by, blob.radius)
      g.fillStyle(nc, blob.alpha * 0.55); g.fillCircle(bx, by, blob.radius * 0.65)
      g.fillStyle(nc, blob.alpha * 1.00); g.fillCircle(bx, by, blob.radius * 0.35)
    }

    // Stars — parallax scrolling, tiled by modulo
    const sc = this.getStarTint()
    for (const star of this.stars) {
      const sx = ((star.nx * VIEW_W - cam.scrollX * star.parallax) % VIEW_W + VIEW_W) % VIEW_W
      const sy = ((star.ny * VIEW_H - cam.scrollY * star.parallax) % VIEW_H + VIEW_H) % VIEW_H
      g.fillStyle(sc, star.alpha)
      g.fillCircle(sx, sy, star.size)
    }
  }

  private getNebulaColor(): number {
    const s = this.sector.sector
    if (s <= 5)  return 0x002255   // cool blue
    if (s <= 10) return 0x150030   // deep violet
    if (s <= 15) return 0x1f1000   // amber
    if (s <= 20) return 0x200000   // deep red
    return 0x001418               // void teal
  }

  private getStarTint(): number {
    const s = this.sector.sector
    if (s <= 5)  return 0xaabbff   // blue-white
    if (s <= 10) return 0xccaaff   // lavender
    if (s <= 15) return 0xffddaa   // warm amber
    if (s <= 20) return 0xffaaaa   // reddish
    return 0xaaffee               // teal-white
  }

  // ─── Grid (virtual, screen-space) ────────────────────────────────────────

  private updateGrid(): void {
    const cam     = this.cameras.main
    const offsetX = cam.scrollX % GRID_SZ
    const offsetY = cam.scrollY % GRID_SZ
    const gridCol = this.sector.getGridColor()

    this.gridGfx.clear()
    this.gridGfx.lineStyle(1, gridCol, 0.35)

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

    // Enemy dots — local (host/solo) or remote (guest)
    const enemyList = this.netRole === 'guest'
      ? this.remoteEnemies.map(e => ({ x: e.x, y: e.y, isAsteroid: e.defId.startsWith('asteroid') }))
      : this.enemies.getEntities().map(e => ({ x: e.x, y: e.y, isAsteroid: e.def.id.startsWith('asteroid') }))
    for (const e of enemyList) {
      const ex = MM_X + (e.x / WORLD_W) * MM_W
      const ey = MM_Y + (e.y / WORLD_H) * MM_H
      g.fillStyle(e.isAsteroid ? 0x667788 : 0xff3322, 0.7)
      g.fillCircle(ex, ey, e.isAsteroid ? 1.5 : 2)
    }

    // Player dot — hidden when dead/spectating
    if (!this.p1Dead) {
      const selfX = this.actor.body.x
      const selfY = this.actor.body.y
      const px = MM_X + (selfX / WORLD_W) * MM_W
      const py = MM_Y + (selfY / WORLD_H) * MM_H
      g.fillStyle(clsColor, 1); g.fillCircle(px, py, 3)
      g.lineStyle(1, clsColor, 0.4); g.strokeCircle(px, py, 5)
    }

    // Co-pilot dot — host draws actor2, guest draws remoteP1
    if (this.netRole === 'host' && this.actor2 && !this.p2Dead) {
      const p2x = MM_X + (this.actor2.body.x / WORLD_W) * MM_W
      const p2y = MM_Y + (this.actor2.body.y / WORLD_H) * MM_H
      g.fillStyle(COPILOT_COLOR, 1); g.fillCircle(p2x, p2y, 3)
      g.lineStyle(1, COPILOT_COLOR, 0.4); g.strokeCircle(p2x, p2y, 5)
    }
    if (this.netRole === 'guest' && this.remoteP1 && !this._p1Dead) {
      const p1x = MM_X + (this.remoteP1.x / WORLD_W) * MM_W
      const p1y = MM_Y + (this.remoteP1.y / WORLD_H) * MM_H
      g.fillStyle(COPILOT_COLOR, 1); g.fillCircle(p1x, p1y, 3)
      g.lineStyle(1, COPILOT_COLOR, 0.4); g.strokeCircle(p1x, p1y, 5)
    }

    // Border
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

    // Keyboard shortcuts
    // God mode toggle — press G
    this.godModeText = this.add.text(VIEW_W / 2, 12, '', {
      fontSize: '11px', color: '#ffcc00', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#ffcc00', strokeThickness: 1,
      shadow: { offsetX: 0, offsetY: 0, color: '#ffcc00', blur: 8, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(50)
    this.input.keyboard!.on('keydown-G', () => {
      this.godMode = !this.godMode
      this.godModeText.setText(this.godMode ? '◈ INVULNERABLE' : '')
    })

    this.input.keyboard!.on('keydown-SPACE', () => this.triggerClassActive())

    // ─── Active ability HUD ───────────────────────────────────────────────
    this.buildActiveHUD(add)

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

    this.sectorText = this.add.text(VIEW_W - 14, 48, 'SECTOR 1', {
      fontSize: '10px', color: '#aaaaff', fontFamily: 'monospace',
    }).setOrigin(1, 0); add(this.sectorText)

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

    // Live sector / enemy count display
    const remaining = this.enemies.count
    this.sectorText?.setText(
      remaining > 0
        ? `SECTOR ${this.sector.sector}  ·  ${remaining} LEFT`
        : `SECTOR ${this.sector.sector}`
    )
  }

  // Steering force that pushes the ship away from nearby asteroids.
  // Applied every frame on top of the waypoint-chase force so the ship
  // naturally flows around obstacles. EVASIVE gets a much wider range and
  // stronger push; all other modes get a baseline avoidance.
  // Returns the waypoint as a virtual coordinate that represents the shortest
  // path considering world wrap. If going through an edge is shorter, the
  // returned coordinate is outside [0, WORLD] bounds — chase() will steer the
  // ship toward it and wrapBounds() snaps the position back once it crosses.
  private wrappedWaypoint(): { x: number; y: number } {
    const bx = this.actor.body.x, by = this.actor.body.y
    let dx = this.actor.waypoint.x - bx
    let dy = this.actor.waypoint.y - by
    if (dx >  WORLD_W / 2) dx -= WORLD_W   // crossing right→left edge is shorter
    if (dx < -WORLD_W / 2) dx += WORLD_W   // crossing left→right edge is shorter
    if (dy >  WORLD_H / 2) dy -= WORLD_H
    if (dy < -WORLD_H / 2) dy += WORLD_H
    return { x: bx + dx, y: by + dy }
  }

  private asteroidAvoidanceForce(): { x: number; y: number } {
    const avoidRange = 220
    const strength   = 1.8

    let fx = 0, fy = 0
    const bx = this.actor.body.x, by = this.actor.body.y
    const accel = this.actor.body.accel

    const weaponTarget = this.enemies.currentTarget
    for (const e of this.enemies.getEntities()) {
      if (!e.def.id.startsWith('asteroid') || !e.alive) continue
      // Don't dodge the asteroid we're actively shooting — let the ship close in
      if (e === weaponTarget) continue
      const dx = bx - e.x, dy = by - e.y
      const dist = Math.hypot(dx, dy)
      if (dist >= avoidRange || dist < 0.5) continue

      // Repulsion falls off with distance
      const t = 1 - dist / avoidRange   // 1 when adjacent, 0 at avoidRange
      const push = t * t * accel * strength
      fx += (dx / dist) * push
      fy += (dy / dist) * push
    }
    // P1 avoids P2 (host only — same avoid range as asteroids)
    if (this.netRole === 'host' && this.actor2 && !this.p2Dead) {
      const dx = bx - this.actor2.body.x, dy = by - this.actor2.body.y
      const dist = Math.hypot(dx, dy)
      if (dist < 200 && dist > 0.5) {
        const t = 1 - dist / 200
        const push = t * t * accel * 3.0
        fx += (dx / dist) * push
        fy += (dy / dist) * push
      }
    }
    return { x: fx, y: fy }
  }

  /** Hard collision resolution between the two player ships (host only). */
  private handleShipCollision(): void {
    if (this.netRole !== 'host' || !this.actor2 || this.p2Dead || this.p1Dead) return
    const b1 = this.actor.body, b2 = this.actor2.body
    const dx = b2.x - b1.x, dy = b2.y - b1.y
    const dist = Math.hypot(dx, dy)
    const r1 = this.getPlayerCollisionRadius()
    const r2 = this.getPlayerCollisionRadius()   // both same for simplicity
    const minDist = r1 + r2 + 8                  // small gap buffer

    if (dist >= minDist || dist < 0.5) return
    const nx = dx / dist, ny = dy / dist
    const overlap = (minDist - dist) * 0.5

    // Separate
    b1.x -= nx * overlap;  b1.y -= ny * overlap
    b2.x += nx * overlap;  b2.y += ny * overlap

    // Reflect velocity components along collision normal
    const dot1 = b1.vx * nx + b1.vy * ny
    const dot2 = b2.vx * nx + b2.vy * ny
    b1.vx -= dot1 * nx * 1.3;  b1.vy -= dot1 * ny * 1.3
    b2.vx -= dot2 * nx * 1.3;  b2.vy -= dot2 * ny * 1.3
  }

  private setFlightMode(_mode: FlightMode): void { /* no-op: single pursuit mode */ }

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
