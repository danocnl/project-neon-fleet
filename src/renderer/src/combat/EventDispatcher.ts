export type EventType =
  | 'ON_HIT'
  | 'ON_CRIT'
  | 'ON_KILL'
  | 'ON_SHIELD_DROP'
  | 'ON_OVERHEAT'
  | 'PROXIMITY'
  | 'IN_RANGE'
  | 'ALLY_LOW_HP'

export interface CombatEvent {
  type:      EventType
  sourceId:  string
  targetId?: string
  value?:    number    // damage dealt, range, etc.
  timestamp: number    // ms (performance.now())
}

type Handler = (event: CombatEvent) => void

export class EventDispatcher {
  private listeners = new Map<EventType, Set<Handler>>()

  on(type: EventType, handler: Handler): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(handler)
  }

  off(type: EventType, handler: Handler): void {
    this.listeners.get(type)?.delete(handler)
  }

  emit(event: CombatEvent): void {
    this.listeners.get(event.type)?.forEach(h => h(event))
  }
}
