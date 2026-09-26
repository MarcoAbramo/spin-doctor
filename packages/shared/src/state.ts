import type { Content } from './content'
import { nextRandom } from './rng'
import type { PassiveEffect } from './schema'

export const SAVE_VERSION = 1

export interface ActiveQuest {
  id: string
  step: number
  /** Sim time (ms) when the current step started. */
  stepStartedAt: number
  /** Step-local data, e.g. the pool entry a timed event picked. */
  entry?: string | undefined
}

export interface ActiveModifier {
  id: string
  until: number
  labelKey: string
  effects: PassiveEffect[]
}

export interface DailyState {
  date: string
  ids: string[]
  /** Counter values when the dailies were assigned. */
  baseline: Record<string, number>
  claimed: string[]
  streak: number
  lastCompletedDate: string | null
}

/** Something the UI may want to react to (juice, toasts). Reset on every engine call. */
export type GameEvent =
  | { type: 'milestone'; generator: string; count: number }
  | { type: 'scandal'; noticed: boolean }
  | { type: 'quest-started'; quest: string }
  | { type: 'quest-completed'; quest: string }
  | { type: 'lexicon-unlocked'; card: string }
  | { type: 'daily-completed'; daily: string }
  | { type: 'modifier-added'; id: string }

export interface GameState {
  version: number
  rng: number
  /** Sim time in ms since epoch of the last update. */
  now: number
  playerName: string
  stats: Record<string, number>
  /** Sum of all positive changes per stat. */
  lifetime: Record<string, number>
  generators: Record<string, number>
  upgrades: string[]
  flags: string[]
  lexicon: string[]
  counters: Record<string, number>
  modifiers: ActiveModifier[]
  quests: {
    active: ActiveQuest[]
    completed: string[]
    /** Earliest time a manual quest can start again. */
    cooldowns: Record<string, number>
    /** Next fire time of random quests. */
    schedule: Record<string, number>
  }
  dailies: DailyState
  settings: { sound: boolean; vibration: boolean; reducedMotion: boolean }
  events: GameEvent[]
}

export function createInitialState(content: Content, now: number, seed = now): GameState {
  const state: GameState = {
    version: SAVE_VERSION,
    rng: seed | 0,
    now,
    playerName: '',
    stats: {},
    lifetime: {},
    generators: {},
    upgrades: [],
    flags: [],
    lexicon: [],
    counters: {},
    modifiers: [],
    quests: { active: [], completed: [], cooldowns: {}, schedule: {} },
    dailies: {
      date: '',
      ids: [],
      baseline: {},
      claimed: [],
      streak: 0,
      lastCompletedDate: null,
    },
    settings: { sound: true, vibration: true, reducedMotion: false },
    events: [],
  }
  return reconcile(state, content)
}

/**
 * Makes an existing state compatible with the current content: new stats get
 * their initial value, new generators start at 0. This is what lets content
 * packs add new "points" to existing saves without a migration.
 */
export function reconcile(state: GameState, content: Content): GameState {
  for (const s of content.stats) {
    if (state.stats[s.id] === undefined) state.stats[s.id] = s.initial
    if (state.lifetime[s.id] === undefined) state.lifetime[s.id] = 0
  }
  for (const g of content.generators) {
    if (state.generators[g.id] === undefined) state.generators[g.id] = 0
  }
  return state
}

/** Returns a deep copy with an empty event list — the start of every pure engine call. */
export function draft(state: GameState): GameState {
  const copy = structuredClone(state)
  copy.events = []
  return copy
}

export function random(state: GameState): number {
  const [value, next] = nextRandom(state.rng)
  state.rng = next
  return value
}
