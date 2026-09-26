import type { Content } from './content'
import { applyDriftAndExpiry, distributeProduction } from './economy'
import { draft, type GameState } from './state'

export const OFFLINE_CAP_SEC = 8 * 60 * 60
/** Below this, returning is treated as a normal tick, not an "offline" session. */
export const OFFLINE_MIN_SEC = 30

export interface OfflineReport {
  seconds: number
  /** Currency paid directly by the location you were at. */
  gained: number
  /** Currency that went into the other locations' tills meanwhile. */
  tills: Record<string, number>
  /** Locations whose till is now full. */
  full: string[]
  /** Flavour: how often the president posted meanwhile (roughly one post per 5 min). */
  posts: number
  capped: boolean
}

/**
 * Closed-form offline progress (capped at 8 h): the current location pays out,
 * all other locations fill their tills up to the cap. Modifiers that expired
 * meanwhile are dropped first, so debuffs don't run forever.
 */
export function applyOffline(
  state: GameState,
  content: Content,
  now: number,
): { state: GameState; report: OfflineReport | null } {
  const elapsed = Math.max(0, (now - state.now) / 1000)
  if (elapsed < OFFLINE_MIN_SEC) return { state, report: null }
  const seconds = Math.min(elapsed, OFFLINE_CAP_SEC)
  const s = draft(state)
  s.now = now
  applyDriftAndExpiry(s, content, seconds)
  const before = s.stats[content.currency] ?? 0
  const tillsBefore = Object.fromEntries(
    Object.entries(s.locations).map(([id, l]) => [id, l.till[content.currency] ?? 0]),
  )
  distributeProduction(s, content, seconds)
  const tills: Record<string, number> = {}
  for (const [id, l] of Object.entries(s.locations)) {
    const added = (l.till[content.currency] ?? 0) - (tillsBefore[id] ?? 0)
    if (added > 0) tills[id] = added
  }
  const full = s.events.flatMap((e) => (e.type === 'till-full' ? [e.location] : []))
  return {
    state: s,
    report: {
      seconds,
      gained: (s.stats[content.currency] ?? 0) - before,
      tills,
      full,
      posts: Math.max(1, Math.round(seconds / 300)),
      capped: elapsed > OFFLINE_CAP_SEC,
    },
  }
}
