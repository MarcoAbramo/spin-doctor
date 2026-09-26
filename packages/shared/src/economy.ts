import { check } from './conditions'
import type { Content } from './content'
import type { Effect, GeneratorDef, StatDef } from './schema'
import { type GameState, random } from './state'

/** Base spin per tap before multipliers. */
export const TAP_BASE = 1
/** Share of per-second production added to every tap, so tapping stays relevant later. */
export const TAP_PRODUCTION_SHARE = 0.02

/** Product of all active multipliers for a target (owned upgrades + active modifiers). */
export function multiplier(state: GameState, content: Content, target: string): number {
  let m = 1
  for (const u of content.upgrades) {
    if (!state.upgrades.includes(u.id)) continue
    for (const e of u.effects) if (e.type === 'multiplier' && e.target === target) m *= e.value
  }
  for (const mod of state.modifiers) {
    if (mod.until <= state.now) continue
    for (const e of mod.effects) if (e.target === target) m *= e.value
  }
  return m
}

export function milestonesReached(g: GeneratorDef, count: number): number {
  return g.milestones.filter((m) => count >= m).length
}

/** Currency/s of one generator type (all owned units), without global multipliers. */
export function generatorRate(state: GameState, content: Content, g: GeneratorDef): number {
  const count = state.generators[g.id] ?? 0
  if (count === 0) return 0
  return (
    g.rate *
    count *
    g.milestoneMultiplier ** milestonesReached(g, count) *
    multiplier(state, content, `generator:${g.id}`)
  )
}

/** Multiplier derived from stats with `productionMultiplier` (e.g. approval rating). */
export function statProductionMultiplier(state: GameState, content: Content): number {
  let m = 1
  for (const s of content.stats) {
    if (!s.productionMultiplier) continue
    m *= Math.max(
      0,
      s.productionMultiplier.base + (state.stats[s.id] ?? 0) * s.productionMultiplier.perPoint,
    )
  }
  return m
}

export function productionPerSecond(state: GameState, content: Content): number {
  let sum = 0
  for (const g of content.generators) sum += generatorRate(state, content, g)
  return sum * multiplier(state, content, 'production') * statProductionMultiplier(state, content)
}

export function tapValue(state: GameState, content: Content): number {
  return (
    TAP_BASE * multiplier(state, content, 'tap') +
    productionPerSecond(state, content) * TAP_PRODUCTION_SHARE
  )
}

export function generatorCost(g: GeneratorDef, owned: number): number {
  return Math.ceil(g.baseCost * g.costFactor ** owned)
}

function clampStat(def: StatDef | undefined, value: number): number {
  if (!def) return value
  let v = value
  if (def.min !== undefined) v = Math.max(def.min, v)
  if (def.max !== undefined) v = Math.min(def.max, v)
  return v
}

/** Mutating helper: changes a stat, honouring gain multipliers, bounds and lifetime totals. */
export function addStat(state: GameState, content: Content, stat: string, delta: number): void {
  const def = content.stats.find((s) => s.id === stat)
  const value = delta > 0 ? delta * multiplier(state, content, `stat-gain:${stat}`) : delta
  const before = state.stats[stat] ?? 0
  const after = clampStat(def, before + value)
  state.stats[stat] = after
  if (after > before) state.lifetime[stat] = (state.lifetime[stat] ?? 0) + (after - before)
}

export function addCounter(state: GameState, counter: string, value = 1): void {
  state.counters[counter] = (state.counters[counter] ?? 0) + value
}

/** Mutating helper: applies one-shot effects. `multiplier` effects are passive and ignored here. */
export function applyEffects(state: GameState, content: Content, effects: Effect[]): void {
  for (const e of effects) {
    switch (e.type) {
      case 'multiplier':
        break
      case 'addStat':
        addStat(state, content, e.stat, e.value)
        break
      case 'productionSeconds':
        addStat(state, content, content.currency, productionPerSecond(state, content) * e.seconds)
        break
      case 'setFlag':
        if (!state.flags.includes(e.flag)) state.flags.push(e.flag)
        break
      case 'unlockLexicon':
        if (!state.lexicon.includes(e.card)) {
          state.lexicon.push(e.card)
          state.events.push({ type: 'lexicon-unlocked', card: e.card })
        }
        break
      case 'counter':
        addCounter(state, e.counter, e.value)
        break
      case 'modifier':
        state.modifiers = state.modifiers.filter((m) => m.id !== e.id)
        state.modifiers.push({
          id: e.id,
          until: state.now + e.durationSec * 1000,
          labelKey: e.labelKey,
          effects: e.effects,
        })
        state.events.push({ type: 'modifier-added', id: e.id })
        break
      case 'scandal': {
        addCounter(state, 'scandals')
        const detection = Math.min(1, multiplier(state, content, 'scandal-detection'))
        const noticed = random(state) < detection
        state.events.push({ type: 'scandal', noticed })
        if (noticed) applyEffects(state, content, e.effects)
        else addCounter(state, 'scandals-unnoticed')
        break
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Player actions on the economy (mutating helpers; pure wrappers live in actions.ts)
// ---------------------------------------------------------------------------

export function doTap(state: GameState, content: Content): number {
  const value = tapValue(state, content)
  addStat(state, content, content.currency, value)
  for (const s of content.stats) if (s.perTap) addStat(state, content, s.id, s.perTap)
  addCounter(state, 'taps')
  return value
}

export function isGeneratorVisible(state: GameState, content: Content, g: GeneratorDef): boolean {
  return (state.generators[g.id] ?? 0) > 0 || check(state, content, g.unlock)
}

export function doBuyGenerator(state: GameState, content: Content, id: string): boolean {
  const g = content.generators.find((x) => x.id === id)
  if (!g || !isGeneratorVisible(state, content, g)) return false
  const owned = state.generators[id] ?? 0
  const cost = generatorCost(g, owned)
  if ((state.stats[content.currency] ?? 0) < cost) return false
  state.stats[content.currency] = (state.stats[content.currency] ?? 0) - cost
  state.generators[id] = owned + 1
  addCounter(state, 'generators-bought')
  if (g.milestones.includes(owned + 1))
    state.events.push({ type: 'milestone', generator: id, count: owned + 1 })
  return true
}

export function doBuyUpgrade(state: GameState, content: Content, id: string): boolean {
  const u = content.upgrades.find((x) => x.id === id)
  if (!u || state.upgrades.includes(id) || !check(state, content, u.unlock)) return false
  if ((state.stats[content.currency] ?? 0) < u.cost) return false
  state.stats[content.currency] = (state.stats[content.currency] ?? 0) - u.cost
  state.upgrades.push(id)
  applyEffects(state, content, u.effects)
  addCounter(state, 'upgrades-bought')
  return true
}

/** Moves drifting stats towards their target and drops expired modifiers. */
export function applyDriftAndExpiry(state: GameState, content: Content, dtSec: number): void {
  for (const s of content.stats) {
    if (!s.drift) continue
    const v = state.stats[s.id] ?? 0
    const step = s.drift.perSec * dtSec
    const diff = s.drift.toward - v
    state.stats[s.id] = Math.abs(diff) <= step ? s.drift.toward : v + Math.sign(diff) * step
  }
  state.modifiers = state.modifiers.filter((m) => m.until > state.now)
}
