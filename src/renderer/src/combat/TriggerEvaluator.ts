import type { UpgradeCard } from '../types'
import type { CombatEvent } from './EventDispatcher'
import type { CombatState } from './CombatState'

export interface TriggerFired {
  cardId:   string
  cardName: string
  action:   string
}

export class TriggerEvaluator {
  // Tracks last-fire timestamp per card to enforce cooldowns
  private cooldowns = new Map<string, number>()

  evaluate(
    event: CombatEvent,
    cards: UpgradeCard[],
    _state: CombatState,
    nowMs: number
  ): TriggerFired[] {
    const fired: TriggerFired[] = []

    for (const card of cards) {
      if (!card.logicTrigger) continue
      if (card.logicTrigger.condition !== event.type) continue

      const lastFiredAt = this.cooldowns.get(card.id) ?? -Infinity
      const elapsedSec  = (nowMs - lastFiredAt) / 1000
      if (elapsedSec < card.logicTrigger.cooldown) continue

      this.cooldowns.set(card.id, nowMs)
      fired.push({
        cardId:   card.id,
        cardName: card.name,
        action:   card.logicTrigger.action,
      })
    }

    return fired
  }

  resetCooldowns(): void {
    this.cooldowns.clear()
  }
}
