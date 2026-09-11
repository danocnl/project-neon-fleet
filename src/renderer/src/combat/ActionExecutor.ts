import type { CombatState } from './CombatState'
import type { TriggerFired } from './TriggerEvaluator'

// Maps card IDs to their concrete mechanical effects.
// The card's logicTrigger.action string describes it for the player;
// this is what actually changes state.

type ActionFn = (state: CombatState) => void

const ACTIONS: Record<string, ActionFn> = {
  emergency_phase_protocol: s => s.applyEffect('PHASE', 1500, 1),
  cascade_shielding:        s => s.restoreShield(s.maxShield * 0.2),
  reactive_hull_matrix:     s => { if (Math.random() < 0.12) s.restoreHull(250) },
  combat_triage:            s => s.restoreHull(300),
  kill_boost:               s => s.applyEffect('SPEED_BOOST', 3000, 0.4),
  heat_flush:               s => { s.coolHeat(s.maxHeat); s.applyEffect('FIRE_RATE_BOOST', 2000, 0.2) },
  lightning_discharge:      s => s.coolHeat(s.maxHeat * 0.5),   // heat vented as voltage (Phase 5 will deal damage)
  chord_cascade:            s => { s.harmonicStacks += 2 },
  crit_reload:              () => { /* weapon reload — Phase 5 */ },
  proximity_turret:         () => { /* construct deploy — Phase 5 */ },
  team_shield_relay:        () => { /* cross-ship — Phase 6 */ },
  force_tether:             () => { /* tether — Phase 6 */ },
  tether_detonation:        () => { /* tether explode — Phase 6 */ },
  // ─── Test cards ──────────────────────────────────────────────────────────
  test_kill_feed:      s => s.restoreHull(s.maxHull * 0.2),
  test_phase_reaction: s => s.applyEffect('PHASE', 2000, 1),
  test_cryo_warhead:   () => { /* enemy AoE handled in PhysicsScene */ },
}

export interface ExecutionResult {
  cardId:  string
  applied: boolean
  label:   string
}

export class ActionExecutor {
  execute(trigger: TriggerFired, state: CombatState): ExecutionResult {
    const fn = ACTIONS[trigger.cardId]
    if (fn) {
      fn(state)
      return { cardId: trigger.cardId, applied: true,  label: trigger.action }
    }
    return   { cardId: trigger.cardId, applied: false, label: trigger.action }
  }
}
