import type { ShipFrame, WeaponSize } from '../types'

const SAVE_KEY = 'neon_fleet_save_v1'
const MODULE_MAX_LEVEL = 20

export interface SaveData {
  credits:        number
  totalKills:     number
  totalRuns:      number
  highestLevel:   number
  highestSector?: number
  // Quick-relaunch
  lastPilot?:   string
  lastShipId?:  string
  lastClassId?: string
  // Armory navigation pending
  armoryPending?: { pilot: string; shipId: string; classId: string }
  // Weapon inventory (no levels)
  weaponInventory: string[]
  // Module inventory with levels: moduleId → level (1-5)
  moduleInventory: Record<string, number>
  // Per-ship equipped modules (moduleIds in slots)
  equippedModules: Record<string, string[]>
  // Legacy field — migrated on load
  inventory?: { weapons?: string[]; modules?: string[] }
}

const DEFAULTS: SaveData = {
  credits:        200,
  totalKills:     0,
  totalRuns:      0,
  highestLevel:   0,
  weaponInventory: [],
  moduleInventory: {},
  equippedModules: {},
}

export class SaveManager {
  static load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as SaveData & { inventory?: { weapons?: string[]; modules?: string[] } }

        // Migrate legacy flat inventory
        const weaponInv: string[] = parsed.weaponInventory ?? parsed.inventory?.weapons ?? []
        const modInv: Record<string, number> = parsed.moduleInventory ?? {}

        // Migrate old modules array to level-1 entries
        const legacyMods: string[] = (parsed.inventory?.modules as string[] | undefined) ?? []
        for (const id of legacyMods) {
          if (!modInv[id]) modInv[id] = 1
        }

        return {
          ...DEFAULTS,
          ...parsed,
          weaponInventory: weaponInv,
          moduleInventory: modInv,
          equippedModules: parsed.equippedModules ?? {},
          inventory: undefined,
        }
      }
    } catch {}
    return { ...DEFAULTS }
  }

  static save(data: SaveData): void {
    const toSave = { ...data, inventory: undefined }
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave))
  }

  // ─── Run results ─────────────────────────────────────────────────────────────

  static applyRunResult(creditsEarned: number, kills: number, levelReached: number, sectorReached = 1): SaveData {
    const d = this.load()
    d.credits      += creditsEarned
    d.totalKills    += kills
    d.totalRuns     += 1
    d.highestLevel   = Math.max(d.highestLevel, levelReached)
    d.highestSector  = Math.max(d.highestSector ?? 1, sectorReached)
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

  // ─── Last run (quick relaunch) ────────────────────────────────────────────────

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

  // ─── Armory navigation ────────────────────────────────────────────────────────

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

  // ─── Weapon inventory (no levels) ─────────────────────────────────────────────

  static isWeaponOwned(id: string): boolean {
    return this.load().weaponInventory.includes(id)
  }

  static buyWeapon(id: string, price: number): boolean {
    const d = this.load()
    if (d.credits < price || d.weaponInventory.includes(id)) return false
    d.credits -= price
    d.weaponInventory.push(id)
    this.save(d)
    return true
  }

  // Legacy alias used by ArmoryScene
  static isOwned(id: string, type: 'weapon' | 'module'): boolean {
    return type === 'weapon' ? this.isWeaponOwned(id) : this.getModuleLevel(id) > 0
  }

  static buyItem(id: string, type: 'weapon' | 'module', price: number): boolean {
    return type === 'weapon' ? this.buyWeapon(id, price) : this.buyOrUpgradeModule(id, price) !== false
  }

  // ─── Module inventory (levelled) ──────────────────────────────────────────────

  static getModuleInventory(): Record<string, number> {
    return { ...this.load().moduleInventory }
  }

  static getModuleLevel(id: string): number {
    return this.load().moduleInventory[id] ?? 0
  }

  static getModuleUpgradePrice(id: string, basePrice: number): number {
    const level = this.getModuleLevel(id)
    return Math.round(basePrice * (1 + level * 0.5))
  }

  static buyOrUpgradeModule(id: string, basePrice: number): number | false {
    const d = this.load()
    const currentLevel = d.moduleInventory[id] ?? 0
    if (currentLevel >= MODULE_MAX_LEVEL) return false
    const cost = Math.round(basePrice * (1 + currentLevel * 0.5))
    if (d.credits < cost) return false
    d.credits -= cost
    d.moduleInventory[id] = currentLevel + 1
    this.save(d)
    return currentLevel + 1
  }

  // ─── Equipped modules per ship ────────────────────────────────────────────────

  static getEquippedModules(shipId: string): string[] {
    return [...(this.load().equippedModules[shipId] ?? [])]
  }

  /**
   * Equip a module to a ship slot.
   * Caller must pass moduleSize and equippedSizeCounts (from DataLoader, to avoid circular deps).
   * equippedSizeCounts: how many modules of each size are already equipped.
   */
  static equipModule(
    shipId: string,
    moduleId: string,
    moduleSize: WeaponSize,
    ship: ShipFrame,
    equippedSizeCounts: Record<string, number>
  ): boolean {
    const d = this.load()
    if ((d.moduleInventory[moduleId] ?? 0) === 0) return false

    const slotKey = `MODULE_SLOT_${moduleSize}` as keyof typeof ship.baseStats
    const maxSlots = (ship.baseStats as unknown as Record<string, number>)[slotKey] ?? 0
    const usedSlots = equippedSizeCounts[moduleSize] ?? 0
    if (usedSlots >= maxSlots) return false

    const equipped = d.equippedModules[shipId] ?? []
    equipped.push(moduleId)
    d.equippedModules[shipId] = equipped
    this.save(d)
    return true
  }

  static unequipModule(shipId: string, moduleId: string): void {
    const d = this.load()
    const equipped = d.equippedModules[shipId] ?? []
    const idx = equipped.indexOf(moduleId)
    if (idx !== -1) {
      equipped.splice(idx, 1)
      d.equippedModules[shipId] = equipped
      this.save(d)
    }
  }

  /** All owned modules NOT equipped on any ship */
  static getStorageModules(): string[] {
    const d = this.load()
    const allEquipped = new Set<string>()
    for (const arr of Object.values(d.equippedModules)) {
      arr.forEach(id => allEquipped.add(id))
    }
    const owned = Object.keys(d.moduleInventory).filter(id => (d.moduleInventory[id] ?? 0) > 0)
    // A module can be equipped ONCE per equip; track by position not id to handle duplicates
    // For simplicity: storage = owned - equipped (remove one entry per equip)
    const equippedList: string[] = []
    for (const arr of Object.values(d.equippedModules)) equippedList.push(...arr)

    const remaining = [...owned]
    const storage: string[] = []
    for (const id of remaining) {
      const ei = equippedList.indexOf(id)
      if (ei !== -1) {
        equippedList.splice(ei, 1) // consume one equipped slot
      } else {
        storage.push(id)
      }
    }
    return storage
  }

  // ─── Per-ship weapon loadout ───────────────────────────────────────────────────

  static getLoadout(shipId: string): { weapons: string[]; modules: string[] } | null {
    const d = this.load()
    const equipped = d.equippedModules?.[shipId]
    const hasModules = equipped && equipped.length > 0
    const hasWeapons = d.weaponInventory && d.weaponInventory.length > 0

    if (!hasModules && !hasWeapons) return null

    return {
      weapons: d.weaponInventory.length > 0 ? d.weaponInventory : [],
      modules: equipped ?? [],
    }
  }

  static setLoadout(shipId: string, weapons: string[], modules: string[]): void {
    const d = this.load()
    d.equippedModules[shipId] = modules
    this.save(d)
  }
}
