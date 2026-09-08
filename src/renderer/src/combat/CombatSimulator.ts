// Simulates combat events until real enemies exist (Phase 5+).
// Fires hits, crits, kills, overheat, and proximity events on timers.

import Phaser from 'phaser'
import { CombatState } from './CombatState'
import { EventDispatcher } from './EventDispatcher'

export class CombatSimulator {
  private scene:      Phaser.Scene
  private state:      CombatState
  private dispatcher: EventDispatcher
  private timers:     Phaser.Time.TimerEvent[] = []

  constructor(scene: Phaser.Scene, state: CombatState, dispatcher: EventDispatcher) {
    this.scene      = scene
    this.state      = state
    this.dispatcher = dispatcher
  }

  start(): void {
    // Periodic incoming hit (every 2–4 s)
    this.timers.push(this.scene.time.addEvent({
      delay: 2200, loop: true, callback: this.simulateHit, callbackScope: this,
    }))

    // Periodic kill (every 5–8 s)
    this.timers.push(this.scene.time.addEvent({
      delay: 5500, loop: true, callback: this.simulateKill, callbackScope: this,
    }))

    // Heat accumulation from weapon fire (every 1.2 s)
    this.timers.push(this.scene.time.addEvent({
      delay: 1200, loop: true, callback: this.simulateWeaponFire, callbackScope: this,
    }))

    // Natural heat dissipation (every 500 ms)
    this.timers.push(this.scene.time.addEvent({
      delay: 500, loop: true, callback: this.dissipateHeat, callbackScope: this,
    }))
  }

  stop(): void {
    this.timers.forEach(t => t.destroy())
    this.timers = []
  }

  private simulateHit(): void {
    const isCrit = Math.random() < 0.2
    const damage = isCrit
      ? Phaser.Math.Between(120, 220)
      : Phaser.Math.Between(40, 100)

    const wasShielded = this.state.currentShield > 0
    this.state.takeDamage(damage)

    const now = performance.now()

    this.dispatcher.emit({
      type: isCrit ? 'ON_CRIT' : 'ON_HIT',
      sourceId: 'enemy',
      targetId: this.state.shipId,
      value: damage,
      timestamp: now,
    })

    // Fire shield-drop event if shields just emptied
    if (wasShielded && this.state.currentShield <= 0) {
      this.dispatcher.emit({
        type: 'ON_SHIELD_DROP',
        sourceId: this.state.shipId,
        timestamp: now,
      })
    }
  }

  private simulateKill(): void {
    this.dispatcher.emit({
      type: 'ON_KILL',
      sourceId: this.state.shipId,
      value: 1,
      timestamp: performance.now(),
    })
  }

  private simulateWeaponFire(): void {
    const heatPerShot = 14
    const wasOk = !this.state.isOverheated
    this.state.addHeat(heatPerShot)

    if (wasOk && this.state.isOverheated) {
      this.dispatcher.emit({
        type: 'ON_OVERHEAT',
        sourceId: this.state.shipId,
        timestamp: performance.now(),
      })
    }
  }

  private dissipateHeat(): void {
    // Cool down naturally between shots if not overheated
    if (!this.state.isOverheated) {
      this.state.coolHeat(6)
    } else {
      // Overheat: cool slowly
      this.state.coolHeat(2)
    }
  }
}
