import shipsData from '../data/ships.json'
import classesData from '../data/classes.json'
import tagsData from '../data/tags.json'
import upgradesData from '../data/upgrades.json'
import enemiesData from '../data/enemies.json'
import weaponsData from '../data/weapons.json'
import type { ShipFrame, ClassSpecialization, Tag, UpgradeCard, Enemy, Weapon } from '../types'

export class DataLoader {
  private static ships: Map<string, ShipFrame>
  private static classes: Map<string, ClassSpecialization>
  private static tags: Map<string, Tag>
  private static upgrades: Map<string, UpgradeCard>
  private static upgradeList: UpgradeCard[]
  private static enemies: Map<string, Enemy>
  private static enemyList: Enemy[]
  private static weapons: Map<string, Weapon>
  private static weaponList: Weapon[]
  private static ready = false

  static init(): void {
    this.ships    = new Map((shipsData    as unknown as ShipFrame[])          .map(s => [s.id,  s]))
    this.classes  = new Map((classesData  as unknown as ClassSpecialization[]) .map(c => [c.id,  c]))
    this.tags     = new Map((tagsData     as unknown as Tag[])                 .map(t => [t.tag, t]))
    this.upgradeList = upgradesData as unknown as UpgradeCard[]
    this.upgrades = new Map(this.upgradeList.map(u => [u.id, u]))
    this.enemyList  = enemiesData  as unknown as Enemy[]
    this.enemies   = new Map(this.enemyList.map(e => [e.id, e]))
    this.weaponList = weaponsData  as unknown as Weapon[]
    this.weapons   = new Map(this.weaponList.map(w => [w.id, w]))
    this.ready = true
  }

  static getShip(id: string): ShipFrame | undefined       { return this.ships.get(id)   }
  static getClass(id: string): ClassSpecialization | undefined { return this.classes.get(id) }
  static getTag(tag: string): Tag | undefined             { return this.tags.get(tag)   }
  static getUpgrade(id: string): UpgradeCard | undefined  { return this.upgrades.get(id) }

  static getAllShips(): ShipFrame[]             { return [...this.ships.values()]   }
  static getAllClasses(): ClassSpecialization[] { return [...this.classes.values()] }
  static getAllUpgrades(): UpgradeCard[]        { return this.upgradeList           }
  static getAllEnemies():  Enemy[]              { return this.enemyList              }
  static getEnemy(id: string): Enemy | undefined { return this.enemies.get(id)     }
  static getAllWeapons(): Weapon[]              { return this.weaponList             }
  static getWeapon(id: string): Weapon | undefined { return this.weapons.get(id)   }

  static isReady(): boolean { return this.ready }
}
