import { describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/load-content'
import {
  acknowledgeEnding,
  answerDialog,
  answerFraming,
  applyOffline,
  buyGenerator,
  buyUpgrade,
  continueFraming,
  createInitialState,
  debugStartQuest,
  deserialize,
  focusedQuest,
  type GameState,
  isLocationUnlocked,
  isMapUnlocked,
  loadContent,
  locationRate,
  openMap,
  productionPerSecond,
  SAVE_VERSION,
  serialize,
  startFraming,
  tick,
  tillCap,
  travel,
} from '../src'

const T0 = Date.UTC(2026, 8, 27, 12)
const ctx = (now: number, extra: { localHour?: number; localWeekday?: number } = {}) => ({
  now,
  localDate: '2026-09-27',
  ...extra,
})

const scene = {
  background: 'bg',
  player: { x: 160, y: 372 },
  tapTarget: { sprite: 'podium', x: 160, y: 400 },
}

/** Two locations: the press house (hq) and a garden that opens with a flag. */
const content = loadContent([
  {
    source: 'test.json',
    data: {
      stats: [
        { id: 'spin', role: 'currency', initial: 0, min: 0 },
        { id: 'favours', initial: 0, min: 0 },
        { id: 'prices', initial: 0 },
        {
          id: 'approval',
          initial: 50,
          min: 0,
          max: 100,
          drift: { toward: 50, perSec: 1, towardFrom: { stat: 'prices', perPoint: -1 } },
        },
      ],
      locations: [
        { id: 'hq', order: 0, onSiteBonus: 2, scene },
        {
          id: 'garden',
          order: 1,
          unlock: { type: 'flag', flag: 'garden-open' },
          till: { capMinutes: 1 },
          traits: [
            {
              id: 'evening',
              condition: { type: 'hour', from: 19, to: 22 },
              multiplier: 3,
              labelKey: 't.evening',
            },
          ],
          hotspots: {
            minSec: 60,
            maxSec: 60,
            events: [{ id: 'guest', labelKey: 't.guest', multiplier: 4, durationSec: 30 }],
          },
          scene,
        },
      ],
      generators: [
        { id: 'desk', location: 'hq', baseCost: 10, rate: 1 },
        { id: 'rose', location: 'garden', baseCost: 10, rate: 2 },
        {
          id: 'deal',
          location: 'garden',
          baseCost: 5,
          rate: 0.5,
          produces: 'favours',
          costStat: 'spin',
        },
        {
          id: 'wall',
          location: 'hq',
          baseCost: 1,
          costFactor: 2,
          rate: 0.1,
          maxCount: 2,
          perUnitEffects: [{ type: 'addStat', stat: 'prices', value: 5 }],
        },
      ],
      speakers: [{ id: 'press', nameKey: 't.press' }],
      quests: [
        {
          id: 'spin-duel',
          category: 'event',
          titleKey: 't.duel',
          trigger: { type: 'manual' },
          repeatable: true,
          steps: [
            {
              type: 'framing',
              speaker: 'press',
              timePerQuestionSec: 5,
              questions: [
                {
                  textKey: 't.q1',
                  answers: [
                    { textKey: 't.a', score: 1 },
                    { textKey: 't.b', score: 0.2 },
                  ],
                },
                {
                  textKey: 't.q2',
                  answers: [
                    { textKey: 't.a', score: 1 },
                    { textKey: 't.b', score: 0 },
                  ],
                },
              ],
              qualityEffects: [
                {
                  minScore: 0.8,
                  labelKey: 't.boom',
                  effects: [
                    {
                      type: 'modifier',
                      id: 'garden-boom',
                      durationSec: 600,
                      labelKey: 't.boom',
                      effects: [{ type: 'multiplier', target: 'location:garden', value: 2.5 }],
                    },
                  ],
                },
                {
                  minScore: 0,
                  labelKey: 't.flop',
                  effects: [
                    {
                      type: 'modifier',
                      id: 'garden-boom',
                      durationSec: 600,
                      labelKey: 't.flop',
                      effects: [{ type: 'multiplier', target: 'location:garden', value: 0.5 }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'finale',
          category: 'story',
          titleKey: 't.finale',
          trigger: { type: 'manual' },
          steps: [
            {
              type: 'ending',
              titleKey: 't.end',
              lines: ['t.end1'],
              effects: [{ type: 'setFlag', flag: 'ended' }],
            },
          ],
        },
      ],
    },
  },
])

function base(): GameState {
  const s = createInitialState(content, T0, 7)
  s.generators.desk = 1
  s.generators.rose = 1
  s.flags.push('garden-open')
  return s
}

describe('locations & tills', () => {
  it('starts at the first location; others need their unlock condition', () => {
    const s = createInitialState(content, T0)
    expect(s.location).toBe('hq')
    expect(isLocationUnlocked(s, content, 'garden')).toBe(false)
    expect(travel(s, content, 'garden').location).toBe('hq')
    expect(isLocationUnlocked(base(), content, 'garden')).toBe(true)
  })

  it('pays the current location directly (with on-site bonus) and fills other tills', () => {
    const s = tick(base(), content, 10, ctx(T0 + 10_000))
    expect(s.stats.spin).toBeCloseTo(1 * 2 * 10) // desk: rate 1 × on-site 2 × 10 s
    expect(s.locations.garden!.till.spin).toBeCloseTo(2 * 10) // rose: rate 2, off-site
    expect(s.locations.garden!.producedSinceVisit.spin).toBeCloseTo(20)
  })

  it('caps the till and announces a full till once', () => {
    let s = base()
    const cap = tillCap(s, content, 'garden')
    expect(cap).toBeCloseTo(2 * 60) // 1 minute of production
    s = tick(s, content, 100, ctx(T0 + 100_000))
    expect(s.locations.garden!.till.spin).toBeCloseTo(cap)
    expect(s.events).toContainEqual({ type: 'till-full', location: 'garden' })
    s = tick(s, content, 10, ctx(T0 + 110_000))
    expect(s.events.filter((e) => e.type === 'till-full')).toHaveLength(0)
  })

  it('collects the till when travelling and resets visit statistics', () => {
    let s = tick(base(), content, 30, ctx(T0 + 30_000))
    const spinBefore = s.stats.spin!
    s = travel(s, content, 'garden')
    expect(s.location).toBe('garden')
    expect(s.stats.spin).toBeCloseTo(spinBefore + 60)
    expect(s.locations.garden!.till.spin ?? 0).toBe(0)
    expect(s.events).toContainEqual({
      type: 'till-collected',
      location: 'garden',
      amounts: { spin: expect.closeTo(60, 5) },
    })
    // Now the garden pays directly (on-site bonus 1.5 default) and hq fills its till.
    s = tick(s, content, 10, ctx(T0 + 40_000))
    expect(s.locations.hq!.till.spin).toBeCloseTo(10)
  })

  it('applies time-based traits via the tick context', () => {
    const s = base()
    const noon = tick(s, content, 0, ctx(T0, { localHour: 12 }))
    const evening = tick(s, content, 0, ctx(T0, { localHour: 20 }))
    expect(locationRate(evening, content, 'garden')).toBeCloseTo(
      locationRate(noon, content, 'garden') * 3,
    )
  })

  it('fires hotspots that boost a location for a while', () => {
    let s = tick(base(), content, 0, ctx(T0))
    const normal = locationRate(s, content, 'garden')
    s = tick(s, content, 61, ctx(T0 + 61_000))
    expect(s.events).toContainEqual({
      type: 'hotspot',
      location: 'garden',
      id: 'guest',
      multiplier: 4,
    })
    expect(locationRate(s, content, 'garden')).toBeCloseTo(normal * 4)
    s = tick(s, content, 40, ctx(T0 + 101_000))
    expect(locationRate(s, content, 'garden')).toBeCloseTo(normal)
  })

  it('produces secondary currencies and spends via costStat', () => {
    let s: GameState = { ...base(), stats: { ...base().stats, spin: 100 } }
    s = buyGenerator(s, content, 'deal')
    expect(s.generators.deal).toBe(1)
    expect(s.stats.spin).toBe(95)
    s = tick(s, content, 10, ctx(T0 + 10_000))
    expect(s.locations.garden!.till.favours).toBeCloseTo(5)
    expect(productionPerSecond(s, content, 'favours')).toBeCloseTo(0.5)
  })

  it('respects maxCount and applies per-unit effects', () => {
    let s: GameState = { ...base(), stats: { ...base().stats, spin: 1000 } }
    for (let i = 0; i < 5; i++) s = buyGenerator(s, content, 'wall')
    expect(s.generators.wall).toBe(2)
    expect(s.stats.prices).toBe(10)
  })

  it('couples drift targets to other stats', () => {
    let s = base()
    s.stats.prices = 20
    s = tick(s, content, 100, ctx(T0 + 100_000))
    expect(s.stats.approval).toBe(30) // toward 50 − 20 × 1
  })

  it('distributes offline production to tills and reports it', () => {
    const { state, report } = applyOffline(base(), content, T0 + 3600_000)
    expect(report?.gained).toBeCloseTo(3600 * 2)
    expect(report?.tills.garden).toBeCloseTo(120) // capped at 1 minute
    expect(report?.full).toContain('garden')
    expect(state.locations.garden!.till.spin).toBeCloseTo(120)
  })
})

describe('framing duel & endings', () => {
  function duel(): GameState {
    let s = base()
    s = debugStartQuest(s, content, 'spin-duel')
    expect(focusedQuest(s, content)?.step.type).toBe('framing')
    return startFraming(s, content, 'spin-duel')
  }

  it('great spin boosts the location (spin quality)', () => {
    let s = duel()
    s = answerFraming(s, content, 'spin-duel', 0)
    s = continueFraming(s, content, 'spin-duel')
    s = { ...s, now: s.now + 2000 } // reading pause
    s = answerFraming(s, content, 'spin-duel', 0)
    expect(s.quests.active).toHaveLength(1) // last reply still on screen
    s = continueFraming(s, content, 'spin-duel')
    expect(s.events).toContainEqual({
      type: 'quality',
      quest: 'spin-duel',
      score: 1,
      labelKey: 't.boom',
    })
    expect(s.quests.active).toHaveLength(0)
    expect(s.counters['framings-perfect']).toBe(1)
    const normal = locationRate(base(), content, 'garden')
    expect(locationRate(s, content, 'garden')).toBeCloseTo(normal * 2.5)
  })

  it('timeouts count as failed spin and lead to a slump', () => {
    let s = duel()
    s = tick(s, content, 30, ctx(T0 + 30_000)) // question 1 expired; the reply waits for the player
    expect(s.quests.active[0]).toMatchObject({ scores: [0], answers: [null], showingReply: true })
    s = continueFraming(s, content, 'spin-duel')
    s = tick(s, content, 7, ctx(T0 + 37_000)) // 2 s pause + 5 s: question 2 expired
    expect(s.quests.active[0]?.scores).toEqual([0, 0])
    s = continueFraming(s, content, 'spin-duel')
    expect(s.quests.active).toHaveLength(0)
    const q = s.events.find((e) => e.type === 'quality')
    expect(q).toMatchObject({ score: 0, labelKey: 't.flop' })
  })

  it('late answers are treated as timeouts', () => {
    let s = duel()
    s = { ...s, now: s.now + 6000 }
    s = answerFraming(s, content, 'spin-duel', 0)
    expect(s.quests.active[0]?.scores).toEqual([0])
  })

  it('the next clock starts only after the player has read the reply', () => {
    let s = duel()
    s = answerFraming(s, content, 'spin-duel', 1)
    expect(s.quests.active[0]).toMatchObject({ answers: [1], showingReply: true })
    s = answerFraming(s, content, 'spin-duel', 0) // no second answer while the reply shows
    expect(s.quests.active[0]?.scores).toEqual([0.2])
    s = tick(s, content, 60, ctx(T0 + 60_000)) // reading takes as long as it takes
    expect(s.quests.active[0]?.scores).toEqual([0.2])
    s = continueFraming(s, content, 'spin-duel')
    expect(s.quests.active[0]?.stepStartedAt).toBe(T0 + 60_000 + 2000)
    s = tick(s, content, 6, ctx(T0 + 66_000)) // 2 s pause + 4 s: still running
    expect(s.quests.active[0]?.scores).toEqual([0.2])
  })

  it('ending screens apply their effects when acknowledged', () => {
    let s = debugStartQuest(base(), content, 'finale')
    expect(focusedQuest(s, content)?.step.type).toBe('ending')
    s = acknowledgeEnding(s, content, 'finale')
    expect(s.flags).toContain('ended')
    expect(s.quests.completed).toContain('finale')
  })
})

describe('save v2', () => {
  it('migrates a v0.1 (v1) save into the press house', () => {
    const real = loadContentFromDisk()
    const v2 = createInitialState(real, T0, 1)
    v2.generators.intern = 3
    const {
      clock: _c,
      location: _l,
      locations: _ls,
      hotspots: _h,
      ...v1
    } = JSON.parse(serialize(v2))
    const loaded = deserialize(JSON.stringify({ ...v1, version: 1 }), real)
    expect(loaded.version).toBe(SAVE_VERSION)
    expect(loaded.location).toBe('press-house')
    expect(loaded.generators.intern).toBe(3)
    expect(loaded.locations['press-house']).toBeDefined()
  })
})

describe('city map', () => {
  it('unlocks after act 1 and the map tutorial completes when the map is opened', () => {
    const real = loadContentFromDisk()
    let s = createInitialState(real, T0, 3)
    expect(isMapUnlocked(s, real)).toBe(false)
    s = { ...s, quests: { ...s.quests, completed: ['act1-intro', 'act1-first-100-days'] } }
    expect(isMapUnlocked(s, real)).toBe(true)
    s = tick(s, real, 0, ctx(T0))
    const intro = focusedQuest(s, real)
    expect(intro?.quest.id).toBe('act2-city-intro')
    s = answerDialog(s, real, 'act2-city-intro')
    s = openMap(s, real)
    expect(s.quests.completed).toContain('act2-city-intro')
  })
})

describe('location:@here', () => {
  it('binds a modifier to the location where the player is', () => {
    const c = loadContent([
      {
        source: 'here.json',
        data: {
          stats: [{ id: 'spin', role: 'currency', initial: 0 }],
          locations: [
            { id: 'a', order: 0, scene },
            { id: 'b', order: 1, scene },
          ],
          generators: [{ id: 'g', location: 'b', baseCost: 1, rate: 1 }],
          upgrades: [
            {
              id: 'boost',
              cost: 0,
              effects: [
                {
                  type: 'modifier',
                  id: 'm',
                  durationSec: 60,
                  labelKey: 'x',
                  effects: [{ type: 'multiplier', target: 'location:@here', value: 3 }],
                },
              ],
            },
          ],
        },
      },
    ])
    let s = createInitialState(c, T0)
    s = travel(s, c, 'b')
    s = buyUpgrade(s, c, 'boost')
    expect(s.modifiers[0]?.effects[0]?.target).toBe('location:b')
  })
})
