import type { ShipFrame, ShipBaseStats, UpgradeCard } from '../types'
import type { TagPool } from './TagAggregator'

export type ComputedStats = ShipBaseStats

// Per-tag bonus applied once per tag instance in the aggregator pool
const PER_TAG_BONUS: Record<string, { stat: string; type: 'flat' | 'percent'; value: number }[]> = {
  HULL:             [{ stat: 'HULL',             type: 'flat',    value: 500  }],
  ARMOR:            [{ stat: 'ARMOR',            type: 'percent', value: 4    }],
  SHIELD_MAX:       [{ stat: 'SHIELD_MAX',       type: 'flat',    value: 300  }],
  SHIELD_REGEN:     [{ stat: 'SHIELD_REGEN',     type: 'flat',    value: 20   }],
  SHIELD_DELAY:     [{ stat: 'SHIELD_DELAY',     type: 'flat',    value: -0.3 }],
  TOP_SPEED:        [{ stat: 'TOP_SPEED',        type: 'flat',    value: 30   }],
  ACCELERATION:     [{ stat: 'ACCELERATION',     type: 'flat',    value: 25   }],
  TURN_SPEED:       [{ stat: 'TURN_SPEED',       type: 'flat',    value: 20   }],
  EVASION:          [{ stat: 'EVASION',          type: 'flat',    value: 3    }],
  HEAT_DISSIPATION: [{ stat: 'HEAT_DISSIPATION', type: 'flat',    value: 8    }],
  ENERGY_GRID:      [{ stat: 'ENERGY_GRID',      type: 'flat',    value: 40   }],
  ENERGY_REGEN:     [{ stat: 'ENERGY_REGEN',     type: 'flat',    value: 5    }],
  REPAIR_RATE:      [{ stat: 'REPAIR_RATE',      type: 'flat',    value: 5    }],
  WEIGHT_CAPACITY:  [{ stat: 'WEIGHT_CAPACITY',  type: 'flat',    value: 20   }],
  HEAT_CAPACITY:    [{ stat: 'HEAT_CAPACITY',    type: 'flat',    value: 10   }],
}

const STAT_CAPS: Record<string, number> = {
  ARMOR:   60,  // % hard cap
  EVASION: 45,  // % hard cap
}

export class StatCalculator {
  compute(ship: ShipFrame, tags: TagPool, upgrades: UpgradeCard[], totalEquipmentWeight = 0): ComputedStats {
    const stats: Record<string, number> = { ...ship.baseStats }

    // 1. Flat modifiers from drafted upgrades
    for (const card of upgrades) {
      for (const mod of card.statModifiers) {
        if (mod.type === 'flat') {
          stats[mod.stat] = (stats[mod.stat] ?? 0) + mod.value
        }
      }
    }

    // 2. Flat bonuses from tag pool
    for (const [tag, count] of Object.entries(tags)) {
      const bonuses = PER_TAG_BONUS[tag]
      if (!bonuses) continue
      for (const bonus of bonuses) {
        if (bonus.type === 'flat') {
          stats[bonus.stat] = (stats[bonus.stat] ?? 0) + bonus.value * count
        }
      }
    }

    // 3. Percent modifiers from drafted upgrades
    for (const card of upgrades) {
      for (const mod of card.statModifiers) {
        if (mod.type === 'percent') {
          stats[mod.stat] = (stats[mod.stat] ?? 0) * (1 + mod.value / 100)
        }
      }
    }

    // 4. Percent bonuses from tag pool (compounding)
    for (const [tag, count] of Object.entries(tags)) {
      const bonuses = PER_TAG_BONUS[tag]
      if (!bonuses) continue
      for (const bonus of bonuses) {
        if (bonus.type === 'percent') {
          stats[bonus.stat] = (stats[bonus.stat] ?? 0) * Math.pow(1 + bonus.value / 100, count)
        }
      }
    }

    // 5. Weight penalty — applies only when total equipment weight exceeds capacity.
    //    Curve: penalty = 1 / (1 + overfill²)
    //    Under capacity → no penalty. At 50% over → ×0.80. At 100% over → ×0.50.
    if (totalEquipmentWeight > 0) {
      const capacity = stats['WEIGHT_CAPACITY'] ?? 100
      if (totalEquipmentWeight > capacity) {
        const overfill = (totalEquipmentWeight - capacity) / capacity
        const penalty  = 1 / (1 + overfill * overfill)
        stats['TOP_SPEED']    = (stats['TOP_SPEED']    ?? 0) * penalty
        stats['ACCELERATION'] = (stats['ACCELERATION'] ?? 0) * penalty
        stats['TURN_SPEED']   = (stats['TURN_SPEED']   ?? 0) * penalty
      }
    }

    // 6. Caps and floor
    for (const [stat, cap] of Object.entries(STAT_CAPS)) {
      if (stats[stat] !== undefined) stats[stat] = Math.min(stats[stat], cap)
    }
    for (const key of Object.keys(stats)) {
      stats[key] = Math.max(0, stats[key])
    }

    return stats as unknown as ComputedStats
  }

  // Convenience: compute the mobility penalty multiplier for display purposes
  weightPenalty(totalEquipmentWeight: number, weightCapacity: number): number {
    if (totalEquipmentWeight <= weightCapacity) return 1
    const overfill = (totalEquipmentWeight - weightCapacity) / weightCapacity
    return 1 / (1 + overfill * overfill)
  }
}
