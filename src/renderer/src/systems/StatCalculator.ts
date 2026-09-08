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
  REPAIR_RATE:      [{ stat: 'REPAIR_RATE',      type: 'flat',    value: 5    }],
}

const STAT_CAPS: Record<string, number> = {
  ARMOR:   60,  // % hard cap
  EVASION: 45,  // % hard cap
}

export class StatCalculator {
  compute(ship: ShipFrame, tags: TagPool, upgrades: UpgradeCard[]): ComputedStats {
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

    // 3. Percent modifiers from drafted upgrades (applied to post-flat value)
    for (const card of upgrades) {
      for (const mod of card.statModifiers) {
        if (mod.type === 'percent') {
          stats[mod.stat] = (stats[mod.stat] ?? 0) * (1 + mod.value / 100)
        }
      }
    }

    // 4. Percent bonuses from tag pool (compounding per tag instance)
    for (const [tag, count] of Object.entries(tags)) {
      const bonuses = PER_TAG_BONUS[tag]
      if (!bonuses) continue
      for (const bonus of bonuses) {
        if (bonus.type === 'percent') {
          stats[bonus.stat] = (stats[bonus.stat] ?? 0) * Math.pow(1 + bonus.value / 100, count)
        }
      }
    }

    // 5. Apply caps and floor at 0
    for (const [stat, cap] of Object.entries(STAT_CAPS)) {
      if (stats[stat] !== undefined) stats[stat] = Math.min(stats[stat], cap)
    }
    for (const key of Object.keys(stats)) {
      stats[key] = Math.max(0, stats[key])
    }

    return stats as unknown as ComputedStats
  }
}
