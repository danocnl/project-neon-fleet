import shipsData from '../data/ships.json'
import classesData from '../data/classes.json'
import tagsData from '../data/tags.json'
import upgradesData from '../data/upgrades.json'
import type { ShipFrame, ClassSpecialization, Tag, UpgradeCard } from '../types'

export class DataLoader {
  private static ships: Map<string, ShipFrame>
  private static classes: Map<string, ClassSpecialization>
  private static tags: Map<string, Tag>
  private static upgrades: Map<string, UpgradeCard>
  private static upgradeList: UpgradeCard[]
  private static ready = false

  static init(): void {
    this.ships    = new Map((shipsData    as unknown as ShipFrame[])          .map(s => [s.id,  s]))
    this.classes  = new Map((classesData  as unknown as ClassSpecialization[]) .map(c => [c.id,  c]))
    this.tags     = new Map((tagsData     as unknown as Tag[])                 .map(t => [t.tag, t]))
    this.upgradeList = upgradesData as unknown as UpgradeCard[]
    this.upgrades = new Map(this.upgradeList.map(u => [u.id, u]))
    this.ready = true
  }

  static getShip(id: string): ShipFrame | undefined       { return this.ships.get(id)   }
  static getClass(id: string): ClassSpecialization | undefined { return this.classes.get(id) }
  static getTag(tag: string): Tag | undefined             { return this.tags.get(tag)   }
  static getUpgrade(id: string): UpgradeCard | undefined  { return this.upgrades.get(id) }

  static getAllShips(): ShipFrame[]             { return [...this.ships.values()]   }
  static getAllClasses(): ClassSpecialization[] { return [...this.classes.values()] }
  static getAllUpgrades(): UpgradeCard[]        { return this.upgradeList           }

  static isReady(): boolean { return this.ready }
}
