import { describe, expect, it } from 'vitest'
import { loadContentFromDisk } from '../scripts/load-content'
import { createInitialState, deserialize, serialize, tick } from '../src'

const T0 = Date.UTC(2026, 8, 27, 12)
const ctx = (now: number) => ({ now, localDate: '2026-09-27' })

describe('reality checks', () => {
  const content = loadContentFromDisk()

  it('every card has at least two dated sources', () => {
    expect(content.realityChecks.length).toBeGreaterThanOrEqual(5)
    for (const card of content.realityChecks) {
      expect(card.sources.length).toBeGreaterThanOrEqual(2)
      for (const s of card.sources) expect(s.url).toMatch(/^https:\/\//)
    }
  })

  it('unlocks a card once its condition holds, exactly once', () => {
    const card = content.realityChecks.find((c) => c.unlock.type === 'upgrade')!
    const upgrade = card.unlock.type === 'upgrade' ? card.unlock.upgrade : ''
    let s = createInitialState(content, T0, 1)
    s = tick(s, content, 0, ctx(T0))
    expect(s.realityChecks).not.toContain(card.id)

    s.upgrades.push(upgrade)
    s = tick(s, content, 0.1, ctx(T0 + 100))
    expect(s.realityChecks).toContain(card.id)
    expect(s.events).toContainEqual({ type: 'reality-unlocked', card: card.id })

    s = tick(s, content, 0.1, ctx(T0 + 200))
    expect(s.events.some((e) => e.type === 'reality-unlocked')).toBe(false)
  })

  it('loads saves that predate reality checks', () => {
    const s = createInitialState(content, T0, 1)
    const raw = JSON.parse(serialize(s))
    delete raw.realityChecks
    const loaded = deserialize(JSON.stringify(raw), content)
    expect(loaded?.realityChecks).toEqual([])
  })
})
