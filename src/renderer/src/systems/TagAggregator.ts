import type { UpgradeCard } from '../types'

export type TagPool = Record<string, number>

export class TagAggregator {
  private tags: TagPool = {}

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
    for (const tag of card.grantedTags) {
      this.addTag(tag)
    }
  }

  meetsPrerequisites(card: UpgradeCard): boolean {
    return card.prerequisiteTags.every((tag) => this.hasTag(tag))
  }

  getAll(): TagPool {
    return { ...this.tags }
  }

  clear(): void {
    this.tags = {}
  }
}
