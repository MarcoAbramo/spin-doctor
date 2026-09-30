import {
  applyOffline,
  createInitialState,
  deserialize,
  type GameEvent,
  type GameState,
  localDateString,
  type OfflineReport,
  serialize,
  tick,
} from '@spin-doctor/shared'
import { content } from './content'

const SAVE_KEY = 'spin-doctor.save'
/** The last save that loaded fine (copied once per session) — the fallback if the current one breaks. */
const GOOD_KEY = 'spin-doctor.save.good'
/** A save that could not be loaded is parked here instead of being overwritten. */
const UNREADABLE_KEY = 'spin-doctor.save.unreadable'
const AUTOSAVE_MS = 10_000
const UI_REFRESH_MS = 100
/** Longer frame gaps (tab switch, sleep) go through the offline path instead. */
const MAX_FRAME_SEC = 1

type Listener = () => void
type EventListener = (event: GameEvent) => void

/** What went wrong while loading: the previous good save was used, or a new game started. */
export type LoadProblem = 'restoredGood' | 'startedFresh'

let state: GameState
let offlineReport: OfflineReport | null = null
let loadProblem: LoadProblem | null = null
let crashed: unknown = null
const listeners = new Set<Listener>()
const eventListeners = new Set<EventListener>()
const crashListeners = new Set<(error: unknown) => void>()

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage full or disabled (private mode) — the game keeps running.
  }
}

function resume(raw: string, now: number): GameState {
  const { state: after, report } = applyOffline(deserialize(raw, content), content, now)
  offlineReport = report
  return after
}

function load(): GameState {
  const now = Date.now()
  const raw = read(SAVE_KEY)
  if (raw) {
    try {
      const loaded = resume(raw, now)
      write(GOOD_KEY, raw)
      return loaded
    } catch (err) {
      // Never overwrite a save we cannot read: park it and fall back to the last good one.
      console.warn('Could not load save', err)
      write(UNREADABLE_KEY, raw)
      const good = read(GOOD_KEY)
      if (good && good !== raw) {
        try {
          loadProblem = 'restoredGood'
          return resume(good, now)
        } catch (err2) {
          console.warn('Could not load the backup either', err2)
        }
      }
      loadProblem = 'startedFresh'
    }
  }
  return createInitialState(content, now, (now ^ 0x5eed) | 0)
}

export function save(): void {
  // After a crash the last save from before the error stays untouched.
  if (crashed) return
  write(SAVE_KEY, serialize(state))
}

export function takeLoadProblem(): LoadProblem | null {
  const p = loadProblem
  loadProblem = null
  return p
}

/** The save as stored (JSON), e.g. for the crash screen or a save that did not load. */
export function storedSave(which: 'current' | 'unreadable' = 'current'): string | null {
  return read(which === 'current' ? SAVE_KEY : UNREADABLE_KEY)
}

/** Stops the game after an unexpected error; the crash screen takes over. */
export function crash(error: unknown): void {
  if (crashed) return
  crashed = error ?? new Error('unknown error')
  cancelAnimationFrame(frame)
  console.error(error)
  for (const l of crashListeners) l(crashed)
}

export function onCrash(l: (error: unknown) => void): () => void {
  crashListeners.add(l)
  if (crashed) l(crashed)
  return () => crashListeners.delete(l)
}

function emit(events: GameEvent[]): void {
  for (const e of events) for (const l of eventListeners) l(e)
}

let dirtyUi = true
function notify(): void {
  dirtyUi = false
  for (const l of listeners) l()
}

/** Replaces the state with the result of a pure engine function. */
export function dispatch(update: (s: GameState) => GameState): void {
  state = update(state)
  emit(state.events)
  notify()
}

export function getState(): GameState {
  return state
}

export function takeOfflineReport(): OfflineReport | null {
  const r = offlineReport
  offlineReport = null
  return r
}

export function subscribe(l: Listener): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function onGameEvent(l: EventListener): () => void {
  eventListeners.add(l)
  return () => eventListeners.delete(l)
}

export function resetGame(): void {
  try {
    for (const key of [SAVE_KEY, GOOD_KEY, UNREADABLE_KEY]) localStorage.removeItem(key)
  } catch {
    // Storage unavailable — nothing to delete.
  }
  state = createInitialState(content, Date.now(), (Date.now() ^ 0x5eed) | 0)
  notify()
}

export function replaceState(next: GameState): void {
  state = next
  save()
  notify()
}

// ---------------------------------------------------------------------------
// Loop
// ---------------------------------------------------------------------------

let last = 0
let lastUi = 0
let frame = 0

function loop(ts: number): void {
  try {
    step(ts)
  } catch (err) {
    crash(err)
    return
  }
  frame = requestAnimationFrame(loop)
}

function step(ts: number): void {
  const dt = last ? (ts - last) / 1000 : 0
  last = ts
  const now = Date.now()
  if (dt > MAX_FRAME_SEC) {
    const { state: after, report } = applyOffline(state, content, now)
    state = after
    if (report) offlineReport = report
    dirtyUi = true
  }
  const date = new Date(now)
  state = tick(state, content, Math.min(dt, MAX_FRAME_SEC), {
    now,
    localDate: localDateString(date),
    localHour: date.getHours(),
    localWeekday: date.getDay(),
  })
  if (state.events.length) {
    emit(state.events)
    dirtyUi = true
  }
  if (dirtyUi || ts - lastUi > UI_REFRESH_MS) {
    lastUi = ts
    notify()
  }
}

export function startGame(): void {
  state = load()
  frame = requestAnimationFrame(loop)
  setInterval(save, AUTOSAVE_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      save()
      cancelAnimationFrame(frame)
      last = 0
    } else if (!crashed) {
      const { state: after, report } = applyOffline(state, content, Date.now())
      state = after
      if (report) offlineReport = report
      dirtyUi = true
      frame = requestAnimationFrame(loop)
    }
  })
  window.addEventListener('pagehide', save)
}
