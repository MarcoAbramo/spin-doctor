import type { Content } from './content'
import { addStat, applyDriftAndExpiry, productionPerSecond } from './economy'
import { draft, type GameState } from './state'

export const OFFLINE_CAP_SEC = 8 * 60 * 60
/** Below this, returning is treated as a normal tick, not an "offline" session. */
export const OFFLINE_MIN_SEC = 30

export interface OfflineReport {
  seconds: number
  gained: number
  /** Flavour: how often the president posted meanwhile (roughly one post per 5 min). */
  posts: number
  capped: boolean
}

/**
 * Closed-form offline progress: production × elapsed time (capped at 8 h).
 * Modifiers that expired meanwhile are dropped first, so debuffs don't run forever.
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
  const gained = productionPerSecond(s, content) * seconds
  addStat(s, content, content.currency, gained)
  return {
    state: s,
    report: {
      seconds,
      gained,
      posts: Math.max(1, Math.round(seconds / 300)),
      capped: elapsed > OFFLINE_CAP_SEC,
    },
  }
}
