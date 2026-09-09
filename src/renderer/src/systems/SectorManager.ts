const KILLS_PER_SECTOR = 25
const MAX_SECTOR = 50

export class SectorManager {
  private _totalKills = 0

  get sector(): number {
    return Math.min(1 + Math.floor(this._totalKills / KILLS_PER_SECTOR), MAX_SECTOR)
  }

  /** HP/shield scale: +15% per sector */
  get hpScale(): number { return 1 + (this.sector - 1) * 0.15 }

  /** Speed scale: +5% per sector, capped at +50% */
  get speedScale(): number { return Math.min(1 + (this.sector - 1) * 0.05, 1.5) }

  /** Fire rate scale: +8% per sector, capped at 2× */
  get rofScale(): number { return Math.min(1 + (this.sector - 1) * 0.08, 2.0) }

  /** Progress within current sector (0.0–1.0) */
  get sectorProgress(): number {
    return (this._totalKills % KILLS_PER_SECTOR) / KILLS_PER_SECTOR
  }

  get totalKills(): number { return this._totalKills }

  addKill(): void { this._totalKills++ }

  getSpawnWave(): { id: string; count: number }[] {
    const s = this.sector
    if (s <= 2)  return [
      { id: 'asteroid_xl', count: 2 }, { id: 'asteroid_large', count: 2 }, { id: 'scout_drone', count: 1 },
    ]
    if (s <= 5)  return [
      { id: 'asteroid_xl', count: 3 }, { id: 'asteroid_large', count: 2 }, { id: 'asteroid_medium', count: 2 },
      { id: 'scout_drone', count: 2 }, { id: 'attack_drone', count: 1 },
    ]
    if (s <= 10) return [
      { id: 'asteroid_xl', count: 4 }, { id: 'asteroid_large', count: 3 }, { id: 'asteroid_medium', count: 2 },
      { id: 'scout_drone', count: 3 }, { id: 'attack_drone', count: 2 }, { id: 'turret', count: 1 },
    ]
    return [
      { id: 'asteroid_xl', count: 5 }, { id: 'asteroid_large', count: 4 }, { id: 'asteroid_medium', count: 3 },
      { id: 'scout_drone', count: 4 }, { id: 'attack_drone', count: 3 }, { id: 'turret', count: 2 },
    ]
  }
}
