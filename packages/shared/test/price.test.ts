import { describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/load-content'
import {
  buyGenerator,
  createInitialState,
  type GameState,
  isLocationUnlocked,
  multiplier,
  statProductionMultiplier,
  tick,
  travel,
} from '../src'

const T0 = Date.UTC(2026, 8, 27, 12)
const ctx = (now: number) => ({ now, localDate: '2026-09-27' })

describe('level 3: P.R.I.C.E.', () => {
  const content = loadContentFromDisk()
  const withPrice = (): GameState => {
    const s = createInitialState(content, T0, 1)
    s.quests.completed.push('act1-first-100-days', 'act2-city-intro', 'price-founding')
    return s
  }

  it('unlocks after the founding quest', () => {
    const s = createInitialState(content, T0, 1)
    expect(isLocationUnlocked(s, content, 'price')).toBe(false)
    expect(isLocationUnlocked(withPrice(), content, 'price')).toBe(true)
  })

  it('charges the entry fee on every arrival, never below zero', () => {
    let s = withPrice()
    s.stats.spin = 10
    s = travel(s, content, 'price')
    expect(s.location).toBe('price')
    expect(s.stats.spin).toBe(9)
    expect(s.events).toContainEqual({
      type: 'entry-fee',
      location: 'price',
      stat: 'spin',
      amount: 1,
    })

    s = travel(s, content, 'press-house')
    s.stats.spin = 0
    s = travel(s, content, 'price')
    expect(s.stats.spin).toBe(0)
  })

  it('stops the record wall at 20 sections, each costing democracy', () => {
    let s = withPrice()
    s.quests.completed.push('wall-announcement')
    s.stats.spin = 1e15
    const democracy = s.stats.democracy!
    for (let i = 0; i < 25; i++) s = buyGenerator(s, content, 'record-wall')
    expect(s.generators['record-wall']).toBe(20)
    expect(s.stats.democracy).toBe(democracy - 20)
    expect(multiplier(s, content, 'production')).toBeCloseTo(1.02 ** 20)
  })

  it('loyalists boost production and complete the regime at 100 %', () => {
    let s = withPrice()
    const before = statProductionMultiplier(s, content)
    s.stats.loyalists = 100
    expect(statProductionMultiplier(s, content)).toBeCloseTo(before * 1.5)
    s = tick(s, content, 0.1, ctx(T0 + 100))
    expect(s.quests.active.map((q) => q.id)).toContain('regime-complete')
  })
})
