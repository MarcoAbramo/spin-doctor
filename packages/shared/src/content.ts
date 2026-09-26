import {
  type Condition,
  type ContentPack,
  contentPackSchema,
  type DailyDef,
  type Effect,
  type GeneratorDef,
  type LexiconDef,
  type PoolDef,
  type QuestDef,
  type SpeakerDef,
  type StatDef,
  type Step,
  type UpgradeDef,
} from './schema'

/** Merged, validated content from all packs. Order of arrays = order of packs. */
export interface Content {
  stats: StatDef[]
  generators: GeneratorDef[]
  upgrades: UpgradeDef[]
  lexicon: LexiconDef[]
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
export const KNOWN_HANDLERS = ['headline-swipe', 'president-post'] as const

export interface RawPack {
  /** File name, used in error messages. */
  source: string
  data: unknown
}

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

  const content: Content = {
    stats: parsed.flatMap((p) => p.stats).sort((a, b) => a.order - b.order),
    generators: parsed.flatMap((p) => p.generators).sort((a, b) => a.baseCost - b.baseCost),
    upgrades: parsed.flatMap((p) => p.upgrades).sort((a, b) => a.cost - b.cost),
    lexicon: parsed.flatMap((p) => p.lexicon),
    quests: parsed.flatMap((p) => p.quests),
    dailies: parsed.flatMap((p) => p.dailies),
    pools: parsed.flatMap((p) => p.pools),
    speakers: parsed.flatMap((p) => p.speakers),
    i18n: {},
    currency: '',
  }
  for (const pack of parsed) {
    for (const [lang, texts] of Object.entries(pack.i18n)) {
      content.i18n[lang] = { ...content.i18n[lang], ...texts }
    }
  }

  const currencies = content.stats.filter((s) => s.role === 'currency')
  if (currencies.length !== 1) {
    problems.push(`exactly one stat with role "currency" required, found ${currencies.length}`)
  } else {
    content.currency = currencies[0]!.id
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
  const generators = ids('generator', c.generators)
  const upgrades = ids('upgrade', c.upgrades)
  const lexicon = ids('lexicon', c.lexicon)
  const quests = ids('quest', c.quests)
  const pools = ids('pool', c.pools)
  const speakers = ids('speaker', c.speakers)
  ids('daily', c.dailies)

  const checkCondition = (where: string, cond: Condition | undefined): void => {
    if (!cond) return
    switch (cond.type) {
      case 'stat':
      case 'lifetime':
        if (!stats.has(cond.stat)) problems.push(`${where}: unknown stat "${cond.stat}"`)
        break
      case 'generator':
        if (!generators.has(cond.generator))
          problems.push(`${where}: unknown generator "${cond.generator}"`)
        break
      case 'upgrade':
        if (!upgrades.has(cond.upgrade))
          problems.push(`${where}: unknown upgrade "${cond.upgrade}"`)
        break
      case 'quest':
        if (!quests.has(cond.quest)) problems.push(`${where}: unknown quest "${cond.quest}"`)
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
  const checkEffects = (where: string, effects: Effect[]): void => {
    for (const e of effects) {
      if (e.type === 'addStat' && !stats.has(e.stat))
        problems.push(`${where}: unknown stat "${e.stat}"`)
      if (e.type === 'unlockLexicon' && !lexicon.has(e.card))
        problems.push(`${where}: unknown lexicon card "${e.card}"`)
      if (e.type === 'multiplier') checkTarget(where, e.target)
      if (e.type === 'modifier') for (const m of e.effects) checkTarget(where, m.target)
      if (e.type === 'scandal') checkEffects(where, e.effects)
    }
  }
  const checkTarget = (where: string, target: string) => {
    const [kind, ref] = target.split(':')
    if (kind === 'generator' && ref && !generators.has(ref))
      problems.push(`${where}: unknown generator "${ref}" in multiplier`)
    if (kind === 'stat-gain' && ref && !stats.has(ref))
      problems.push(`${where}: unknown stat "${ref}" in multiplier`)
  }
  const checkStep = (where: string, step: Step) => {
    switch (step.type) {
      case 'dialog':
        if (!speakers.has(step.speaker))
          problems.push(`${where}: unknown speaker "${step.speaker}"`)
        for (const ch of step.choices ?? []) checkEffects(where, ch.effects)
        break
      case 'objective':
        checkCondition(where, step.condition)
        break
      case 'minigame':
      case 'timed':
        if (!(KNOWN_HANDLERS as readonly string[]).includes(step.handler))
          problems.push(`${where}: unknown handler "${step.handler}"`)
        if (step.pool && !pools.has(step.pool))
          problems.push(`${where}: unknown pool "${step.pool}"`)
        if (step.type === 'minigame') checkEffects(where, step.effects)
        else {
          checkEffects(where, step.success)
          checkEffects(where, step.failure)
        }
        break
    }
  }

  for (const s of c.stats) {
    if (s.min !== undefined && s.max !== undefined && s.min > s.max)
      problems.push(`stat ${s.id}: min > max`)
  }
  for (const g of c.generators) checkCondition(`generator ${g.id}`, g.unlock)
  for (const u of c.upgrades) {
    checkCondition(`upgrade ${u.id}`, u.unlock)
    checkEffects(`upgrade ${u.id}`, u.effects)
  }
  for (const q of c.quests) {
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
  for (const sp of c.speakers) keys.add(sp.nameKey)
  const addEffects = (effects: Effect[]) => {
    for (const e of effects) {
      if (e.type === 'modifier') keys.add(e.labelKey)
      if (e.type === 'scandal') addEffects(e.effects)
    }
  }
  for (const q of c.quests) {
    keys.add(q.titleKey)
    addEffects(q.rewards)
    for (const s of q.steps) {
      if (s.type === 'dialog') {
        for (const l of s.lines) keys.add(l)
        for (const ch of s.choices ?? []) {
          keys.add(ch.textKey)
          if (ch.replyKey) keys.add(ch.replyKey)
          addEffects(ch.effects)
        }
      }
      if (s.type === 'objective') keys.add(s.textKey)
      if (s.type === 'timed') {
        addEffects(s.success)
        addEffects(s.failure)
      }
    }
  }
  for (const d of c.dailies) keys.add(d.textKey)
  for (const p of c.pools) for (const e of p.entries) keys.add(e.key)
  return [...keys]
}
