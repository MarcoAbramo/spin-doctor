import type { Content } from './content'
import { applyEffects } from './economy'
import type { DailyDef } from './schema'
import { type GameState, random } from './state'

export const DAILIES_PER_DAY = 3

/** 'YYYY-MM-DD' of the day before. Pure string/UTC math, independent of the host time zone. */
export function previousDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10)
}

/** Local calendar date as 'YYYY-MM-DD' (client passes this in via the tick context). */
export function localDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function dailyProgress(state: GameState, daily: DailyDef): number {
  const now = state.counters[daily.counter] ?? 0
  const base = state.dailies.baseline[daily.counter] ?? 0
  return Math.min(daily.target, Math.max(0, now - base))
}

/** Assigns new dailies when the local date changed (midnight reset). */
export function ensureDailies(state: GameState, content: Content, localDate: string): void {
  const d = state.dailies
  if (d.date === localDate || content.dailies.length === 0) return
  const pool = [...content.dailies]
  const ids: string[] = []
  while (ids.length < DAILIES_PER_DAY && pool.length > 0) {
    const [pick] = pool.splice(Math.floor(random(state) * pool.length), 1)
    if (pick) ids.push(pick.id)
  }
  const baseline: Record<string, number> = {}
  for (const id of ids) {
    const def = content.dailies.find((x) => x.id === id)
    if (def) baseline[def.counter] = state.counters[def.counter] ?? 0
  }
  const yesterday = previousDate(localDate)
  state.dailies = {
    date: localDate,
    ids,
    baseline,
    claimed: [],
    streak: d.lastCompletedDate === yesterday || d.lastCompletedDate === localDate ? d.streak : 0,
    lastCompletedDate: d.lastCompletedDate,
  }
}

/** Auto-claims finished dailies; completing all of them extends the streak. */
export function updateDailies(state: GameState, content: Content): void {
  const d = state.dailies
  for (const id of d.ids) {
    if (d.claimed.includes(id)) continue
    const def = content.dailies.find((x) => x.id === id)
    if (!def || dailyProgress(state, def) < def.target) continue
    d.claimed.push(id)
    applyEffects(state, content, def.rewards)
    state.events.push({ type: 'daily-completed', daily: id })
    if (d.claimed.length === d.ids.length) {
      d.streak = d.lastCompletedDate === previousDate(d.date) ? d.streak + 1 : 1
      d.lastCompletedDate = d.date
    }
  }
}
