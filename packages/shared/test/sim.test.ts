import { describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/load-content'
import {
  answerDialog,
  applyOffline,
  buyGenerator,
  buyUpgrade,
  type Content,
  ContentError,
  createInitialState,
  exportSave,
  finishMinigame,
  focusedQuest,
  formatNumber,
  type GameState,
  generatorCost,
  importSave,
  loadContent,
  OFFLINE_CAP_SEC,
  previousDate,
  productionPerSecond,
  resolveTimed,
  SaveError,
  startQuest,
  tap,
  tick,
} from '../src'

const content = loadContentFromDisk()
const T0 = Date.UTC(2026, 8, 26, 12)
const ctx = (now: number, localDate = '2026-09-26') => ({ now, localDate })

function fresh(): GameState {
  return createInitialState(content, T0, 42)
}

function withSpin(state: GameState, spin: number): GameState {
  return { ...state, stats: { ...state.stats, spin } }
}

/** Clicks through the onboarding (dialogs, taps, first intern). */
function finishIntro(start: GameState): GameState {
  let s = tick(start, content, 0, ctx(T0))
  const answer = () => {
    const f = focusedQuest(s, content)
    if (f?.step.type === 'dialog')
      s = answerDialog(s, content, f.quest.id, f.step.choices ? 0 : undefined)
  }
  for (let i = 0; i < 3; i++) answer()
  for (let i = 0; i < 10; i++) s = tap(s, content)
  s = buyGenerator(withSpin(s, 100), content, 'intern')
  answer()
  return s
}

describe('content', () => {
  it('loads all packs with exactly one currency', () => {
    expect(content.currency).toBe('spin')
    expect(content.generators.filter((g) => g.location === 'press-house')).toHaveLength(6)
    expect(content.upgrades.length).toBeGreaterThanOrEqual(8)
    expect(content.lexicon.length).toBeGreaterThanOrEqual(3)
    expect(content.locations[0]?.id).toBe('press-house')
  })

  it('reports broken references', () => {
    const bad = {
      source: 'bad.json',
      data: {
        stats: [{ id: 'spin', role: 'currency', initial: 0 }],
        upgrades: [{ id: 'x', cost: 1, effects: [{ type: 'addStat', stat: 'nope', value: 1 }] }],
      },
    }
    expect(() => loadContent([bad])).toThrow(ContentError)
  })

  it('lets a pack add a new stat that existing saves pick up', () => {
    const extra = { source: 'zz-extra.json', data: { stats: [{ id: 'conscience', initial: 7 }] } }
    const packs = [
      ...['core/stats.json'].map((source) => ({
        source,
        data: { stats: [{ id: 'spin', role: 'currency', initial: 0 }] },
      })),
      extra,
    ]
    const c2 = loadContent(packs)
    const s = createInitialState(c2, T0)
    expect(s.stats.conscience).toBe(7)
  })
})

describe('economy', () => {
  it('scales costs by 1.15 per unit', () => {
    const intern = content.generators.find((g) => g.id === 'intern')!
    expect(generatorCost(intern, 0)).toBe(15)
    expect(generatorCost(intern, 1)).toBe(Math.ceil(15 * 1.15))
  })

  it('tapping produces spin and counts statements', () => {
    const s = tap(fresh(), content)
    expect(s.stats.spin).toBeGreaterThan(0)
    expect(s.counters.statements).toBe(1)
  })

  it('does not mutate the input state (purity)', () => {
    const s0 = fresh()
    const snapshot = JSON.stringify(s0)
    tap(s0, content)
    tick(s0, content, 10, ctx(T0 + 10_000))
    expect(JSON.stringify(s0)).toBe(snapshot)
  })

  it('buys generators only when affordable and produces idle income', () => {
    let s = buyGenerator(fresh(), content, 'intern')
    expect(s.generators.intern).toBe(0)
    s = buyGenerator(withSpin(s, 15), content, 'intern')
    expect(s.generators.intern).toBe(1)
    expect(s.stats.spin).toBe(0)
    const after = tick(s, content, 10, ctx(T0 + 10_000))
    expect(after.stats.spin).toBeCloseTo(10 * productionPerSecond(s, content), 5)
  })

  it('doubles production at milestones', () => {
    let s = withSpin(fresh(), 1e9)
    for (let i = 0; i < 9; i++) s = buyGenerator(s, content, 'intern')
    const before = productionPerSecond(s, content)
    s = buyGenerator(s, content, 'intern')
    expect(s.events).toContainEqual({ type: 'milestone', generator: 'intern', count: 10 })
    expect(productionPerSecond(s, content)).toBeCloseTo((before / 9) * 10 * 2, 5)
  })

  it('dark upgrades erode democracy and unlock lexicon cards', () => {
    let s = withSpin(fresh(), 1e6)
    s = { ...s, lifetime: { ...s.lifetime, spin: 1e6 } }
    s = buyUpgrade(s, content, 'favourite-journalists')
    expect(s.stats.democracy).toBe(90)
    expect(s.lexicon).toContain('press-freedom')
  })

  it('is deterministic', () => {
    const run = () => {
      let s = finishIntro(fresh())
      for (let i = 1; i <= 50; i++) s = tick(s, content, 20, ctx(T0 + i * 20_000))
      return s
    }
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()))
  })
})

describe('quests', () => {
  it('starts the act 1 onboarding automatically and completes it', () => {
    const start = tick(fresh(), content, 0, ctx(T0))
    expect(focusedQuest(start, content)?.quest.id).toBe('act1-intro')
    const s = finishIntro(fresh())
    expect(s.quests.completed).toContain('act1-intro')
    expect(s.flags).toContain('onboarding-done')
    expect(s.quests.active.map((a) => a.id)).toContain('act1-first-100-days')
  })

  it('fires the president post at a random time and punishes ignoring it', () => {
    let s = finishIntro(fresh())
    let t = T0
    while (!s.quests.active.some((a) => a.id === 'president-post') && t < T0 + 3_600_000) {
      t += 10_000
      s = tick(s, content, 10, ctx(t))
    }
    const active = s.quests.active.find((a) => a.id === 'president-post')
    expect(active?.entry).toMatch(/^pool\.president-posts\./)
    const handled = resolveTimed(s, content, 'president-post', true)
    expect(handled.counters['handled-president-post']).toBe(1)
    const ignored = tick(s, content, 9, ctx(t + 9_000))
    expect(ignored.counters.scandals).toBe(1)
    expect(ignored.quests.active.some((a) => a.id === 'president-post')).toBe(false)
  })

  it('rewards the minigame by score and applies the cooldown', () => {
    let s = finishIntro(fresh())
    s = startQuest(s, content, 'headline-swipe')
    const before = s.stats.spin!
    const done = finishMinigame(s, content, 'headline-swipe', 10)
    expect(done.stats.spin!).toBeGreaterThan(before)
    expect(startQuest(done, content, 'headline-swipe').quests.active).toHaveLength(
      done.quests.active.length,
    )
  })
})

describe('dailies', () => {
  it('assigns three dailies and resets at local midnight', () => {
    const s = tick(fresh(), content, 0, ctx(T0))
    expect(s.dailies.ids).toHaveLength(3)
    const next = tick(s, content, 0, ctx(T0 + 1000, '2026-09-27'))
    expect(next.dailies.date).toBe('2026-09-27')
    expect(previousDate('2026-03-01')).toBe('2026-02-28')
  })
})

describe('offline & saves', () => {
  it('caps offline income at 8 hours', () => {
    const s = buyGenerator(withSpin(fresh(), 15), content, 'intern')
    const { state, report } = applyOffline(s, content, T0 + 24 * 3600 * 1000)
    expect(report?.seconds).toBe(OFFLINE_CAP_SEC)
    expect(report?.capped).toBe(true)
    // Drift (approval → 45) is applied first, then production for the capped duration.
    expect(report?.gained).toBeCloseTo(productionPerSecond(state, content) * OFFLINE_CAP_SEC, 3)
  })

  it('round-trips export/import including umlauts', () => {
    const s = { ...finishIntro(fresh()), playerName: 'Jürgen Übermut' }
    const back = importSave(exportSave(s), content)
    expect(back.playerName).toBe('Jürgen Übermut')
    expect(back.stats).toEqual(s.stats)
  })

  it('rejects garbage', () => {
    expect(() => importSave('hello', content as Content)).toThrow(SaveError)
    expect(() => importSave('SPIN1:@@@', content)).toThrow(SaveError)
  })
})

describe('formatNumber', () => {
  it('formats German idle-game numbers', () => {
    expect(formatNumber(5.25)).toBe('5,2')
    expect(formatNumber(12345)).toBe('12.345')
    expect(formatNumber(1_234_567)).toBe('1,23 Mio.')
    expect(formatNumber(3.4e9)).toBe('3,4 Mrd.')
    expect(formatNumber(1e18)).toBe('1 a')
    expect(formatNumber(2.5e21)).toBe('2,5 b')
  })
})
