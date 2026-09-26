import { z } from 'zod'

/**
 * Content-pack schemas. Every JSON file under `packages/shared/content/**` is a
 * content pack; packs are merged into one `Content` object. The engine only
 * understands the generic building blocks defined here (see ADR 0002).
 */

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'ids are lowercase kebab-case')
const i18nKey = z.string().min(1)

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

export type Condition =
  | { type: 'stat'; stat: string; gte?: number | undefined; lte?: number | undefined }
  | { type: 'generator'; generator: string; gte: number }
  | { type: 'upgrade'; upgrade: string }
  | { type: 'flag'; flag: string }
  | { type: 'quest'; quest: string }
  | { type: 'counter'; counter: string; gte: number }
  | { type: 'lifetime'; stat: string; gte: number }
  | { type: 'all'; of: Condition[] }
  | { type: 'any'; of: Condition[] }
  | { type: 'not'; of: Condition }

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('stat'),
      stat: id,
      gte: z.number().optional(),
      lte: z.number().optional(),
    }),
    z.object({ type: z.literal('generator'), generator: id, gte: z.number().int().min(0) }),
    z.object({ type: z.literal('upgrade'), upgrade: id }),
    z.object({ type: z.literal('flag'), flag: id }),
    z.object({ type: z.literal('quest'), quest: id }),
    z.object({ type: z.literal('counter'), counter: id, gte: z.number() }),
    z.object({ type: z.literal('lifetime'), stat: id, gte: z.number() }),
    z.object({ type: z.literal('all'), of: z.array(conditionSchema) }),
    z.object({ type: z.literal('any'), of: z.array(conditionSchema) }),
    z.object({ type: z.literal('not'), of: conditionSchema }),
  ]),
)

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

/**
 * Multiplier targets:
 * - `tap`                – spin per tap
 * - `production`         – all generators
 * - `generator:<id>`     – one generator
 * - `scandal-detection`  – chance that a scandal is noticed (lower is better for you)
 * - `stat-gain:<id>`     – positive changes to a stat
 */
const multiplierTarget = z
  .string()
  .regex(/^(tap|production|scandal-detection|generator:[a-z0-9-]+|stat-gain:[a-z0-9-]+)$/)

const passiveEffect = z.object({
  type: z.literal('multiplier'),
  target: multiplierTarget,
  value: z.number().positive(),
})

const simpleEffects = [
  passiveEffect,
  z.object({ type: z.literal('addStat'), stat: id, value: z.number() }),
  /** Grants `seconds` worth of current currency production. */
  z.object({ type: z.literal('productionSeconds'), seconds: z.number() }),
  z.object({ type: z.literal('setFlag'), flag: id }),
  z.object({ type: z.literal('unlockLexicon'), card: id }),
  z.object({ type: z.literal('counter'), counter: id, value: z.number() }),
  /** Temporary buff/debuff made of multiplier effects. */
  z.object({
    type: z.literal('modifier'),
    id,
    durationSec: z.number().positive(),
    labelKey: i18nKey,
    effects: z.array(passiveEffect).min(1),
  }),
] as const
const simpleEffectSchema = z.discriminatedUnion('type', [...simpleEffects])

export const effectSchema = z.discriminatedUnion('type', [
  ...simpleEffects,
  /** A scandal: may go unnoticed (scandal-detection multiplier), otherwise applies `effects`. */
  z.object({ type: z.literal('scandal'), effects: z.array(simpleEffectSchema) }),
])
export type Effect = z.infer<typeof effectSchema>
export type PassiveEffect = z.infer<typeof passiveEffect>

// ---------------------------------------------------------------------------
// Stats, generators, upgrades, lexicon
// ---------------------------------------------------------------------------

export const statSchema = z.object({
  id,
  /** `currency` is produced by generators and spent on purchases (exactly one). */
  role: z.enum(['currency', 'meter']).default('meter'),
  initial: z.number(),
  min: z.number().optional(),
  max: z.number().optional(),
  display: z.enum(['number', 'percent', 'bar', 'hidden']).default('number'),
  /** Visual order in the HUD. */
  order: z.number().default(100),
  /** If set, the stat multiplies production by `base + value * perPoint`. */
  productionMultiplier: z.object({ base: z.number(), perPoint: z.number() }).optional(),
  /** Slowly drifts towards `toward` at `perSec`. */
  drift: z.object({ toward: z.number(), perSec: z.number().positive() }).optional(),
  /** Change per manual tap. */
  perTap: z.number().optional(),
  emoji: z.string().optional(),
})
export type StatDef = z.infer<typeof statSchema>

export const generatorSchema = z.object({
  id,
  baseCost: z.number().positive(),
  costFactor: z.number().gt(1).default(1.15),
  /** Currency per second per unit. */
  rate: z.number().positive(),
  milestones: z.array(z.number().int().positive()).default([10, 25, 50, 100]),
  milestoneMultiplier: z.number().positive().default(2),
  /** Shown/buyable only when met. */
  unlock: conditionSchema.optional(),
  /** Placeholder sprite id in the scene (swap for real art later). */
  sprite: z.string().optional(),
  /** Emoji used as icon until real art exists. */
  emoji: z.string().optional(),
})
export type GeneratorDef = z.infer<typeof generatorSchema>

export const upgradeSchema = z.object({
  id,
  cost: z.number().nonnegative(),
  unlock: conditionSchema.optional(),
  effects: z.array(effectSchema).min(1),
  /** Marks upgrades that erode democracy — rendered with a warning style. */
  dark: z.boolean().default(false),
  emoji: z.string().optional(),
})
export type UpgradeDef = z.infer<typeof upgradeSchema>

export const lexiconSchema = z.object({
  id,
  source: z.object({ label: z.string(), url: z.url() }),
  factChecked: z.boolean().default(false),
})
export type LexiconDef = z.infer<typeof lexiconSchema>

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------

const choiceSchema = z.object({
  textKey: i18nKey,
  replyKey: i18nKey.optional(),
  effects: z.array(effectSchema).default([]),
})

export const stepSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('dialog'),
    speaker: id,
    lines: z.array(i18nKey).min(1),
    choices: z.array(choiceSchema).optional(),
  }),
  z.object({ type: z.literal('objective'), textKey: i18nKey, condition: conditionSchema }),
  z.object({
    type: z.literal('minigame'),
    handler: id,
    durationSec: z.number().positive(),
    pool: id.optional(),
    /** Reward = score × this many seconds of production. */
    productionSecondsPerPoint: z.number().nonnegative(),
    effects: z.array(effectSchema).default([]),
  }),
  z.object({
    type: z.literal('timed'),
    handler: id,
    timeoutSec: z.number().positive(),
    pool: id.optional(),
    success: z.array(effectSchema),
    failure: z.array(effectSchema),
  }),
])
export type Step = z.infer<typeof stepSchema>

export const triggerSchema = z.discriminatedUnion('type', [
  /** Starts as soon as `conditions` are met (story). */
  z.object({ type: z.literal('auto') }),
  /** Player starts it from the quest tab; optional cooldown for repeatables. */
  z.object({ type: z.literal('manual'), cooldownSec: z.number().nonnegative().default(0) }),
  /** Fires at a random interval. */
  z.object({
    type: z.literal('random'),
    minSec: z.number().positive(),
    maxSec: z.number().positive(),
  }),
])

export const questSchema = z.object({
  id,
  category: z.enum(['story', 'side', 'event', 'minigame']),
  act: z.number().int().positive().optional(),
  titleKey: i18nKey,
  trigger: triggerSchema,
  conditions: conditionSchema.optional(),
  repeatable: z.boolean().default(false),
  steps: z.array(stepSchema).min(1),
  rewards: z.array(effectSchema).default([]),
})
export type QuestDef = z.infer<typeof questSchema>

export const dailySchema = z.object({
  id,
  textKey: i18nKey,
  counter: id,
  target: z.number().positive(),
  rewards: z.array(effectSchema).min(1),
})
export type DailyDef = z.infer<typeof dailySchema>

export const poolSchema = z.object({
  id,
  entries: z.array(z.object({ key: i18nKey, tag: z.string().optional() })).min(1),
})
export type PoolDef = z.infer<typeof poolSchema>

export const speakerSchema = z.object({ id, nameKey: i18nKey, color: z.string().optional() })
export type SpeakerDef = z.infer<typeof speakerSchema>

// ---------------------------------------------------------------------------
// Pack
// ---------------------------------------------------------------------------

export const contentPackSchema = z.object({
  $schema: z.string().optional(),
  stats: z.array(statSchema).default([]),
  generators: z.array(generatorSchema).default([]),
  upgrades: z.array(upgradeSchema).default([]),
  lexicon: z.array(lexiconSchema).default([]),
  quests: z.array(questSchema).default([]),
  dailies: z.array(dailySchema).default([]),
  pools: z.array(poolSchema).default([]),
  speakers: z.array(speakerSchema).default([]),
  /** Optional texts shipped with the pack: `{ "de": { "key": "Text" } }`. */
  i18n: z.record(z.string(), z.record(z.string(), z.string())).default({}),
})
export type ContentPack = z.infer<typeof contentPackSchema>
export type ContentPackInput = z.input<typeof contentPackSchema>
