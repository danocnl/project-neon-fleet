import type { ShipFrame, ClassSpecialization, UpgradeCard } from '../types'
import type { TagAggregator } from './TagAggregator'

// Tier rarity multipliers — lower tiers appear more often unless prerequisites are met
const TIER_WEIGHT: Record<number, number> = { 1: 4, 2: 2, 3: 1, 4: 0.5, 5: 0.25 }

export class DraftEngine {
  generateOffer(
    allCards: UpgradeCard[],
    aggregator: TagAggregator,
    ship: ShipFrame,
    classSpec: ClassSpecialization,
    drafted: Set<string>,
    count = 4
  ): UpgradeCard[] {
    // Build combined tag weight map from ship + class
    const combined: Record<string, number> = {}
    for (const [tag, w] of Object.entries(ship.tagWeighting)) {
      combined[tag] = (combined[tag] ?? 0) + w
    }
    for (const [tag, w] of Object.entries(classSpec.tagWeighting)) {
      combined[tag] = (combined[tag] ?? 0) + w
    }

    // Filter to eligible cards
    const eligible = allCards.filter(card => {
      if (drafted.has(card.id)) return false
      if (!aggregator.meetsPrerequisites(card)) return false
      if (card.classRestriction && card.classRestriction !== classSpec.id) return false
      return true
    })

    // Assign weights
    const weighted = eligible.map(card => {
      let tagScore = 0
      for (const tag of card.associatedTags) {
        tagScore += combined[tag] ?? 0
      }
      // +1 ensures every eligible card has a non-zero floor weight
      const weight = (tagScore + 1) * (TIER_WEIGHT[card.tier] ?? 1)
      return { card, weight }
    })

    // Weighted random selection without replacement
    const selected: UpgradeCard[] = []
    const pool = [...weighted]

    for (let i = 0; i < Math.min(count, pool.length); i++) {
      const total = pool.reduce((sum, item) => sum + item.weight, 0)
      let roll = Math.random() * total
      for (let j = 0; j < pool.length; j++) {
        roll -= pool[j].weight
        if (roll <= 0) {
          selected.push(pool[j].card)
          pool.splice(j, 1)
          break
        }
      }
    }

    return selected
  }
}
