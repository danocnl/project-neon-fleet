const SAVE_KEY = 'neon_fleet_save_v1'

export interface SaveData {
  credits:      number
  totalKills:   number
  totalRuns:    number
  highestLevel: number
  // Last run — skip selection on quick relaunch
  lastPilot?:   string
  lastShipId?:  string
  lastClassId?: string
  // Armory navigation pending
  armoryPending?: { pilot: string; shipId: string; classId: string }
  // Permanent inventory
  inventory?: { weapons: string[]; modules: string[] }
  // Per-ship equipped loadouts (overrides defaults when set)
  loadouts?: Record<string, { weapons: string[]; modules: string[] }>
}

const DEFAULTS: SaveData = {
  credits:      200,
  totalKills:   0,
  totalRuns:    0,
  highestLevel: 0,
  inventory:    { weapons: [], modules: [] },
  loadouts:     {},
}

export class SaveManager {
  static load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as SaveData
        return {
          ...DEFAULTS,
          ...parsed,
          inventory: { weapons: [], modules: [], ...(parsed.inventory ?? {}) },
          loadouts:  { ...(parsed.loadouts ?? {}) },
        }
      }
    } catch {}
    return { ...DEFAULTS, inventory: { weapons: [], modules: [] }, loadouts: {} }
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

  // ─── Last run (quick relaunch) ────────────────────────────────────────────

  static saveLastRun(pilot: string, shipId: string, classId: string): void {
    const d = this.load()
    d.lastPilot = pilot; d.lastShipId = shipId; d.lastClassId = classId
    this.save(d)
  }

  static getLastRun(): { pilot: string; shipId: string; classId: string } | null {
    const d = this.load()
    if (d.lastPilot && d.lastShipId && d.lastClassId)
      return { pilot: d.lastPilot, shipId: d.lastShipId, classId: d.lastClassId }
    return null
  }

  static clearLastRun(): void {
    const d = this.load()
    delete d.lastPilot; delete d.lastShipId; delete d.lastClassId
    this.save(d)
  }

  // ─── Armory navigation pending ────────────────────────────────────────────

  static setArmoryPending(pilot: string, shipId: string, classId: string): void {
    const d = this.load()
    d.armoryPending = { pilot, shipId, classId }
    this.save(d)
  }

  static getArmoryPending(): { pilot: string; shipId: string; classId: string } | null {
    return this.load().armoryPending ?? null
  }

  static clearArmoryPending(): void {
    const d = this.load()
    delete d.armoryPending
    this.save(d)
  }

  // ─── Inventory ────────────────────────────────────────────────────────────

  static getInventory(): { weapons: string[]; modules: string[] } {
    const d = this.load()
    return d.inventory ?? { weapons: [], modules: [] }
  }

  static isOwned(id: string, type: 'weapon' | 'module'): boolean {
    const inv = this.getInventory()
    return type === 'weapon' ? inv.weapons.includes(id) : inv.modules.includes(id)
  }

  static buyItem(id: string, type: 'weapon' | 'module', price: number): boolean {
    const d = this.load()
    if (d.credits < price) return false
    d.credits -= price
    if (!d.inventory) d.inventory = { weapons: [], modules: [] }
    if (type === 'weapon' && !d.inventory.weapons.includes(id)) d.inventory.weapons.push(id)
    if (type === 'module' && !d.inventory.modules.includes(id)) d.inventory.modules.push(id)
    this.save(d)
    return true
  }

  // ─── Per-ship loadouts ────────────────────────────────────────────────────

  static getLoadout(shipId: string): { weapons: string[]; modules: string[] } | null {
    const d = this.load()
    return d.loadouts?.[shipId] ?? null
  }

  static setLoadout(shipId: string, weapons: string[], modules: string[]): void {
    const d = this.load()
    if (!d.loadouts) d.loadouts = {}
    d.loadouts[shipId] = { weapons, modules }
    this.save(d)
  }
}
