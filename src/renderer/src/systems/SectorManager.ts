const MAX_SECTOR = 50

export class SectorManager {
  private _sector      = 1
  private _totalKills  = 0

  get sector(): number { return this._sector }

  /** Advance to the next sector. Returns the new sector number. */
  advance(): number {
    this._sector = Math.min(this._sector + 1, MAX_SECTOR)
    return this._sector
  }

  get atMaxSector(): boolean { return this._sector >= MAX_SECTOR }

  /** HP/shield scale: +15% per sector */
  get hpScale(): number { return 1 + (this._sector - 1) * 0.15 }

  /** Speed scale: +5% per sector, capped at +50% */
  get speedScale(): number { return Math.min(1 + (this._sector - 1) * 0.05, 1.5) }

  /** Fire rate scale: +8% per sector, capped at 2× */
  get rofScale(): number { return Math.min(1 + (this._sector - 1) * 0.08, 2.0) }

  get totalKills(): number { return this._totalKills }

  addKill(): void { this._totalKills++ }

  // Grid colour per sector tier
  getGridColor(): number {
    const s = this._sector
    if (s <= 5)  return 0x003366  // deep blue
    if (s <= 10) return 0x1a0033  // dark purple
    if (s <= 15) return 0x332200  // dark amber
    if (s <= 20) return 0x330000  // deep red
    return 0x001a22               // void teal
  }

  /**
   * Enemy wave definition for the current sector.
   * Sector 1 is deliberately sparse — ramp increases with each tier.
   */
  getSpawnWave(): { id: string; count: number }[] {
    const s = this._sector

    if (s === 1) return [
      { id: 'scout_drone',     count: 100 }, // TEMP: stress test
      { id: 'asteroid_medium', count: 2 },
      { id: 'asteroid_small',  count: 1 },
    ]
    if (s <= 3) return [
      { id: 'scout_drone',     count: 4 },
      { id: 'attack_drone',    count: 1 },
      { id: 'asteroid_large',  count: 2 },
      { id: 'asteroid_medium', count: 2 },
    ]
    if (s <= 6) return [
      { id: 'scout_drone',     count: 5 },
      { id: 'attack_drone',    count: 2 },
      { id: 'asteroid_xl',     count: 2 },
      { id: 'asteroid_large',  count: 3 },
      { id: 'asteroid_medium', count: 2 },
    ]
    if (s <= 10) return [
      { id: 'scout_drone',     count: 6 },
      { id: 'attack_drone',    count: 3 },
      { id: 'turret',          count: 1 },
      { id: 'asteroid_xl',     count: 3 },
      { id: 'asteroid_large',  count: 4 },
      { id: 'asteroid_medium', count: 3 },
    ]
    if (s <= 20) return [
      { id: 'scout_drone',     count: 7 },
      { id: 'attack_drone',    count: 4 },
      { id: 'turret',          count: 2 },
      { id: 'asteroid_xl',     count: 4 },
      { id: 'asteroid_large',  count: 4 },
      { id: 'asteroid_medium', count: 3 },
    ]
    return [
      { id: 'scout_drone',     count: 8 },
      { id: 'attack_drone',    count: 5 },
      { id: 'turret',          count: 3 },
      { id: 'asteroid_xl',     count: 5 },
      { id: 'asteroid_large',  count: 5 },
      { id: 'asteroid_medium', count: 4 },
    ]
  }
}
