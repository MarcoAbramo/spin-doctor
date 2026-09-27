import {
  type Condition,
  type ContentPack,
  contentPackSchema,
  type DailyDef,
  type Effect,
  type GeneratorDef,
  type LexiconDef,
  type LocationDef,
  locationSchema,
  type PoolDef,
  type QualityTier,
  type QuestDef,
  type RealityCheckDef,
  type SpeakerDef,
  type StatDef,
  type Step,
  type UpgradeDef,
  type WorldDef,
} from './schema'

/** A generator with its defaults resolved by the loader. */
export type Generator = GeneratorDef & { location: string; costStat: string; produces: string }
/** An upgrade with its defaults resolved by the loader. */
export type Upgrade = UpgradeDef & { location: string; costStat: string }

/** Merged, validated content from all packs. */
export interface Content {
  world: WorldDef
  stats: StatDef[]
  /** Sorted by `order`; the first one is the starting location. */
  locations: LocationDef[]
  generators: Generator[]
  upgrades: Upgrade[]
  lexicon: LexiconDef[]
  realityChecks: RealityCheckDef[]
  quests: QuestDef[]
  dailies: DailyDef[]
  pools: PoolDef[]
  speakers: SpeakerDef[]
  i18n: Record<string, Record<string, string>>
  /** The id of the stat with role `currency`. */
  currency: string
}

export class ContentError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Invalid content:\n- ${problems.join('\n- ')}`)
  }
}

/** Handler ids the client knows how to render. Keep in sync with the client registry. */
export const KNOWN_HANDLERS = ['headline-swipe', 'president-post', 'zoll-tafel'] as const

export interface RawPack {
  /** File name, used in error messages. */
  source: string
  data: unknown
}

/** Used when a content set defines no location at all (e.g. minimal test packs). */
const DEFAULT_LOCATION = locationSchema.parse({
  id: 'main',
  order: 0,
  onSiteBonus: 1,
  scene: {
    background: 'scene-background',
    player: { x: 160, y: 372 },
    tapTarget: { sprite: 'scene-podium', x: 160, y: 400 },
  },
})

/** Parses and merges packs. Throws `ContentError` listing every problem found. */
export function loadContent(packs: RawPack[]): Content {
  const problems: string[] = []
  const parsed: ContentPack[] = []
  for (const pack of [...packs].sort((a, b) => a.source.localeCompare(b.source))) {
    const result = contentPackSchema.safeParse(pack.data)
    if (!result.success) {
      for (const issue of result.error.issues) {
        problems.push(`${pack.source}: ${issue.path.join('.')}: ${issue.message}`)
      }
      continue
    }
    parsed.push(result.data)
  }
  if (problems.length) throw new ContentError(problems)

  const stats = parsed.flatMap((p) => p.stats).sort((a, b) => a.order - b.order)
  const currencies = stats.filter((s) => s.role === 'currency')
  if (currencies.length !== 1)
    problems.push(`exactly one stat with role "currency" required, found ${currencies.length}`)
  const currency = currencies[0]?.id ?? ''

  const locations = parsed.flatMap((p) => p.locations).sort((a, b) => a.order - b.order)
  if (locations.length === 0) locations.push(DEFAULT_LOCATION)
  const home = locations[0]!.id

  const content: Content = {
    world: parsed.reduce<WorldDef>((w, p) => p.world ?? w, {}),
    stats,
    locations,
    generators: parsed
      .flatMap((p) => p.generators)
      .map((g) => ({
        ...g,
        location: g.location ?? home,
        costStat: g.costStat ?? currency,
        produces: g.produces ?? currency,
      }))
      .sort((a, b) => a.baseCost - b.baseCost),
    upgrades: parsed
      .flatMap((p) => p.upgrades)
      .map((u) => ({ ...u, location: u.location ?? home, costStat: u.costStat ?? currency }))
      .sort((a, b) => a.cost - b.cost),
    lexicon: parsed.flatMap((p) => p.lexicon),
    realityChecks: parsed.flatMap((p) => p.realityChecks),
    quests: parsed.flatMap((p) => p.quests),
    dailies: parsed.flatMap((p) => p.dailies),
    pools: parsed.flatMap((p) => p.pools),
    speakers: parsed.flatMap((p) => p.speakers),
    i18n: {},
    currency,
  }
  for (const pack of parsed) {
    for (const [lang, texts] of Object.entries(pack.i18n)) {
      content.i18n[lang] = { ...content.i18n[lang], ...texts }
    }
  }

  problems.push(...checkReferences(content))
  if (problems.length) throw new ContentError(problems)
  return content
}

function checkReferences(c: Content): string[] {
  const problems: string[] = []
  const ids = (kind: string, list: { id: string }[]) => {
    const set = new Set<string>()
    for (const item of list) {
      if (set.has(item.id)) problems.push(`duplicate ${kind} id "${item.id}"`)
      set.add(item.id)
    }
    return set
  }
  const stats = ids('stat', c.stats)
  const locations = ids('location', c.locations)
  const generators = ids('generator', c.generators)
  const upgrades = ids('upgrade', c.upgrades)
  const lexicon = ids('lexicon', c.lexicon)
  const quests = ids('quest', c.quests)
  const pools = ids('pool', c.pools)
  const speakers = ids('speaker', c.speakers)
  ids('daily', c.dailies)
  ids('reality check', c.realityChecks)

  const need = (where: string, set: Set<string>, kind: string, ref: string | undefined) => {
    if (ref !== undefined && !set.has(ref)) problems.push(`${where}: unknown ${kind} "${ref}"`)
  }

  const checkCondition = (where: string, cond: Condition | undefined): void => {
    if (!cond) return
    switch (cond.type) {
      case 'stat':
      case 'lifetime':
        need(where, stats, 'stat', cond.stat)
        break
      case 'generator':
        need(where, generators, 'generator', cond.generator)
        break
      case 'upgrade':
        need(where, upgrades, 'upgrade', cond.upgrade)
        break
      case 'quest':
        need(where, quests, 'quest', cond.quest)
        break
      case 'location':
      case 'locationUnlocked':
        need(where, locations, 'location', cond.location)
        break
      case 'all':
      case 'any':
        for (const c2 of cond.of) checkCondition(where, c2)
        break
      case 'not':
        checkCondition(where, cond.of)
        break
      default:
        break
    }
  }
  const checkTarget = (where: string, target: string) => {
    const [kind, ref] = target.split(':')
    if (!ref) return
    if (kind === 'generator') need(where, generators, 'generator', ref)
    if (kind === 'stat-gain') need(where, stats, 'stat', ref)
    if ((kind === 'location' && ref !== '@here') || kind === 'till-cap')
      need(where, locations, 'location', ref)
  }
  const checkEffects = (where: string, effects: Effect[]): void => {
    for (const e of effects) {
      if (e.type === 'addStat') need(where, stats, 'stat', e.stat)
      if (e.type === 'unlockLexicon') need(where, lexicon, 'lexicon card', e.card)
      if (e.type === 'multiplier') checkTarget(where, e.target)
      if (e.type === 'modifier') for (const m of e.effects) checkTarget(where, m.target)
      if (e.type === 'scandal') checkEffects(where, e.effects)
    }
  }
  const checkTiers = (where: string, tiers: QualityTier[]) => {
    for (const t of tiers) checkEffects(where, t.effects)
  }
  const checkStep = (where: string, step: Step) => {
    switch (step.type) {
      case 'dialog':
        need(where, speakers, 'speaker', step.speaker)
        for (const ch of step.choices ?? []) checkEffects(where, ch.effects)
        break
      case 'objective':
        checkCondition(where, step.condition)
        break
      case 'minigame':
      case 'timed':
        if (!(KNOWN_HANDLERS as readonly string[]).includes(step.handler))
          problems.push(`${where}: unknown handler "${step.handler}"`)
        need(where, pools, 'pool', step.pool)
        if (step.type === 'minigame') {
          checkEffects(where, step.effects)
          checkTiers(where, step.qualityEffects)
        } else {
          checkEffects(where, step.success)
          checkEffects(where, step.failure)
        }
        break
      case 'framing':
        need(where, speakers, 'speaker', step.speaker)
        for (const q of step.questions) for (const a of q.answers) checkEffects(where, a.effects)
        checkTiers(where, step.qualityEffects)
        break
      case 'ending':
        checkEffects(where, step.effects)
        break
    }
  }

  checkCondition('world mapUnlock', c.world.mapUnlock)
  for (const r of c.realityChecks) checkCondition(`reality check ${r.id}`, r.unlock)
  for (const s of c.stats) {
    if (s.min !== undefined && s.max !== undefined && s.min > s.max)
      problems.push(`stat ${s.id}: min > max`)
    need(`stat ${s.id} drift`, stats, 'stat', s.drift?.towardFrom?.stat)
    checkCondition(`stat ${s.id} visible`, s.visible)
  }
  for (const l of c.locations) {
    const where = `location ${l.id}`
    checkCondition(where, l.unlock)
    need(where, stats, 'stat', l.tap.stat)
    for (const t of l.traits) checkCondition(`${where} trait ${t.id}`, t.condition)
    if (l.hotspots && l.hotspots.minSec > l.hotspots.maxSec)
      problems.push(`${where}: hotspots minSec > maxSec`)
    for (const genId of Object.keys(l.scene.slots)) {
      const g = c.generators.find((x) => x.id === genId)
      if (!g) problems.push(`${where}: slot for unknown generator "${genId}"`)
      else if (g.location !== l.id)
        problems.push(`${where}: slot for generator "${genId}" of location "${g.location}"`)
    }
  }
  for (const g of c.generators) {
    const where = `generator ${g.id}`
    need(where, locations, 'location', g.location)
    need(where, stats, 'stat', g.costStat)
    need(where, stats, 'stat', g.produces)
    checkCondition(where, g.unlock)
    checkEffects(where, g.perUnitEffects)
  }
  for (const u of c.upgrades) {
    const where = `upgrade ${u.id}`
    need(where, locations, 'location', u.location)
    need(where, stats, 'stat', u.costStat)
    checkCondition(where, u.unlock)
    checkEffects(where, u.effects)
  }
  for (const q of c.quests) {
    need(`quest ${q.id}`, locations, 'location', q.location)
    checkCondition(`quest ${q.id}`, q.conditions)
    q.steps.forEach((s, i) => {
      checkStep(`quest ${q.id} step ${i}`, s)
    })
    checkEffects(`quest ${q.id} rewards`, q.rewards)
    if (q.trigger.type === 'random' && q.trigger.minSec > q.trigger.maxSec)
      problems.push(`quest ${q.id}: random trigger minSec > maxSec`)
  }
  for (const d of c.dailies) checkEffects(`daily ${d.id}`, d.rewards)
  return problems
}

/** All translation keys referenced by content, for completeness checks. */
export function requiredTextKeys(c: Content): string[] {
  const keys = new Set<string>()
  for (const s of c.stats) keys.add(`stat.${s.id}.name`)
  for (const l of c.locations) {
    keys.add(`location.${l.id}.name`)
    for (const t of l.traits) keys.add(t.labelKey)
    for (const h of l.hotspots?.events ?? []) keys.add(h.labelKey)
  }
  for (const g of c.generators) {
    keys.add(`generator.${g.id}.name`)
    keys.add(`generator.${g.id}.flavor`)
  }
  for (const u of c.upgrades) {
    keys.add(`upgrade.${u.id}.name`)
    keys.add(`upgrade.${u.id}.desc`)
  }
  for (const l of c.lexicon) {
    keys.add(`lexicon.${l.id}.title`)
    keys.add(`lexicon.${l.id}.body`)
  }
  for (const r of c.realityChecks) {
    keys.add(`reality.${r.id}.title`)
    keys.add(`reality.${r.id}.episode`)
    keys.add(`reality.${r.id}.body`)
  }
  for (const sp of c.speakers) keys.add(sp.nameKey)
  const addEffects = (effects: Effect[]) => {
    for (const e of effects) {
      if (e.type === 'modifier') keys.add(e.labelKey)
      if (e.type === 'scandal') addEffects(e.effects)
    }
  }
  const addTiers = (tiers: QualityTier[]) => {
    for (const t of tiers) {
      if (t.labelKey) keys.add(t.labelKey)
      addEffects(t.effects)
    }
  }
  for (const q of c.quests) {
    keys.add(q.titleKey)
    addEffects(q.rewards)
    for (const s of q.steps) {
      switch (s.type) {
        case 'dialog':
          for (const l of s.lines) keys.add(l)
          for (const ch of s.choices ?? []) {
            keys.add(ch.textKey)
            if (ch.replyKey) keys.add(ch.replyKey)
            addEffects(ch.effects)
          }
          break
        case 'objective':
          keys.add(s.textKey)
          break
        case 'timed':
          addEffects(s.success)
          addEffects(s.failure)
          break
        case 'minigame':
          addEffects(s.effects)
          addTiers(s.qualityEffects)
          break
        case 'framing':
          if (s.introKey) keys.add(s.introKey)
          for (const question of s.questions) {
            keys.add(question.textKey)
            for (const a of question.answers) {
              keys.add(a.textKey)
              if (a.replyKey) keys.add(a.replyKey)
              addEffects(a.effects)
            }
          }
          addTiers(s.qualityEffects)
          break
        case 'ending':
          keys.add(s.titleKey)
          for (const l of s.lines) keys.add(l)
          addEffects(s.effects)
          break
      }
    }
  }
  for (const d of c.dailies) keys.add(d.textKey)
  for (const p of c.pools) for (const e of p.entries) keys.add(e.key)
  return [...keys]
}
