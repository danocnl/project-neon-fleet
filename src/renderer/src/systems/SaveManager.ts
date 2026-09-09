const SAVE_KEY = 'neon_fleet_save_v1'

export interface SaveData {
  credits:      number
  totalKills:   number
  totalRuns:    number
  highestLevel: number
  // Last run — used to skip selection screen on quick relaunch
  lastPilot?:   string
  lastShipId?:  string
  lastClassId?: string
}

const DEFAULTS: SaveData = {
  credits:      200,
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

  static repairCost(maxHull: number): number {
    return Math.round(maxHull * 0.05)
  }

  static saveLastRun(pilot: string, shipId: string, classId: string): void {
    const d = this.load()
    d.lastPilot   = pilot
    d.lastShipId  = shipId
    d.lastClassId = classId
    this.save(d)
  }

  static getLastRun(): { pilot: string; shipId: string; classId: string } | null {
    const d = this.load()
    if (d.lastPilot && d.lastShipId && d.lastClassId) {
      return { pilot: d.lastPilot, shipId: d.lastShipId, classId: d.lastClassId }
    }
    return null
  }

  static clearLastRun(): void {
    const d = this.load()
    delete d.lastPilot; delete d.lastShipId; delete d.lastClassId
    this.save(d)
  }
}
