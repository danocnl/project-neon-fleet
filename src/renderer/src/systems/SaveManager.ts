const SAVE_KEY = 'neon_fleet_save_v1'

export interface SaveData {
  credits:    number
  totalKills: number
  totalRuns:  number
  highestLevel: number
}

const DEFAULTS: SaveData = {
  credits:      200,   // starting credits — enough to cover the first repair
  totalKills:   0,
  totalRuns:    0,
  highestLevel: 0,
}

export class SaveManager {
  static load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
    } catch {}
    return { ...DEFAULTS }
  }

  static save(data: SaveData): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  }

  static applyRunResult(creditsEarned: number, kills: number, levelReached: number): SaveData {
    const d = this.load()
    d.credits      += creditsEarned
    d.totalKills   += kills
    d.totalRuns    += 1
    d.highestLevel  = Math.max(d.highestLevel, levelReached)
    this.save(d)
    return d
  }

  static spendCredits(amount: number): { success: boolean; data: SaveData } {
    const d = this.load()
    if (d.credits < amount) return { success: false, data: d }
    d.credits -= amount
    this.save(d)
    return { success: true, data: d }
  }

  // Repair cost = 12% of ship max hull
  static repairCost(maxHull: number): number {
    return Math.round(maxHull * 0.12)
  }
}
