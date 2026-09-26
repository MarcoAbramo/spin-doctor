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
const AUTOSAVE_MS = 10_000
const UI_REFRESH_MS = 100
/** Longer frame gaps (tab switch, sleep) go through the offline path instead. */
const MAX_FRAME_SEC = 1

type Listener = () => void
type EventListener = (event: GameEvent) => void

let state: GameState
let offlineReport: OfflineReport | null = null
const listeners = new Set<Listener>()
const eventListeners = new Set<EventListener>()

function load(): GameState {
  const now = Date.now()
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const loaded = deserialize(raw, content)
      const { state: after, report } = applyOffline(loaded, content, now)
      offlineReport = report
      return after
    }
  } catch (err) {
    console.warn('Could not load save, starting fresh', err)
  }
  return createInitialState(content, now, (now ^ 0x5eed) | 0)
}

export function save(): void {
  try {
    localStorage.setItem(SAVE_KEY, serialize(state))
  } catch {
    // Storage full or disabled (private mode) — the game keeps running.
  }
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
  localStorage.removeItem(SAVE_KEY)
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
  frame = requestAnimationFrame(loop)
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
    } else {
      const { state: after, report } = applyOffline(state, content, Date.now())
      state = after
      if (report) offlineReport = report
      dirtyUi = true
      frame = requestAnimationFrame(loop)
    }
  })
  window.addEventListener('pagehide', save)
}
