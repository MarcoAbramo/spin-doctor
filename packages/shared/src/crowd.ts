import { nextRandom } from './rng'

/**
 * How many copies of a generator the scene shows for `count` units: 1 at the first
 * unit, then logarithmically more (3 at 3, 6 at 10, 8 at 25, 11 at 100 …) so a big
 * collection visibly fills the room without one sprite per unit. With `exponent`
 * (e.g. seats in a hall) copies grow as count^exponent instead.
 */
export function crowdSize(count: number, capacity: number, exponent?: number): number {
  if (count <= 0 || capacity <= 0) return 0
  const n = exponent ? Math.ceil(count ** exponent) : Math.floor(1 + 2.2 * Math.log(count))
  return Math.min(capacity, n)
}

export interface CrowdDef {
  area?: [number, number, number, number] | undefined
  grid?: { xs: number[]; ys: number[] } | undefined
  max: number
  spacing: number
  exponent?: number | undefined
}

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h | 0
}

/**
 * All spots for one generator: the authored `slots` first, then either the seats of a
 * `grid` (front row first, centre outwards) or deterministic pseudo-random points in
 * the crowd `area` that keep `spacing` apart where possible.
 */
export function crowdPositions(
  id: string,
  slots: Array<[number, number]>,
  crowd: CrowdDef | undefined,
): Array<[number, number]> {
  const spots: Array<[number, number]> = slots.map(([x, y]) => [x, y])
  if (!crowd) return spots
  if (crowd.grid) {
    const { xs, ys } = crowd.grid
    const centre = (Math.min(...xs) + Math.max(...xs)) / 2
    const order = [...xs].sort((a, b) => Math.abs(a - centre) - Math.abs(b - centre) || a - b)
    for (const y of [...ys].sort((a, b) => a - b))
      for (const x of order) {
        if (spots.length >= crowd.max) return spots
        if (!spots.some(([sx, sy]) => sx === x && sy === y)) spots.push([x, y])
      }
    return spots
  }
  if (!crowd.area) return spots
  const [ax, ay, aw, ah] = crowd.area
  let seed = hash(id)
  const rand = () => {
    const [value, next] = nextRandom(seed)
    seed = next
    return value
  }
  let spacing = crowd.spacing
  let misses = 0
  while (spots.length < crowd.max) {
    const x = Math.round(ax + rand() * aw)
    const y = Math.round(ay + rand() * ah)
    // Below one pixel of spacing any spot is fine (tiny areas may repeat points).
    const free =
      spacing < 1 || spots.every(([sx, sy]) => Math.hypot(sx - x, (sy - y) * 1.5) >= spacing)
    if (free) {
      spots.push([x, y])
      misses = 0
    } else if (++misses > 40) {
      // The area is full at this spacing: squeeze a little closer.
      spacing *= 0.85
      misses = 0
    }
  }
  return spots
}
