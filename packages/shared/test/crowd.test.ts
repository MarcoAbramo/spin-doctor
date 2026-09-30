import { describe, expect, it } from 'vitest'
import { crowdPositions, crowdSize, formatFull } from '../src'

describe('scene crowds', () => {
  it('grows noticeably but slower than the unit count', () => {
    expect(crowdSize(0, 12)).toBe(0)
    expect(crowdSize(1, 12)).toBe(1)
    expect(crowdSize(3, 12)).toBe(3)
    expect(crowdSize(10, 12)).toBe(6)
    expect(crowdSize(25, 12)).toBe(8)
    expect(crowdSize(100, 12)).toBe(11)
    expect(crowdSize(10_000, 12)).toBe(12)
    expect(crowdSize(50, 3)).toBe(3)
  })

  it('keeps authored slots first and fills the area deterministically', () => {
    const crowd = {
      area: [10, 200, 80, 40] as [number, number, number, number],
      max: 9,
      spacing: 14,
    }
    const a = crowdPositions('intern', [[44, 296]], crowd)
    expect(a).toHaveLength(9)
    expect(a[0]).toEqual([44, 296])
    for (const [x, y] of a.slice(1)) {
      expect(x).toBeGreaterThanOrEqual(10)
      expect(x).toBeLessThanOrEqual(90)
      expect(y).toBeGreaterThanOrEqual(200)
      expect(y).toBeLessThanOrEqual(240)
    }
    expect(crowdPositions('intern', [[44, 296]], crowd)).toEqual(a)
  })

  it('squeezes when the area is too small instead of looping forever', () => {
    const tiny = { area: [0, 0, 4, 0] as [number, number, number, number], max: 6, spacing: 30 }
    expect(crowdPositions('x', [], tiny)).toHaveLength(6)
  })
})

describe('formatFull', () => {
  it('shows every digit with German grouping', () => {
    expect(formatFull(4_970_000_000)).toBe('4.970.000.000')
    expect(formatFull(1234.9)).toBe('1.234')
    expect(formatFull(5.5)).toBe('5,5')
  })
})

describe('stat tutorial', () => {
  it('explains visible HUD values one by one, in HUD order', async () => {
    const { loadContentFromDisk } = await import('../scripts/load-content')
    const { createInitialState, markExplained, nextStatToExplain } = await import('../src')
    const content = loadContentFromDisk()
    let s = createInitialState(content, 0, 1)
    expect(nextStatToExplain(s, content)).toBe('spin')
    s = markExplained(s, 'spin')
    expect(nextStatToExplain(s, content)).toBe('approval')
    s = markExplained(markExplained(s, 'approval'), 'democracy')
    // Price level and loyalists stay hidden until they appear in the HUD.
    expect(nextStatToExplain(s, content)).toBeNull()
    s.stats.prices = 5
    expect(nextStatToExplain(s, content)).toBe('prices')
  })
})

describe('seat grids', () => {
  it('fills the front row first, centre outwards', () => {
    const crowd = { grid: { xs: [10, 30, 50, 70], ys: [200, 100] }, max: 8, spacing: 16 }
    const seats = crowdPositions('court', [], crowd)
    expect(seats).toHaveLength(8)
    expect(seats.slice(0, 4).every(([, y]) => y === 100)).toBe(true)
    expect(seats[0]![0]).toBe(30)
    expect(seats[1]![0]).toBe(50)
  })

  it('grows as a power of the unit count when an exponent is set', () => {
    expect(crowdSize(1, 120, 0.8)).toBe(1)
    expect(crowdSize(10, 120, 0.8)).toBe(7)
    expect(crowdSize(100, 120, 0.8)).toBe(40)
    expect(crowdSize(1000, 120, 0.8)).toBe(120)
  })
})
