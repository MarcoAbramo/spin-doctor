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
  /** The player is currently at this location. */
  | { type: 'location'; location: string }
  | { type: 'locationUnlocked'; location: string }
  /** Local hour in [from, to); wraps around midnight when from > to. */
  | { type: 'hour'; from: number; to: number }
  /** Local weekday, 0 = Sunday … 6 = Saturday. */
  | { type: 'weekday'; days: number[] }
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
    z.object({ type: z.literal('location'), location: id }),
    z.object({ type: z.literal('locationUnlocked'), location: id }),
    z.object({
      type: z.literal('hour'),
      from: z.number().int().min(0).max(23),
      to: z.number().int().min(0).max(24),
    }),
    z.object({
      type: z.literal('weekday'),
      days: z.array(z.number().int().min(0).max(6)).min(1),
    }),
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
 * - `production`         – all generators everywhere
 * - `generator:<id>`     – one generator
 * - `location:<id>`      – everything a location produces (news situation, hotspots)
 * - `location:@here`     – in `modifier` effects: the location where the player is when it applies
 * - `till-cap`           – capacity of every location till
 * - `till-cap:<id>`      – capacity of one location till
 * - `scandal-detection`  – chance that a scandal is noticed (lower is better for you)
 * - `stat-gain:<id>`     – positive changes to a stat
 */
const multiplierTarget = z
  .string()
  .regex(
    /^(tap|production|scandal-detection|till-cap|location:@here|(generator|location|till-cap|stat-gain):[a-z0-9-]+)$/,
  )

const passiveEffect = z.object({
  type: z.literal('multiplier'),
  target: multiplierTarget,
  value: z.number().positive(),
})

const simpleEffects = [
  passiveEffect,
  z.object({ type: z.literal('addStat'), stat: id, value: z.number() }),
  /** Grants `seconds` worth of the whole empire's currency production. */
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

/**
 * "Spin quality": the tier with the highest `minScore` that the result reaches is applied.
 * Framing scores are 0…1 (average answer quality), minigame scores are raw points.
 */
const qualityTierSchema = z.object({
  minScore: z.number(),
  labelKey: i18nKey.optional(),
  effects: z.array(effectSchema),
})
export type QualityTier = z.infer<typeof qualityTierSchema>

// ---------------------------------------------------------------------------
// Stats, generators, upgrades, lexicon
// ---------------------------------------------------------------------------

export const statSchema = z.object({
  id,
  /** `currency` is the main currency (exactly one); other stats may still be spent via `costStat`. */
  role: z.enum(['currency', 'meter']).default('meter'),
  initial: z.number(),
  min: z.number().optional(),
  max: z.number().optional(),
  display: z.enum(['number', 'percent', 'bar', 'hidden']).default('number'),
  /** Visual order in the HUD. */
  order: z.number().default(100),
  /** If set, the stat multiplies production by `base + value * perPoint`. */
  productionMultiplier: z.object({ base: z.number(), perPoint: z.number() }).optional(),
  /**
   * Slowly drifts towards `toward` at `perSec`. With `towardFrom`, the target moves with
   * another stat: `toward + value(towardFrom.stat) * towardFrom.perPoint`.
   */
  drift: z
    .object({
      toward: z.number(),
      perSec: z.number().positive(),
      towardFrom: z.object({ stat: id, perPoint: z.number() }).optional(),
    })
    .optional(),
  /** Change per manual tap. */
  perTap: z.number().optional(),
  /** Only shown in the HUD once this holds (e.g. after the first tariff). */
  visible: conditionSchema.optional(),
  emoji: z.string().optional(),
})
export type StatDef = z.infer<typeof statSchema>

export const generatorSchema = z.object({
  id,
  /** Location whose shop sells it and whose till it fills. Defaults to the first location. */
  location: id.optional(),
  baseCost: z.number().positive(),
  costFactor: z.number().gt(1).default(1.15),
  /** Stat paid for purchases. Defaults to the currency. */
  costStat: id.optional(),
  /** Stat it produces. Defaults to the currency. */
  produces: id.optional(),
  /** Units per second per owned unit. */
  rate: z.number().positive(),
  milestones: z.array(z.number().int().positive()).default([10, 25, 50, 100]),
  milestoneMultiplier: z.number().positive().default(2),
  /** Building projects (e.g. the wall) stop at this many units. */
  maxCount: z.number().int().positive().optional(),
  /** One-shot effects applied for every unit bought (e.g. democracy −1 per wall section). */
  perUnitEffects: z.array(effectSchema).default([]),
  /** Shown/buyable only when met. */
  unlock: conditionSchema.optional(),
  /** Placeholder sprite id in the scene (swap for real art later). */
  sprite: z.string().optional(),
  /**
   * Building projects shown on the city map (bottom-centre, world pixels). The sheet's
   * frames are the construction stages; the frame follows owned / maxCount.
   */
  mapSprite: z.object({ sprite: z.string(), x: z.number(), y: z.number() }).optional(),
  /** Emoji used as icon until real art exists. */
  emoji: z.string().optional(),
})
export type GeneratorDef = z.infer<typeof generatorSchema>

export const upgradeSchema = z.object({
  id,
  /** Location whose shop sells it. Effects are global unless they target something. */
  location: id.optional(),
  cost: z.number().nonnegative(),
  costStat: id.optional(),
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
// Locations (levels on the map)
// ---------------------------------------------------------------------------

const placedSprite = z.object({ sprite: z.string(), x: z.number(), y: z.number() })
const transitionSchema = z.object({
  /** Transition preset in the client (e.g. `door`, `gate`, `stamp`, `plane`). */
  preset: z.string().default('door'),
  sprite: z.string().optional(),
  sound: z.string().optional(),
})

export const locationSchema = z.object({
  id,
  order: z.number().default(100),
  /** Condition to enter. The first location is always open. */
  unlock: conditionSchema.optional(),
  /** Object name of the entrance in the Tiled map. */
  mapEntrance: z.string().optional(),
  emoji: z.string().optional(),
  /** Production multiplier while you are there (the rest goes into the till). */
  onSiteBonus: z.number().positive().default(1.5),
  tap: z.object({ stat: id.optional(), multiplier: z.number().positive().default(1) }).prefault({}),
  /** The till holds this many minutes of the location's production. */
  till: z.object({ capMinutes: z.number().positive().default(60) }).prefault({}),
  /** Time-based properties, e.g. prime time or weekends. */
  traits: z
    .array(
      z.object({
        id,
        condition: conditionSchema,
        multiplier: z.number().positive(),
        labelKey: i18nKey,
      }),
    )
    .default([]),
  /** Random location events that temporarily change the yield. */
  hotspots: z
    .object({
      minSec: z.number().positive(),
      maxSec: z.number().positive(),
      events: z
        .array(
          z.object({
            id,
            labelKey: i18nKey,
            multiplier: z.number().positive(),
            durationSec: z.number().positive(),
            weight: z.number().positive().default(1),
          }),
        )
        .min(1),
    })
    .optional(),
  /** The idle scene, in art pixels (320×400 play area, see docs/ASSET_GUIDE.md). */
  scene: z.object({
    background: z.string(),
    /** Visible height; the top of the room may be cropped on short screens. */
    viewH: z.number().positive().default(350),
    /** Colours that extend the background beyond its edges on wide/tall screens. */
    backdrop: z
      .object({
        top: z.string().default('#124e89'),
        bottom: z.string().default('#733e39'),
        splitY: z.number().default(290),
      })
      .prefault({}),
    props: z.array(placedSprite).default([]),
    player: z.object({ x: z.number(), y: z.number() }),
    tapTarget: placedSprite,
    /** Where generator props stand: up to 3 copies each (1, 10 and 25 units). */
    slots: z.record(z.string(), z.array(z.tuple([z.number(), z.number()]))).default({}),
  }),
  enter: transitionSchema.optional(),
  exit: transitionSchema.optional(),
})
export type LocationDef = z.infer<typeof locationSchema>

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------

const choiceSchema = z.object({
  textKey: i18nKey,
  replyKey: i18nKey.optional(),
  effects: z.array(effectSchema).default([]),
})

const framingAnswerSchema = z.object({
  textKey: i18nKey,
  /** How convincing this spin is, 0 (disaster) … 1 (masterpiece). */
  score: z.number().min(0).max(1),
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
    qualityEffects: z.array(qualityTierSchema).default([]),
  }),
  z.object({
    type: z.literal('timed'),
    handler: id,
    timeoutSec: z.number().positive(),
    pool: id.optional(),
    success: z.array(effectSchema),
    failure: z.array(effectSchema),
  }),
  /**
   * Framing duel: questions from the press, pick the best spin before time runs out.
   * The average answer score drives rewards and `qualityEffects`.
   */
  z.object({
    type: z.literal('framing'),
    speaker: id.optional(),
    introKey: i18nKey.optional(),
    timePerQuestionSec: z.number().positive().default(8),
    questions: z
      .array(z.object({ textKey: i18nKey, answers: z.array(framingAnswerSchema).min(2).max(4) }))
      .min(1),
    /** Reward = sum of answer scores × this many seconds of production. */
    productionSecondsPerPoint: z.number().nonnegative().default(0),
    qualityEffects: z.array(qualityTierSchema).default([]),
  }),
  /** An ending screen (e.g. election night). */
  z.object({
    type: z.literal('ending'),
    titleKey: i18nKey,
    lines: z.array(i18nKey).min(1),
    effects: z.array(effectSchema).default([]),
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
  /** Only starts while the player is at this location. */
  location: id.optional(),
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

/** World-wide settings (the last pack that defines it wins). */
export const worldSchema = z.object({
  /** When the city map becomes available. Without it the map is always open. */
  mapUnlock: conditionSchema.optional(),
})
export type WorldDef = z.infer<typeof worldSchema>

// ---------------------------------------------------------------------------
// Pack
// ---------------------------------------------------------------------------

export const contentPackSchema = z.object({
  $schema: z.string().optional(),
  world: worldSchema.optional(),
  stats: z.array(statSchema).default([]),
  locations: z.array(locationSchema).default([]),
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
