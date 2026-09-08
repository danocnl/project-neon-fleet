import type { FleetLoadout, UpgradeCard } from '../types'
import type { ComputedStats } from './StatCalculator'
import { TagAggregator } from './TagAggregator'
import { StatCalculator } from './StatCalculator'
import { DraftEngine } from './DraftEngine'
import { DataLoader } from './DataLoader'

export interface PlayerState {
  loadout: FleetLoadout
  aggregator: TagAggregator
  draftedCards: UpgradeCard[]
  computedStats: ComputedStats
}

export class LoadoutManager {
  private readonly statCalc  = new StatCalculator()
  private readonly draftEngine = new DraftEngine()

  build(shipId: string, classId: string): PlayerState | null {
    const ship      = DataLoader.getShip(shipId)
    const classSpec = DataLoader.getClass(classId)
    if (!ship || !classSpec) return null

    const aggregator = new TagAggregator()
    aggregator.initFromLoadout(ship, classSpec)

    const draftedCards: UpgradeCard[] = []
    const computedStats = this.statCalc.compute(ship, aggregator.getAll(), draftedCards)

    return {
      loadout: {
        shipFrameId: shipId,
        classSpecId: classId,
        upgrades: [],
        activeTags: Object.keys(aggregator.getAll())
      },
      aggregator,
      draftedCards,
      computedStats
    }
  }

  applyUpgrade(state: PlayerState, card: UpgradeCard): PlayerState {
    const ship      = DataLoader.getShip(state.loadout.shipFrameId)!
    const classSpec = DataLoader.getClass(state.loadout.classSpecId)!

    state.aggregator.applyUpgrade(card)
    state.draftedCards.push(card)

    const computedStats = this.statCalc.compute(
      ship,
      state.aggregator.getAll(),
      state.draftedCards
    )

    return {
      ...state,
      loadout: {
        ...state.loadout,
        upgrades: [...state.loadout.upgrades, card.id],
        activeTags: Object.keys(state.aggregator.getAll())
      },
      computedStats
    }
  }

  getDraftOffer(state: PlayerState, count = 4): UpgradeCard[] {
    const ship      = DataLoader.getShip(state.loadout.shipFrameId)!
    const classSpec = DataLoader.getClass(state.loadout.classSpecId)!
    return this.draftEngine.generateOffer(
      DataLoader.getAllUpgrades(),
      state.aggregator,
      ship,
      classSpec,
      new Set(state.loadout.upgrades),
      count
    )
  }
}
