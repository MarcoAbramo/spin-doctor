import type { Content } from './content'
import type { Condition } from './schema'
import type { GameState } from './state'

export function check(state: GameState, content: Content, cond: Condition | undefined): boolean {
  if (!cond) return true
  switch (cond.type) {
    case 'stat': {
      const v = state.stats[cond.stat] ?? 0
      return (cond.gte === undefined || v >= cond.gte) && (cond.lte === undefined || v <= cond.lte)
    }
    case 'generator':
      return (state.generators[cond.generator] ?? 0) >= cond.gte
    case 'upgrade':
      return state.upgrades.includes(cond.upgrade)
    case 'flag':
      return state.flags.includes(cond.flag)
    case 'quest':
      return state.quests.completed.includes(cond.quest)
    case 'counter':
      return (state.counters[cond.counter] ?? 0) >= cond.gte
    case 'lifetime':
      return (state.lifetime[cond.stat] ?? 0) >= cond.gte
    case 'all':
      return cond.of.every((c) => check(state, content, c))
    case 'any':
      return cond.of.some((c) => check(state, content, c))
    case 'not':
      return !check(state, content, cond.of)
  }
}
