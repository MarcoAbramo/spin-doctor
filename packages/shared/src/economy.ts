import { check, isLocationUnlocked } from './conditions'
import type { Content, Generator } from './content'
import type { Effect, GeneratorDef, LocationDef, QualityTier, StatDef } from './schema'
import { emptyLocationState, type GameState, type LocationState, random } from './state'

/** Base spin per tap before multipliers. */
export const TAP_BASE = 1
/** Share of the current location's per-second production added to every tap. */
export const TAP_PRODUCTION_SHARE = 0.02

/** Product of all active multipliers for a target (owned upgrades + active modifiers). */
export function multiplier(state: GameState, content: Content, target: string): number {
  let m = 1
  for (const u of content.upgrades) {
    if (!state.upgrades.includes(u.id)) continue
    for (const e of u.effects) if (e.type === 'multiplier' && e.target === target) m *= e.value
  }
  // Building projects: every owned unit keeps its passive bonus (e.g. per wall section).
  for (const g of content.generators) {
    const owned = state.generators[g.id] ?? 0
    if (owned <= 0) continue
    for (const e of g.perUnitEffects)
      if (e.type === 'multiplier' && e.target === target) m *= e.value ** owned
  }
  // Completed quests keep passive rewards.
  for (const q of content.quests) {
    if (!state.quests.completed.includes(q.id)) continue
    for (const e of q.rewards) if (e.type === 'multiplier' && e.target === target) m *= e.value
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

/** Output/s of one generator type (all owned units), without location-wide multipliers. */
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

// ---------------------------------------------------------------------------
// Location economy
// ---------------------------------------------------------------------------

export function getLocation(content: Content, id: string): LocationDef {
  return content.locations.find((l) => l.id === id) ?? content.locations[0]!
}

export function currentLocation(state: GameState, content: Content): LocationDef {
  return getLocation(content, state.location)
}

export function locationState(state: GameState, id: string): LocationState {
  let ls = state.locations[id]
  if (!ls) {
    ls = emptyLocationState(state.now)
    state.locations[id] = ls
  }
  return ls
}

/** Time-based traits that currently apply (e.g. prime time). */
export function activeTraits(state: GameState, content: Content, id: string) {
  return getLocation(content, id).traits.filter((t) => check(state, content, t.condition))
}

/**
 * Everything that scales a location's output: global production, approval,
 * news situation (`location:<id>` modifiers, hotspots), traits and the on-site bonus.
 */
export function locationFactor(
  state: GameState,
  content: Content,
  id: string,
  onSite = id === state.location,
): number {
  const loc = getLocation(content, id)
  let m =
    multiplier(state, content, 'production') *
    statProductionMultiplier(state, content) *
    multiplier(state, content, `location:${id}`)
  for (const t of activeTraits(state, content, id)) m *= t.multiplier
  return onSite ? m * loc.onSiteBonus : m
}

export function generatorsAt(content: Content, id: string): Generator[] {
  return content.generators.filter((g) => g.location === id)
}

/** Stats a location produces (usually just the currency). */
export function producedStats(content: Content, id: string): string[] {
  return [...new Set(generatorsAt(content, id).map((g) => g.produces))]
}

/** Output per second of one stat at one location. */
export function locationRate(
  state: GameState,
  content: Content,
  id: string,
  stat = content.currency,
  onSite = id === state.location,
): number {
  let sum = 0
  for (const g of generatorsAt(content, id))
    if (g.produces === stat) sum += generatorRate(state, content, g)
  return sum === 0 ? 0 : sum * locationFactor(state, content, id, onSite)
}

/** The whole empire's output per second of a stat (all unlocked locations). */
export function productionPerSecond(
  state: GameState,
  content: Content,
  stat = content.currency,
): number {
  let sum = 0
  for (const l of content.locations)
    if (isLocationUnlocked(state, content, l.id)) sum += locationRate(state, content, l.id, stat)
  return sum
}

/** How much a till can hold: `capMinutes` of the location's (off-site) production. */
export function tillCap(
  state: GameState,
  content: Content,
  id: string,
  stat = content.currency,
): number {
  const loc = getLocation(content, id)
  return (
    loc.till.capMinutes *
    60 *
    locationRate(state, content, id, stat, false) *
    multiplier(state, content, 'till-cap') *
    multiplier(state, content, `till-cap:${id}`)
  )
}

/**
 * Mutating helper: pays the current location directly and fills every other
 * unlocked location's till up to its cap. Closed form, so it also works for offline time.
 */
export function distributeProduction(state: GameState, content: Content, dtSec: number): void {
  if (dtSec <= 0) return
  for (const loc of content.locations) {
    if (!isLocationUnlocked(state, content, loc.id)) continue
    const ls = locationState(state, loc.id)
    const here = loc.id === state.location
    for (const stat of producedStats(content, loc.id)) {
      const rate = locationRate(state, content, loc.id, stat)
      if (rate <= 0) continue
      let amount = rate * dtSec
      if (here) {
        addStat(state, content, stat, amount)
      } else {
        const cap = tillCap(state, content, loc.id, stat)
        const current = ls.till[stat] ?? 0
        amount = Math.max(0, Math.min(amount, cap - current))
        ls.till[stat] = current + amount
        if (stat === content.currency && !ls.fullNotified && ls.till[stat]! >= cap * 0.999) {
          ls.fullNotified = true
          state.events.push({ type: 'till-full', location: loc.id })
        }
      }
      ls.producedSinceVisit[stat] = (ls.producedSinceVisit[stat] ?? 0) + amount
      ls.lifetime[stat] = (ls.lifetime[stat] ?? 0) + amount
    }
  }
}

/** Mutating helper: moves the player and collects the destination's till. */
export function travelMut(state: GameState, content: Content, to: string): boolean {
  if (to === state.location || !isLocationUnlocked(state, content, to)) return false
  const from = state.location
  const left = locationState(state, from)
  left.lastVisitAt = state.now
  left.producedSinceVisit = {}

  state.location = to
  const arrived = locationState(state, to)
  const amounts: Record<string, number> = {}
  for (const [stat, value] of Object.entries(arrived.till)) {
    if (value <= 0) continue
    addStat(state, content, stat, value)
    amounts[stat] = value
  }
  arrived.till = {}
  arrived.fullNotified = false
  arrived.producedSinceVisit = {}
  arrived.lastVisitAt = state.now
  arrived.visits += 1
  addCounter(state, 'travels')
  state.events.push({ type: 'travelled', from, to })
  state.events.push({ type: 'till-collected', location: to, amounts })
  const fee = getLocation(content, to).entryFee
  if (fee) {
    const stat = fee.stat ?? content.currency
    const paid = Math.min(fee.amount, state.stats[stat] ?? 0)
    state.stats[stat] = (state.stats[stat] ?? 0) - paid
    state.events.push({ type: 'entry-fee', location: to, stat, amount: paid })
  }
  return true
}

/** Schedules and fires random location events ("hotspots"). */
export function updateHotspots(state: GameState, content: Content): void {
  for (const loc of content.locations) {
    const h = loc.hotspots
    if (!h || !isLocationUnlocked(state, content, loc.id)) continue
    const schedule = () => {
      state.hotspots[loc.id] = state.now + (h.minSec + random(state) * (h.maxSec - h.minSec)) * 1000
    }
    const at = state.hotspots[loc.id]
    if (at === undefined) {
      schedule()
      continue
    }
    if (state.now < at) continue
    const total = h.events.reduce((sum, e) => sum + e.weight, 0)
    let roll = random(state) * total
    let event = h.events[0]!
    for (const candidate of h.events) {
      event = candidate
      roll -= candidate.weight
      if (roll < 0) break
    }
    const id = `hotspot-${loc.id}`
    state.modifiers = state.modifiers.filter((m) => m.id !== id)
    state.modifiers.push({
      id,
      until: state.now + event.durationSec * 1000,
      labelKey: event.labelKey,
      effects: [{ type: 'multiplier', target: `location:${loc.id}`, value: event.multiplier }],
    })
    state.events.push({
      type: 'hotspot',
      location: loc.id,
      id: event.id,
      multiplier: event.multiplier,
    })
    schedule()
  }
}

// ---------------------------------------------------------------------------
// Stats & effects
// ---------------------------------------------------------------------------

export function tapValue(state: GameState, content: Content): number {
  const loc = currentLocation(state, content)
  return (
    TAP_BASE * multiplier(state, content, 'tap') * loc.tap.multiplier +
    locationRate(state, content, loc.id) * TAP_PRODUCTION_SHARE
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
          // `location:@here` binds to wherever the player is right now.
          effects: e.effects.map((m) =>
            m.target === 'location:@here' ? { ...m, target: `location:${state.location}` } : m,
          ),
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

/** Applies the best quality tier the score reaches ("spin quality"). */
export function applyQuality(
  state: GameState,
  content: Content,
  quest: string,
  tiers: QualityTier[],
  score: number,
): void {
  const tier = [...tiers].sort((a, b) => b.minScore - a.minScore).find((t) => score >= t.minScore)
  state.events.push({ type: 'quality', quest, score, labelKey: tier?.labelKey })
  if (tier) applyEffects(state, content, tier.effects)
}

// ---------------------------------------------------------------------------
// Player actions on the economy (mutating helpers; pure wrappers live in sim.ts)
// ---------------------------------------------------------------------------

export function doTap(state: GameState, content: Content): number {
  const loc = currentLocation(state, content)
  const value = tapValue(state, content)
  addStat(state, content, loc.tap.stat ?? content.currency, value)
  for (const s of content.stats) if (s.perTap) addStat(state, content, s.id, s.perTap)
  addCounter(state, 'taps')
  return value
}

export function isGeneratorVisible(state: GameState, content: Content, g: GeneratorDef): boolean {
  return (state.generators[g.id] ?? 0) > 0 || check(state, content, g.unlock)
}

export function isGeneratorMaxed(state: GameState, g: GeneratorDef): boolean {
  return g.maxCount !== undefined && (state.generators[g.id] ?? 0) >= g.maxCount
}

export function doBuyGenerator(state: GameState, content: Content, id: string): boolean {
  const g = content.generators.find((x) => x.id === id)
  if (!g || !isGeneratorVisible(state, content, g) || isGeneratorMaxed(state, g)) return false
  const owned = state.generators[id] ?? 0
  const cost = generatorCost(g, owned)
  if ((state.stats[g.costStat] ?? 0) < cost) return false
  state.stats[g.costStat] = (state.stats[g.costStat] ?? 0) - cost
  state.generators[id] = owned + 1
  addCounter(state, 'generators-bought')
  applyEffects(state, content, g.perUnitEffects)
  if (g.milestones.includes(owned + 1))
    state.events.push({ type: 'milestone', generator: id, count: owned + 1 })
  return true
}

export function doBuyUpgrade(state: GameState, content: Content, id: string): boolean {
  const u = content.upgrades.find((x) => x.id === id)
  if (!u || state.upgrades.includes(id) || !check(state, content, u.unlock)) return false
  if ((state.stats[u.costStat] ?? 0) < u.cost) return false
  state.stats[u.costStat] = (state.stats[u.costStat] ?? 0) - u.cost
  state.upgrades.push(id)
  applyEffects(state, content, u.effects)
  addCounter(state, 'upgrades-bought')
  return true
}

/** Moves drifting stats towards their target and drops expired modifiers. */
export function applyDriftAndExpiry(state: GameState, content: Content, dtSec: number): void {
  for (const s of content.stats) {
    if (!s.drift) continue
    const from = s.drift.towardFrom
    const toward = s.drift.toward + (from ? (state.stats[from.stat] ?? 0) * from.perPoint : 0)
    const v = state.stats[s.id] ?? 0
    const step = s.drift.perSec * dtSec
    const diff = toward - v
    state.stats[s.id] = clampStat(s, Math.abs(diff) <= step ? toward : v + Math.sign(diff) * step)
  }
  state.modifiers = state.modifiers.filter((m) => m.until > state.now)
}
