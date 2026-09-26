import { z } from 'zod'
import type { Content } from './content'
import { type GameState, reconcile, SAVE_VERSION } from './state'

/**
 * Save migrations: `migrations[n]` upgrades a save from version n+1 to n+2.
 * Add a function here whenever `SAVE_VERSION` is bumped — never edit old ones.
 */
type RawSave = Record<string, unknown> & { version: number }
export const migrations: Array<(save: RawSave) => RawSave> = []

const num = z.number().finite()
const record = z.record(z.string(), num)
const passive = z.object({ type: z.literal('multiplier'), target: z.string(), value: num })

export const saveSchema = z.object({
  version: z.literal(SAVE_VERSION),
  rng: num,
  now: num,
  playerName: z.string().max(40),
  stats: record,
  lifetime: record,
  generators: record,
  upgrades: z.array(z.string()),
  flags: z.array(z.string()),
  lexicon: z.array(z.string()),
  counters: record,
  modifiers: z.array(
    z.object({ id: z.string(), until: num, labelKey: z.string(), effects: z.array(passive) }),
  ),
  quests: z.object({
    active: z.array(
      z.object({
        id: z.string(),
        step: z.number().int().min(0),
        stepStartedAt: num,
        entry: z.string().optional(),
      }),
    ),
    completed: z.array(z.string()),
    cooldowns: record,
    schedule: record,
  }),
  dailies: z.object({
    date: z.string(),
    ids: z.array(z.string()),
    baseline: record,
    claimed: z.array(z.string()),
    streak: z.number().int().min(0),
    lastCompletedDate: z.string().nullable(),
  }),
  settings: z.object({ sound: z.boolean(), vibration: z.boolean(), reducedMotion: z.boolean() }),
  events: z.array(z.unknown()).default([]),
})

export class SaveError extends Error {}

export function serialize(state: GameState): string {
  return JSON.stringify({ ...state, events: [] })
}

/** Parses, migrates, validates and reconciles a save with the current content. */
export function deserialize(json: string, content: Content): GameState {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    throw new SaveError('save is not valid JSON')
  }
  if (!raw || typeof raw !== 'object' || typeof (raw as RawSave).version !== 'number')
    throw new SaveError('save has no version')
  let save = raw as RawSave
  if (save.version > SAVE_VERSION) throw new SaveError('save is from a newer game version')
  while (save.version < SAVE_VERSION) {
    const migrate = migrations[save.version - 1]
    if (!migrate) throw new SaveError(`no migration from version ${save.version}`)
    save = migrate(save)
  }
  const parsed = saveSchema.safeParse(save)
  if (!parsed.success) throw new SaveError(`invalid save: ${parsed.error.issues[0]?.message}`)
  const state = parsed.data as GameState
  state.events = []
  // Drop references to content that no longer exists (e.g. a removed quest).
  state.quests.active = state.quests.active.filter((a) => content.quests.some((q) => q.id === a.id))
  return reconcile(state, content)
}

const PREFIX = 'SPIN1:'

/** Save as a copy-pasteable text code (base64 of UTF-8 JSON). */
export function exportSave(state: GameState): string {
  const bytes = new TextEncoder().encode(serialize(state))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return PREFIX + btoa(bin)
}

export function importSave(code: string, content: Content): GameState {
  const trimmed = code.trim()
  if (!trimmed.startsWith(PREFIX)) throw new SaveError('not a Spin Doctor save code')
  let json: string
  try {
    const bin = atob(trimmed.slice(PREFIX.length))
    json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
  } catch {
    throw new SaveError('save code is corrupted')
  }
  return deserialize(json, content)
}
