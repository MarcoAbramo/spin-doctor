import { nextRandom } from './rng'

/**
 * How many copies of a generator the scene shows for `count` units: 1 at the first
 * unit, then logarithmically more (3 at 3, 6 at 10, 8 at 25, 11 at 100 …) so a big
 * collection visibly fills the room without one sprite per unit.
 */
export function crowdSize(count: number, capacity: number): number {
  if (count <= 0 || capacity <= 0) return 0
  return Math.min(capacity, Math.floor(1 + 2.2 * Math.log(count)))
}

export interface CrowdDef {
  area: [number, number, number, number]
  max: number
  spacing: number
}

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h | 0
}

/**
 * All spots for one generator: the authored `slots` first, then deterministic
 * pseudo-random points in the crowd area that keep `spacing` apart where possible.
 */
export function crowdPositions(
  id: string,
  slots: Array<[number, number]>,
  crowd: CrowdDef | undefined,
): Array<[number, number]> {
  const spots: Array<[number, number]> = slots.map(([x, y]) => [x, y])
  if (!crowd) return spots
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
