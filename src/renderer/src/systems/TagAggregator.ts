import type { ShipFrame, ClassSpecialization, UpgradeCard } from '../types'

export type TagPool = Record<string, number>

export class TagAggregator {
  private tags: TagPool = {}

  initFromLoadout(ship: ShipFrame, classSpec: ClassSpecialization): void {
    this.clear()
    for (const [tag, count] of Object.entries(ship.hardwareTags)) {
      this.addTag(tag, count)
    }
    // Class contributes 1 instance of each primary tag at run start
    for (const tag of classSpec.primaryTags) {
      this.addTag(tag, 1)
    }
  }

  addTag(tag: string, count = 1): void {
    this.tags[tag] = (this.tags[tag] ?? 0) + count
  }

  removeTag(tag: string, count = 1): void {
    const current = this.tags[tag] ?? 0
    const next = current - count
    if (next <= 0) {
      delete this.tags[tag]
    } else {
      this.tags[tag] = next
    }
  }

  getCount(tag: string): number {
    return this.tags[tag] ?? 0
  }

  hasTag(tag: string, minCount = 1): boolean {
    return this.getCount(tag) >= minCount
  }

  applyUpgrade(card: UpgradeCard): void {
    for (const [tag, count] of Object.entries(card.grantedTags)) {
      this.addTag(tag, count)
    }
  }

  meetsPrerequisites(card: UpgradeCard): boolean {
    return Object.entries(card.prerequisiteTags).every(
      ([tag, required]) => this.getCount(tag) >= required
    )
  }

  getTotalCount(): number {
    return Object.values(this.tags).reduce((sum, n) => sum + n, 0)
  }

  getAll(): TagPool {
    return { ...this.tags }
  }

  clear(): void {
    this.tags = {}
  }
}
