// CombatSimulator — now only handles weapon heat cycling.
// Fake hit and kill timers have been removed — real enemies handle damage
// and ON_KILL events via EnemyManager. Keeping heat so the heat/overheat
// system remains active for Hyper-Conductor builds.

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
    // Weapon fire heat accumulation
    this.timers.push(this.scene.time.addEvent({
      delay: 1200, loop: true, callback: this.simulateWeaponFire, callbackScope: this,
    }))
    // Natural heat dissipation
    this.timers.push(this.scene.time.addEvent({
      delay: 500, loop: true, callback: this.dissipateHeat, callbackScope: this,
    }))
  }

  stop(): void {
    this.timers.forEach(t => t.destroy())
    this.timers = []
  }

  private simulateWeaponFire(): void {
    const wasOk = !this.state.isOverheated
    this.state.addHeat(14)
    this.state.drainEnergy(8)

    if (wasOk && this.state.isOverheated) {
      this.dispatcher.emit({
        type: 'ON_OVERHEAT',
        sourceId: this.state.shipId,
        timestamp: performance.now(),
      })
    }
  }

  private dissipateHeat(): void {
    this.state.coolHeat(this.state.isOverheated ? 2 : 6)
  }
}
