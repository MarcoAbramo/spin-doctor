import type { Content } from './content'
import { nextRandom } from './rng'
import type { PassiveEffect } from './schema'

export const SAVE_VERSION = 2

export interface ActiveQuest {
  id: string
  step: number
  /** Sim time (ms) when the current step (or framing question) started. */
  stepStartedAt: number
  /** Step-local data, e.g. the pool entry a timed event picked. */
  entry?: string | undefined
  /** Framing duel: scores of the answered questions so far. */
  scores?: number[] | undefined
  /** Framing duel: the clock only runs once the player has started it. */
  started?: boolean | undefined
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

/** Per-location bookkeeping (see the location economy in docs/roadmap.md). */
export interface LocationState {
  /** Uncollected production per stat, waiting for your next visit. */
  till: Record<string, number>
  /** Produced since you arrived (current location) or since you left (others). */
  producedSinceVisit: Record<string, number>
  /** Everything this location ever produced, per stat. */
  lifetime: Record<string, number>
  /** When you last arrived at or left this location (sim time, ms). */
  lastVisitAt: number
  visits: number
  /** Set once a full till has been announced, cleared on collection. */
  fullNotified: boolean
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
  | { type: 'travelled'; from: string; to: string }
  | { type: 'till-collected'; location: string; amounts: Record<string, number> }
  | { type: 'till-full'; location: string }
  | { type: 'hotspot'; location: string; id: string; multiplier: number }
  | { type: 'quality'; quest: string; score: number; labelKey?: string | undefined }

export interface GameState {
  version: number
  rng: number
  /** Sim time in ms since epoch of the last update. */
  now: number
  /** Local wall clock, passed in via TickContext (for traits like prime time). */
  clock: { hour: number; weekday: number }
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
  /** Where the player currently is. */
  location: string
  locations: Record<string, LocationState>
  /** Next hotspot time per location. */
  hotspots: Record<string, number>
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

export function emptyLocationState(now: number): LocationState {
  return {
    till: {},
    producedSinceVisit: {},
    lifetime: {},
    lastVisitAt: now,
    visits: 0,
    fullNotified: false,
  }
}

export function createInitialState(content: Content, now: number, seed = now): GameState {
  const state: GameState = {
    version: SAVE_VERSION,
    rng: seed | 0,
    now,
    clock: { hour: 12, weekday: 1 },
    playerName: '',
    stats: {},
    lifetime: {},
    generators: {},
    upgrades: [],
    flags: [],
    lexicon: [],
    counters: {},
    modifiers: [],
    location: content.locations[0]!.id,
    locations: {},
    hotspots: {},
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
 * their initial value, new generators start at 0, new locations get an empty
 * till. This is what lets content packs add new "points" and places to
 * existing saves without a migration.
 */
export function reconcile(state: GameState, content: Content): GameState {
  for (const s of content.stats) {
    if (state.stats[s.id] === undefined) state.stats[s.id] = s.initial
    if (state.lifetime[s.id] === undefined) state.lifetime[s.id] = 0
  }
  for (const g of content.generators) {
    if (state.generators[g.id] === undefined) state.generators[g.id] = 0
  }
  for (const l of content.locations) {
    if (!state.locations[l.id]) state.locations[l.id] = emptyLocationState(state.now)
  }
  if (!content.locations.some((l) => l.id === state.location))
    state.location = content.locations[0]!.id
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
