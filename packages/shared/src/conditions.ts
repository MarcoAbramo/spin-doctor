import type { Content } from './content'
import type { Condition } from './schema'
import type { GameState } from './state'

/** The first location is always open; others need their `unlock` condition. */
export function isLocationUnlocked(state: GameState, content: Content, id: string): boolean {
  const index = content.locations.findIndex((l) => l.id === id)
  if (index < 0) return false
  if (index === 0 || state.location === id) return true
  return check(state, content, content.locations[index]!.unlock)
}

export function isMapUnlocked(state: GameState, content: Content): boolean {
  return check(state, content, content.world.mapUnlock)
}

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
    case 'location':
      return state.location === cond.location
    case 'locationUnlocked':
      return isLocationUnlocked(state, content, cond.location)
    case 'hour': {
      const h = state.clock.hour
      return cond.from <= cond.to ? h >= cond.from && h < cond.to : h >= cond.from || h < cond.to
    }
    case 'weekday':
      return cond.days.includes(state.clock.weekday)
    case 'all':
      return cond.of.every((c) => check(state, content, c))
    case 'any':
      return cond.of.some((c) => check(state, content, c))
    case 'not':
      return !check(state, content, cond.of)
  }
}
