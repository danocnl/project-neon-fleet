import type { ShipFrame, WeaponSize } from '../types'

// ─── Environment detection ────────────────────────────────────────────────────

interface ElectronSaveAPI {
  read:   (slot: number)                => Promise<unknown>
  write:  (slot: number, data: unknown) => Promise<void>
  delete: (slot: number)               => Promise<void>
}

function electronAPI(): ElectronSaveAPI | null {
  return (window as unknown as { saveAPI?: ElectronSaveAPI }).saveAPI ?? null
}

// ─── Storage constants ────────────────────────────────────────────────────────

const LEGACY_KEY      = 'neon_fleet_save_v1'
const LS_SLOT_KEY     = (n: number) => `neon_fleet_save_v2_slot_${n}`
const SESSION_KEY     = 'neon_active_slot'
const SLOT_COUNT      = 3
const MODULE_MAX_LEVEL = 20

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SaveData {
  credits:          number
  totalKills:       number
  totalRuns:        number
  highestLevel:     number
  highestSector?:   number
  lastPlayed?:      number
  lastPilot?:       string
  lastShipId?:      string
  lastClassId?:     string
  relaunchPending?: boolean
  armoryPending?:   { pilot: string; shipId: string; classId: string }
  weaponInventory:  string[]
  moduleInventory:  Record<string, number>
  equippedModules:  Record<string, string[]>
  inventory?:       { weapons?: string[]; modules?: string[] }
}

const DEFAULTS: SaveData = {
  credits:         200,
  totalKills:      0,
  totalRuns:       0,
  highestLevel:    0,
  weaponInventory: [],
  moduleInventory: {},
  equippedModules: {},
}

function migrate(raw: unknown): SaveData {
  const r = raw as SaveData & { inventory?: { weapons?: string[]; modules?: string[] } }
  const weaponInv  = r.weaponInventory ?? r.inventory?.weapons ?? []
  const modInv: Record<string, number> = r.moduleInventory ?? {}
  const legacyMods: string[] = (r.inventory?.modules as string[] | undefined) ?? []
  for (const id of legacyMods) { if (!modInv[id]) modInv[id] = 1 }
  return { ...DEFAULTS, ...r, weaponInventory: weaponInv, moduleInventory: modInv,
    equippedModules: r.equippedModules ?? {}, inventory: undefined }
}

// ─── In-memory cache ──────────────────────────────────────────────────────────
// Populated once by SaveManager.init(). All synchronous reads hit the cache;
// writes update the cache and fire an async persist in the background.

const _cache = new Map<number, SaveData | null>()

// ─── SaveManager ─────────────────────────────────────────────────────────────

export class SaveManager {

  // ─── Init (call once before Phaser starts) ─────────────────────────────────

  static async init(): Promise<void> {
    const api = electronAPI()
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (api) {
        // Electron: read from file
        const data = await api.read(i)
        _cache.set(i, data ? migrate(data) : null)
      } else {
        // Browser dev: read from localStorage (with legacy migration on slot 0)
        _cache.set(i, this._lsLoad(i))
      }
    }
  }

  // ─── Slot management ──────────────────────────────────────────────────────

  static hasActiveSession(): boolean {
    return sessionStorage.getItem(SESSION_KEY) !== null
  }

  static getActiveSlot(): number {
    const s = sessionStorage.getItem(SESSION_KEY)
    return s !== null ? parseInt(s, 10) : 0
  }

  static setActiveSlot(n: number): void {
    sessionStorage.setItem(SESSION_KEY, String(n))
  }

  static getAllSlots(): Array<SaveData | null> {
    return Array.from({ length: SLOT_COUNT }, (_, i) => _cache.get(i) ?? null)
  }

  static loadSlot(n: number): SaveData | null {
    return _cache.get(n) ?? null
  }

  static deleteSlot(n: number): void {
    _cache.set(n, null)
    const api = electronAPI()
    if (api) {
      api.delete(n).catch(console.error)
    } else {
      localStorage.removeItem(LS_SLOT_KEY(n))
    }
  }

  // ─── Active-slot load / save (synchronous via cache) ──────────────────────

  static load(): SaveData {
    return this.loadSlot(this.getActiveSlot()) ?? { ...DEFAULTS }
  }

  static save(data: SaveData): void {
    const slot   = this.getActiveSlot()
    const toSave = { ...data, inventory: undefined, lastPlayed: Date.now() }
    _cache.set(slot, toSave)
    this._persist(slot, toSave)
  }

  // ─── Pilot config (persistent) ────────────────────────────────────────────

  static savePilotConfig(pilot: string, shipId: string, classId: string): void {
    const d = this.load()
    d.lastPilot = pilot; d.lastShipId = shipId; d.lastClassId = classId
    this.save(d)
  }

  static getSavedConfig(): { pilot: string; shipId: string; classId: string } | null {
    const d = this.load()
    const hasData = d.totalRuns > 0 || d.credits !== DEFAULTS.credits ||
                    d.weaponInventory.length > 0 || Object.keys(d.moduleInventory).length > 0
    if (!hasData) return null
    return {
      pilot:   d.lastPilot   ?? 'PILOT',
      shipId:  d.lastShipId  ?? 'sidewinder',
      classId: d.lastClassId ?? 'chrono_architect',
    }
  }

  // ─── Quick relaunch ───────────────────────────────────────────────────────

  static saveLastRun(pilot: string, shipId: string, classId: string): void {
    const d = this.load()
    d.lastPilot = pilot; d.lastShipId = shipId; d.lastClassId = classId
    d.relaunchPending = true
    this.save(d)
  }

  static getLastRun(): { pilot: string; shipId: string; classId: string } | null {
    const d = this.load()
    if (d.relaunchPending && d.lastPilot && d.lastShipId && d.lastClassId)
      return { pilot: d.lastPilot, shipId: d.lastShipId, classId: d.lastClassId }
    return null
  }

  static clearLastRun(): void {
    const d = this.load(); delete d.relaunchPending; this.save(d)
  }

  // ─── Run results ──────────────────────────────────────────────────────────

  static applyRunResult(creditsEarned: number, kills: number, levelReached: number, sectorReached = 1): SaveData {
    const d = this.load()
    d.credits      += creditsEarned
    d.totalKills   += kills
    d.totalRuns    += 1
    d.highestLevel  = Math.max(d.highestLevel, levelReached)
    d.highestSector = Math.max(d.highestSector ?? 1, sectorReached)
    this.save(d)
    return d
  }

  static spendCredits(amount: number): { success: boolean; data: SaveData } {
    const d = this.load()
    if (d.credits < amount) return { success: false, data: d }
    d.credits -= amount; this.save(d)
    return { success: true, data: d }
  }

  static repairCost(maxHull: number): number { return Math.round(maxHull * 0.05) }

  // ─── Armory navigation ────────────────────────────────────────────────────

  static setArmoryPending(pilot: string, shipId: string, classId: string): void {
    const d = this.load(); d.armoryPending = { pilot, shipId, classId }; this.save(d)
  }

  static getArmoryPending(): { pilot: string; shipId: string; classId: string } | null {
    return this.load().armoryPending ?? null
  }

  static clearArmoryPending(): void {
    const d = this.load(); delete d.armoryPending; this.save(d)
  }

  // ─── Weapon inventory ─────────────────────────────────────────────────────

  static isWeaponOwned(id: string): boolean { return this.load().weaponInventory.includes(id) }

  static buyWeapon(id: string, price: number): boolean {
    const d = this.load()
    if (d.credits < price || d.weaponInventory.includes(id)) return false
    d.credits -= price; d.weaponInventory.push(id); this.save(d)
    return true
  }

  static isOwned(id: string, type: 'weapon' | 'module'): boolean {
    return type === 'weapon' ? this.isWeaponOwned(id) : this.getModuleLevel(id) > 0
  }

  static buyItem(id: string, type: 'weapon' | 'module', price: number): boolean {
    return type === 'weapon' ? this.buyWeapon(id, price) : this.buyOrUpgradeModule(id, price) !== false
  }

  // ─── Module inventory ─────────────────────────────────────────────────────

  static getModuleInventory(): Record<string, number> { return { ...this.load().moduleInventory } }
  static getModuleLevel(id: string): number { return this.load().moduleInventory[id] ?? 0 }

  static getModuleUpgradePrice(id: string, basePrice: number): number {
    return Math.round(basePrice * (1 + this.getModuleLevel(id) * 0.5))
  }

  static buyOrUpgradeModule(id: string, basePrice: number): number | false {
    const d = this.load()
    const cur = d.moduleInventory[id] ?? 0
    if (cur >= MODULE_MAX_LEVEL) return false
    const cost = Math.round(basePrice * (1 + cur * 0.5))
    if (d.credits < cost) return false
    d.credits -= cost; d.moduleInventory[id] = cur + 1; this.save(d)
    return cur + 1
  }

  // ─── Equipped modules ─────────────────────────────────────────────────────

  static getEquippedModules(shipId: string): string[] {
    return [...(this.load().equippedModules[shipId] ?? [])]
  }

  static equipModule(
    shipId: string, moduleId: string, moduleSize: WeaponSize,
    ship: ShipFrame, equippedSizeCounts: Record<string, number>
  ): boolean {
    const d = this.load()
    if ((d.moduleInventory[moduleId] ?? 0) === 0) return false
    const slotKey  = `MODULE_SLOT_${moduleSize}` as keyof typeof ship.baseStats
    const maxSlots = (ship.baseStats as unknown as Record<string, number>)[slotKey] ?? 0
    if ((equippedSizeCounts[moduleSize] ?? 0) >= maxSlots) return false
    const equipped = d.equippedModules[shipId] ?? []
    equipped.push(moduleId); d.equippedModules[shipId] = equipped; this.save(d)
    return true
  }

  static unequipModule(shipId: string, moduleId: string): void {
    const d = this.load()
    const equipped = d.equippedModules[shipId] ?? []
    const idx = equipped.indexOf(moduleId)
    if (idx !== -1) { equipped.splice(idx, 1); d.equippedModules[shipId] = equipped; this.save(d) }
  }

  static getStorageModules(): string[] {
    const d = this.load()
    const equippedList: string[] = []
    for (const arr of Object.values(d.equippedModules)) equippedList.push(...arr)
    const owned = Object.keys(d.moduleInventory).filter(id => (d.moduleInventory[id] ?? 0) > 0)
    const storage: string[] = []
    for (const id of owned) {
      const ei = equippedList.indexOf(id)
      if (ei !== -1) { equippedList.splice(ei, 1) } else { storage.push(id) }
    }
    return storage
  }

  // ─── Loadout ──────────────────────────────────────────────────────────────

  static getLoadout(shipId: string): { weapons: string[]; modules: string[] } | null {
    const d = this.load()
    const equipped = d.equippedModules?.[shipId]
    if ((!equipped || equipped.length === 0) && d.weaponInventory.length === 0) return null
    return { weapons: d.weaponInventory.length > 0 ? d.weaponInventory : [], modules: equipped ?? [] }
  }

  static setLoadout(shipId: string, _weapons: string[], modules: string[]): void {
    const d = this.load(); d.equippedModules[shipId] = modules; this.save(d)
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private static _persist(slot: number, data: SaveData): void {
    const api = electronAPI()
    if (api) {
      api.write(slot, data).catch(console.error)
    } else {
      try { localStorage.setItem(LS_SLOT_KEY(slot), JSON.stringify(data)) } catch {}
    }
  }

  private static _lsLoad(n: number): SaveData | null {
    // One-time migration: move legacy v1 key into slot 0
    if (n === 0 && !localStorage.getItem(LS_SLOT_KEY(0))) {
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        localStorage.setItem(LS_SLOT_KEY(0), legacy)
        localStorage.removeItem(LEGACY_KEY)
      }
    }
    try {
      const raw = localStorage.getItem(LS_SLOT_KEY(n))
      if (raw) return migrate(JSON.parse(raw))
    } catch {}
    return null
  }
}
