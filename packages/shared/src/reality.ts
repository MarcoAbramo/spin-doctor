import { check } from './conditions'
import type { Content } from './content'
import type { GameState } from './state'

/** Unlocks every „Realitäts-Check“ card whose condition now holds (mutates a draft). */
export function updateRealityChecks(state: GameState, content: Content): void {
  for (const card of content.realityChecks) {
    if (state.realityChecks.includes(card.id)) continue
    if (!check(state, content, card.unlock)) continue
    state.realityChecks.push(card.id)
    state.events.push({ type: 'reality-unlocked', card: card.id })
  }
}
