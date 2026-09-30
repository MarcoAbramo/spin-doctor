/**
 * City map placeholders: Tiled map (JSON) + 16×16 tileset, building sprites and the
 * player's 4-direction walk cycle. Open `public/assets/maps/superbia.json` in Tiled
 * (https://www.mapeditor.org) to edit the map; repaint PNGs in Aseprite.
 * Existing files are never overwritten (use --force).
 */
import { asepriteJson, C, Canvas, rng, save, saveText } from './pixel-lib.mjs'

export const TILE = 16
export const MAP_W = 48
export const MAP_H = 48

// Tile indices in the tileset (gid = index + 1 in Tiled).
const T = {
  grass: 0,
  flowers: 1,
  grassDark: 2,
  asphalt: 3,
  lineH: 4,
  lineV: 5,
  sidewalk: 6,
  plaza: 7,
  water: 8,
  shore: 9,
  sand: 10,
  tree: 11,
  bush: 12,
  hedge: 13,
  roses: 14,
  fence: 15,
  green: 16,
  pin: 17,
  parking: 18,
  lamp: 19,
  bench: 20,
  crosswalk: 21,
  dirt: 22,
  gold: 23,
  lineH2: 24,
  lineV2: 25,
}
const BLOCKING = new Set([T.water, T.tree, T.bush, T.hedge, T.roses, T.fence, T.lamp, T.pin])

// ---------------------------------------------------------------------------
// Tileset (8 columns × 4 rows)
// ---------------------------------------------------------------------------
function tileset() {
  const cols = 8
  const c = new Canvas(cols * TILE, 4 * TILE)
  const r = rng(3)
  const at = (i) => [(i % cols) * TILE, Math.floor(i / cols) * TILE]
  const fill = (i, color) => {
    const [x, y] = at(i)
    c.rect(x, y, TILE, TILE, color)
    return [x, y]
  }
  const speckle = (i, base, dots, n = 10) => {
    const [x, y] = fill(i, base)
    for (let k = 0; k < n; k++)
      c.px(x + Math.floor(r() * 16), y + Math.floor(r() * 16), dots[k % dots.length])
    return [x, y]
  }
  speckle(T.grass, C.green, [C.greenD])
  {
    const [x, y] = speckle(T.flowers, C.green, [C.greenD])
    for (const [dx, dy, col] of [
      [3, 4, C.yellow],
      [11, 3, C.pink],
      [7, 11, C.white],
      [13, 12, C.yellow],
    ])
      c.px(x + dx, y + dy, col)
  }
  speckle(T.grassDark, C.greenD, [C.green3])
  speckle(T.asphalt, C.grey3, [C.navy], 6)
  // Centre lines sit on the border between the two lanes: half in each tile.
  {
    const [x, y] = speckle(T.lineH, C.grey3, [C.navy], 6)
    c.hline(x + 4, x + 11, y + 15, C.yellow)
  }
  {
    const [x, y] = speckle(T.lineV, C.grey3, [C.navy], 6)
    c.vline(x + 15, y + 4, y + 11, C.yellow)
  }
  {
    const [x, y] = fill(T.sidewalk, C.grey1)
    c.hline(x, x + 15, y + 15, C.grey2)
    c.vline(x + 15, y, y + 15, C.grey2)
    c.hline(x, x + 15, y + 7, C.grey2)
  }
  {
    const [x, y] = fill(T.plaza, C.sand)
    for (let k = 0; k < 16; k += 8) {
      c.hline(x, x + 15, y + k, C.tan)
      c.vline(x + ((k / 8) % 2) * 8, y + k, y + k + 7, C.tan)
    }
  }
  {
    const [x, y] = fill(T.water, C.blue)
    c.hline(x + 2, x + 6, y + 4, C.cyan)
    c.hline(x + 9, x + 13, y + 11, C.cyan)
  }
  {
    const [x, y] = fill(T.shore, C.blue)
    c.rect(x, y, 16, 4, C.sand)
    c.hline(x, x + 15, y + 4, C.white)
  }
  speckle(T.sand, C.sand, [C.skin], 8)
  {
    const [x, y] = speckle(T.tree, C.green, [C.greenD])
    c.rect(x + 7, y + 10, 2, 5, C.wood)
    c.ellipse(x + 8, y + 7, 6, 6, C.green3)
    c.ellipse(x + 7, y + 6, 4, 4, C.greenD)
    c.px(x + 5, y + 4, C.green)
  }
  {
    const [x, y] = speckle(T.bush, C.green, [C.greenD])
    c.ellipse(x + 8, y + 9, 6, 5, C.greenD)
    c.px(x + 6, y + 7, C.green)
  }
  {
    const [x, y] = fill(T.hedge, C.green3)
    for (let k = 0; k < 16; k += 4) c.px(x + k + 1, y + 2, C.greenD)
    c.hline(x, x + 15, y + 15, C.green4)
  }
  {
    const [x, y] = speckle(T.roses, C.greenD, [C.green3])
    for (const [dx, dy] of [
      [3, 3],
      [10, 4],
      [6, 9],
      [12, 11],
      [2, 12],
    ]) {
      c.rect(x + dx, y + dy, 2, 2, C.red)
      c.px(x + dx, y + dy, C.pink)
    }
  }
  {
    const [x, y] = speckle(T.fence, C.green, [C.greenD])
    c.hline(x, x + 15, y + 6, C.white)
    c.hline(x, x + 15, y + 11, C.white)
    for (const k of [1, 7, 13]) c.vline(x + k, y + 3, y + 14, C.grey1)
  }
  speckle(T.green, C.green, [C.green], 0)
  {
    const [x, y] = fill(T.pin, C.green)
    c.vline(x + 7, y + 2, y + 13, C.white)
    c.rect(x + 8, y + 2, 5, 3, C.red)
    c.ellipse(x + 7, y + 14, 2, 1, C.ink)
  }
  {
    const [x, y] = fill(T.parking, C.grey3)
    c.vline(x, y, y + 15, C.white)
  }
  {
    const [x, y] = speckle(T.lamp, C.grey1, [C.grey2], 4)
    c.vline(x + 8, y + 3, y + 14, C.navyD)
    c.rect(x + 6, y + 1, 5, 3, C.yellow)
  }
  {
    const [x, y] = speckle(T.bench, C.green, [C.greenD])
    c.rect(x + 2, y + 6, 12, 3, C.wood)
    c.rect(x + 2, y + 10, 12, 2, C.woodL)
    c.vline(x + 3, y + 12, y + 14, C.woodD)
    c.vline(x + 12, y + 12, y + 14, C.woodD)
  }
  {
    const [x, y] = fill(T.crosswalk, C.grey3)
    for (let k = 1; k < 16; k += 4) c.rect(x + k, y + 1, 2, 14, C.white)
  }
  speckle(T.dirt, C.woodL, [C.wood], 10)
  {
    const [x, y] = fill(T.gold, C.gold)
    c.hline(x, x + 15, y + 15, C.orange)
    c.px(x + 4, y + 4, C.yellow)
  }
  {
    const [x, y] = speckle(T.lineH2, C.grey3, [C.navy], 6)
    c.hline(x + 4, x + 11, y, C.yellow)
  }
  {
    const [x, y] = speckle(T.lineV2, C.grey3, [C.navy], 6)
    c.vline(x, y + 4, y + 11, C.yellow)
  }
  return c
}

// ---------------------------------------------------------------------------
// Buildings (bottom-centre anchored on their footprint)
// ---------------------------------------------------------------------------
function windows(c, x0, y0, cols, rows, dx, dy, lit) {
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      c.rect(x0 + i * dx, y0 + j * dy, 5, 7, lit(i, j) ? C.yellow : C.blueD)
      c.hline(x0 + i * dx, x0 + i * dx + 4, y0 + j * dy, C.navyD)
    }
}
function door(c, x, y, w = 10, h = 14, color = C.wood) {
  c.rect(x, y, w, h, color)
  c.vline(x + w / 2, y, y + h - 1, C.woodD)
  c.px(x + w / 2 - 2, y + h / 2, C.gold)
}

const BUILDINGS = {
  // Presidential palace = press house
  'map-press-house'() {
    const c = new Canvas(128, 88)
    c.rect(4, 40, 120, 48, C.white)
    c.rect(4, 32, 120, 10, C.grey1)
    c.hline(4, 123, 32, C.grey2)
    c.rect(0, 26, 128, 7, C.navy)
    c.hline(0, 127, 26, C.blue)
    for (let x = 12; x < 120; x += 14) {
      c.rect(x, 44, 5, 40, C.grey1)
      c.vline(x + 4, 44, 83, C.grey2)
    }
    windows(c, 18, 50, 6, 1, 18, 0, (i) => i % 2 === 0)
    // portico
    for (let y = 0; y < 14; y++) c.hline(64 - y * 2 - 4, 64 + y * 2 + 3, 12 + y, C.grey1)
    c.hline(34, 93, 26, C.gold)
    door(c, 58, 72, 12, 16, C.gold)
    c.vline(64, 0, 12, C.grey2)
    c.rect(65, 0, 10, 6, C.red)
    c.rect(65, 2, 10, 2, C.gold)
    c.outline(C.ink)
    return c
  },
  'map-great-dome'() {
    const c = new Canvas(128, 104)
    c.rect(8, 56, 112, 48, C.grey1)
    for (let x = 14; x < 116; x += 12) {
      c.rect(x, 60, 5, 42, C.white)
      c.vline(x + 4, 60, 101, C.grey2)
    }
    c.rect(4, 50, 120, 8, C.white)
    c.ellipse(64, 50, 40, 30, C.grey1)
    c.ellipse(58, 44, 30, 22, C.white)
    c.rect(24, 50, 81, 8, C.white)
    c.rect(60, 12, 8, 10, C.grey1)
    c.rect(62, 4, 4, 8, C.gold)
    door(c, 56, 86, 16, 18, C.woodD)
    c.outline(C.ink)
    return c
  },
  'map-rosengarten'() {
    const c = new Canvas(80, 88)
    c.rect(2, 20, 76, 40, C.white)
    windows(c, 8, 28, 4, 2, 18, 14, (i, j) => (i + j) % 3 === 0)
    c.rect(0, 14, 80, 7, C.grey1)
    for (let x = 4; x < 78; x += 10) {
      c.rect(x, 62, 6, 5, C.greenD)
      c.rect(x + 1, 62, 2, 2, C.red)
    }
    c.rect(2, 60, 76, 28, C.green)
    for (let x = 6; x < 76; x += 8) c.ellipse(x, 70 + ((x / 8) % 2) * 6, 3, 3, C.red)
    c.rect(34, 66, 12, 10, C.wood) // podium
    c.rect(33, 64, 14, 3, C.woodL)
    c.rect(52, 50, 16, 14, C.white) // easel with map
    c.rect(53, 51, 14, 10, C.blue)
    c.hline(54, 66, 55, C.ink)
    c.outline(C.ink)
    return c
  },
  'map-finance-ministry'() {
    const c = new Canvas(80, 72)
    c.rect(2, 18, 76, 54, C.grey2)
    c.rect(0, 12, 80, 8, C.grey1)
    for (let x = 8; x < 76; x += 12) {
      c.rect(x, 24, 5, 44, C.grey1)
    }
    c.ellipse(40, 8, 8, 8, C.gold)
    c.rect(38, 4, 4, 8, C.orange)
    door(c, 34, 56, 12, 16, C.woodD)
    c.outline(C.ink)
    return c
  },
  'map-jubel-tv'() {
    const c = new Canvas(64, 128)
    c.rect(20, 40, 24, 88, C.grey1)
    for (let y = 44; y < 124; y += 10) c.hline(20, 43, y, C.grey2)
    c.vline(32, 0, 30, C.red)
    for (let y = 2; y < 30; y += 6) c.hline(29, 35, y, C.white)
    c.rect(8, 24, 48, 24, C.ink)
    c.rect(10, 26, 44, 20, C.blue)
    c.ascii(28, 30, ['...y...', '..yyy..', 'yyyyyyy', '.yyyyy.', '.yy.yy.'])
    c.rect(2, 104, 60, 24, C.navy)
    windows(c, 6, 108, 5, 1, 11, 0, () => true)
    door(c, 26, 114, 12, 14, C.red)
    c.outline(C.ink)
    return c
  },
  'map-price'() {
    const c = new Canvas(112, 72)
    c.rect(4, 16, 104, 56, C.clay)
    c.rect(0, 10, 112, 8, C.rust)
    windows(c, 12, 26, 6, 2, 16, 16, () => false)
    c.rect(30, 0, 52, 12, C.gold) // price-tag sign
    c.rect(36, 3, 40, 5, C.ink)
    c.px(33, 5, C.ink)
    door(c, 50, 54, 12, 18, C.navyD)
    // barrier
    for (let x = 70; x < 110; x += 4) c.rect(x, 60, 2, 3, (x / 4) % 2 ? C.red : C.white)
    c.vline(70, 58, 71, C.grey3)
    c.outline(C.ink)
    return c
  },
  'map-golf-resort'() {
    const c = new Canvas(96, 80)
    c.rect(6, 28, 84, 52, C.sand)
    c.rect(0, 16, 96, 14, C.green3)
    for (let y = 16; y < 30; y += 3) c.hline(0, 95, y, C.greenD)
    windows(c, 14, 40, 5, 1, 15, 0, () => true)
    c.rect(20, 8, 56, 8, C.gold)
    c.hline(22, 73, 11, C.orange)
    door(c, 42, 60, 12, 20, C.woodD)
    c.vline(88, 0, 28, C.grey1)
    c.rect(89, 0, 7, 5, C.red)
    c.outline(C.ink)
    return c
  },
  'map-bear-force-one'() {
    const c = new Canvas(112, 80)
    c.ellipse(56, 60, 54, 40, C.grey2) // hangar
    c.rect(2, 60, 108, 20, C.grey2)
    for (let x = 10; x < 104; x += 12) c.vline(x, 30, 79, C.grey3)
    c.rect(24, 50, 64, 30, C.navyD) // hangar opening
    // plane nose with bear logo
    c.ellipse(56, 70, 26, 8, C.white)
    c.hline(34, 78, 70, C.blueD)
    c.ellipse(56, 66, 3, 3, C.wood)
    c.px(54, 63, C.wood)
    c.px(58, 63, C.wood)
    c.outline(C.ink)
    return c
  },
  'map-rally-square'() {
    const c = new Canvas(80, 64)
    c.rect(4, 28, 72, 20, C.woodL)
    c.rect(4, 48, 72, 16, C.wood)
    c.rect(4, 4, 72, 26, C.redD)
    for (let x = 8; x < 76; x += 8) c.vline(x, 4, 29, C.red)
    c.rect(0, 0, 80, 5, C.gold)
    c.rect(2, 30, 8, 18, C.ink) // speakers
    c.rect(70, 30, 8, 18, C.ink)
    c.rect(36, 30, 8, 10, C.wood)
    c.outline(C.ink)
    return c
  },
  'map-city-park'() {
    const c = new Canvas(48, 48)
    c.rect(4, 22, 40, 4, C.white)
    for (let y = 0; y < 12; y++) c.hline(24 - y * 2 - 2, 24 + y * 2 + 1, 10 + y, C.red)
    for (const x of [8, 22, 38]) c.rect(x, 26, 3, 20, C.white)
    c.rect(4, 44, 40, 4, C.grey1)
    c.outline(C.ink)
    return c
  },
}

// ---------------------------------------------------------------------------
// Player walk cycle: 16×24 frames, down/up/left/right × 4
// ---------------------------------------------------------------------------
function walkCycle() {
  const FW = 16
  const FH = 24
  const dirs = ['down', 'up', 'left', 'right']
  const c = new Canvas(FW * 16, FH)
  dirs.forEach((dir, d) => {
    for (let f = 0; f < 4; f++) {
      const o = (d * 4 + f) * FW
      const step = f % 2 === 1 ? 1 : 0
      const leg = f === 1 ? -1 : f === 3 ? 1 : 0
      // legs
      c.rect(
        o + 5 + (dir === 'left' || dir === 'right' ? leg : 0),
        18,
        2,
        5 - (leg > 0 ? 1 : 0),
        C.ink,
      )
      c.rect(
        o + 9 - (dir === 'left' || dir === 'right' ? leg : 0),
        18,
        2,
        5 - (leg < 0 ? 1 : 0),
        C.ink,
      )
      // body
      c.rect(o + 4, 11 - step, 8, 8, C.navyD)
      if (dir === 'down') {
        c.rect(o + 7, 11 - step, 2, 4, C.white)
        c.px(o + 7, 12 - step, C.red)
        c.px(o + 8, 13 - step, C.red)
      }
      // arms swing
      c.rect(o + 3, 12 - step + (leg > 0 ? 1 : 0), 1, 5, C.navy)
      c.rect(o + 12, 12 - step + (leg < 0 ? 1 : 0), 1, 5, C.navy)
      // head
      c.ellipse(o + 8, 6 - step, 4, 4, C.skin)
      c.rect(o + 4, 2 - step, 9, 3, C.woodD)
      if (dir === 'up') c.rect(o + 4, 2 - step, 9, 6, C.woodD)
      if (dir === 'down') {
        c.px(o + 6, 6 - step, C.ink)
        c.px(o + 10, 6 - step, C.ink)
      }
      if (dir === 'left') c.px(o + 5, 6 - step, C.ink)
      if (dir === 'right') c.px(o + 11, 6 - step, C.ink)
      c.outline(C.ink, o, 0, FW, FH)
    }
  })
  const json = asepriteJson('player-walk.png', FW, FH, 16, {
    'walk-down': [0, 3, 120],
    'walk-up': [4, 7, 120],
    'walk-left': [8, 11, 120],
    'walk-right': [12, 15, 120],
  })
  // Idle tags reuse the first frame of each direction.
  json.meta.frameTags.push(
    { name: 'idle-down', from: 0, to: 0, direction: 'forward' },
    { name: 'idle-up', from: 4, to: 4, direction: 'forward' },
    { name: 'idle-left', from: 8, to: 8, direction: 'forward' },
    { name: 'idle-right', from: 12, to: 12, direction: 'forward' },
    { name: 'idle', from: 0, to: 0, direction: 'forward' },
  )
  return [c, json]
}

// ---------------------------------------------------------------------------
// The map
// ---------------------------------------------------------------------------
/** Buildings: footprint in tiles; the door tile is just below the footprint. */
const PLACES = [
  { id: 'great-dome', sprite: 'map-great-dome', x: 19, y: 1, w: 8, h: 5, door: [23, 6] },
  { id: 'press-house', sprite: 'map-press-house', x: 19, y: 11, w: 8, h: 4, door: [23, 15] },
  { id: 'rosengarten', sprite: 'map-rosengarten', x: 29, y: 10, w: 5, h: 5, door: [31, 15] },
  {
    id: 'finance-ministry',
    sprite: 'map-finance-ministry',
    x: 13,
    y: 11,
    w: 5,
    h: 4,
    door: [15, 15],
  },
  { id: 'jubel-tv', sprite: 'map-jubel-tv', x: 3, y: 6, w: 4, h: 6, door: [5, 12] },
  { id: 'golf-resort', sprite: 'map-golf-resort', x: 39, y: 10, w: 6, h: 4, door: [42, 14] },
  { id: 'price', sprite: 'map-price', x: 2, y: 34, w: 7, h: 4, door: [5, 38] },
  { id: 'bear-force-one', sprite: 'map-bear-force-one', x: 38, y: 37, w: 7, h: 4, door: [41, 41] },
  { id: 'rally-square', sprite: 'map-rally-square', x: 26, y: 35, w: 5, h: 3, door: [28, 38] },
  { id: 'city-park', sprite: 'map-city-park', x: 16, y: 36, w: 3, h: 3, door: [17, 39] },
]

function buildMap() {
  const r = rng(42)
  const size = MAP_W * MAP_H
  const ground = new Array(size).fill(0)
  const deco = new Array(size).fill(-1)
  const set = (layer, x, y, t) => {
    if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) layer[y * MAP_W + x] = t
  }
  const get = (layer, x, y) => layer[y * MAP_W + x]
  const rect = (layer, x0, y0, w, h, t) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(layer, x, y, t)
  }
  // grass with variation
  for (let i = 0; i < size; i++)
    ground[i] = r() < 0.08 ? T.flowers : r() < 0.15 ? T.grassDark : T.grass
  // harbour water (south-west) and shore
  rect(ground, 0, 41, 24, 7, T.water)
  rect(ground, 0, 40, 24, 1, T.shore)
  rect(ground, 0, 39, 12, 1, T.sand)
  // golf course (north-east)
  rect(ground, 37, 0, 11, 17, T.green)
  for (const [x, y] of [
    [40, 3],
    [45, 7],
    [39, 7],
  ])
    set(deco, x, y, T.pin)
  // government plaza with the reflecting pool
  rect(ground, 13, 0, 22, 17, T.plaza)
  rect(ground, 20, 7, 6, 3, T.water) // reflecting pool (a mega project later)
  rect(ground, 29, 15, 5, 1, T.plaza)
  // media quarter & airport & rally square
  rect(ground, 2, 4, 6, 9, T.plaza)
  rect(ground, 36, 35, 12, 13, T.parking)
  rect(ground, 25, 34, 8, 6, T.plaza)
  rect(ground, 1, 33, 9, 6, T.plaza)
  // park
  rect(ground, 14, 34, 8, 6, T.grassDark)
  // roads: two horizontal, three vertical (2 tiles wide), sidewalks around. Junctions
  // are plain asphalt; dashed centre lines run between them.
  const V_ROADS = [
    [10, 0, 39],
    [34, 17, 47],
    [23, 18, 33],
  ]
  const H_ROADS = [17, 31]
  const inVRoad = (x, y, margin) =>
    V_ROADS.some(([vx, y0, y1]) => x >= vx - margin && x <= vx + 1 + margin && y >= y0 && y <= y1)
  for (const [x, y0, y1] of V_ROADS)
    for (let y = y0; y <= y1; y++) {
      set(ground, x - 1, y, T.sidewalk)
      set(ground, x, y, y % 2 ? T.asphalt : T.lineV)
      set(ground, x + 1, y, y % 2 ? T.asphalt : T.lineV2)
      set(ground, x + 2, y, T.sidewalk)
    }
  for (const y of H_ROADS)
    for (let x = 0; x < MAP_W; x++) {
      for (const sy of [y - 1, y + 2])
        set(ground, x, sy, inVRoad(x, sy, 0) ? T.asphalt : T.sidewalk)
      const junction = inVRoad(x, y - 1, 1) || inVRoad(x, y + 2, 1)
      set(ground, x, y, !junction && x % 2 ? T.lineH : T.asphalt)
      set(ground, x, y + 1, !junction && x % 2 ? T.lineH2 : T.asphalt)
    }
  // vertical roads keep their lines out of the junctions
  for (const [x, y0, y1] of V_ROADS)
    for (let y = y0; y <= y1; y++)
      if (H_ROADS.some((hy) => y >= hy - 2 && y <= hy + 3)) {
        if (H_ROADS.some((hy) => y >= hy && y <= hy + 1)) continue
        if (get(ground, x, y) === T.lineV) set(ground, x, y, T.asphalt)
        if (get(ground, x + 1, y) === T.lineV2) set(ground, x + 1, y, T.asphalt)
      }
  // crossings in front of the palace
  for (const x of [22, 23, 24]) {
    set(ground, x, 17, T.crosswalk)
    set(ground, x, 18, T.crosswalk)
  }
  // deco: hedges around the palace garden, roses in the Rosengarten, trees & lamps
  for (let x = 13; x < 35; x += 1) if (x < 19 || x > 26) set(deco, x, 16, x % 4 === 0 ? T.lamp : -1)
  for (let x = 28; x < 35; x++) set(deco, x, 9, T.roses)
  for (let y = 10; y < 15; y++) set(deco, 34, y, T.roses)
  for (const [x, y] of [
    [15, 36],
    [20, 37],
    [14, 39],
    [21, 34],
    [18, 34],
  ])
    set(deco, x, y, T.tree)
  for (const [x, y] of [
    [16, 35],
    [19, 39],
  ])
    set(deco, x, y, T.bench)
  for (let k = 0; k < 70; k++) {
    const x = Math.floor(r() * MAP_W)
    const y = Math.floor(r() * MAP_H)
    const i = y * MAP_W + x
    if ((ground[i] === T.grass || ground[i] === T.grassDark) && deco[i] === -1)
      deco[i] = r() < 0.6 ? T.tree : T.bush
  }
  // keep building footprints and doors free of deco
  for (const p of PLACES) {
    rect(deco, p.x, p.y, p.w, p.h, -1)
    set(deco, p.door[0], p.door[1], -1)
    set(ground, p.door[0], p.door[1], T.plaza)
  }

  // collision: water & blocking deco & building footprints
  const collision = new Array(size).fill(0)
  for (let i = 0; i < size; i++)
    if (ground[i] === T.water || BLOCKING.has(deco[i])) collision[i] = 1
  for (const p of PLACES) rect(collision, p.x, p.y, p.w, p.h, 1)
  for (const p of PLACES) set(collision, p.door[0], p.door[1], 0)

  const gid = (t) => (t < 0 ? 0 : t + 1)
  const layer = (id, name, data, extra = {}) => ({
    id,
    name,
    type: 'tilelayer',
    width: MAP_W,
    height: MAP_H,
    x: 0,
    y: 0,
    opacity: 1,
    visible: true,
    data,
    ...extra,
  })
  const prop = (name, type, value) => ({ name, type, value })
  return {
    type: 'map',
    version: '1.10',
    tiledversion: '1.11.0',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    width: MAP_W,
    height: MAP_H,
    tilewidth: TILE,
    tileheight: TILE,
    infinite: false,
    nextlayerid: 6,
    nextobjectid: PLACES.length + 2,
    tilesets: [
      {
        firstgid: 1,
        name: 'superbia',
        image: 'superbia-tiles.png',
        imagewidth: 8 * TILE,
        imageheight: 4 * TILE,
        tilewidth: TILE,
        tileheight: TILE,
        tilecount: 32,
        columns: 8,
        margin: 0,
        spacing: 0,
      },
    ],
    layers: [
      layer(1, 'ground', ground.map(gid)),
      layer(2, 'deco', deco.map(gid)),
      layer(
        3,
        'collision',
        collision.map((v) => (v ? gid(T.fence) : 0)),
        { visible: false },
      ),
      {
        id: 4,
        name: 'buildings',
        type: 'objectgroup',
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
        draworder: 'topdown',
        objects: PLACES.map((p, i) => ({
          id: i + 1,
          name: p.id,
          type: 'building',
          x: p.x * TILE,
          y: p.y * TILE,
          width: p.w * TILE,
          height: p.h * TILE,
          rotation: 0,
          visible: true,
          properties: [
            prop('location', 'string', p.id),
            prop('sprite', 'string', p.sprite),
            prop('doorX', 'int', p.door[0]),
            prop('doorY', 'int', p.door[1]),
          ],
        })),
      },
      {
        id: 5,
        name: 'spawn',
        type: 'objectgroup',
        x: 0,
        y: 0,
        opacity: 1,
        visible: true,
        draworder: 'topdown',
        objects: [
          {
            id: PLACES.length + 1,
            name: 'spawn',
            type: 'spawn',
            x: 23 * TILE,
            y: 16 * TILE,
            width: 0,
            height: 0,
            point: true,
            rotation: 0,
            visible: true,
          },
        ],
      },
    ],
  }
}

export function generateMap() {
  save('maps/superbia-tiles.png', tileset())
  saveText('maps/superbia.json', `${JSON.stringify(buildMap())}\n`)
  for (const [name, draw] of Object.entries(BUILDINGS)) save(`sprites/${name}.png`, draw())
  const [walk, walkJson] = walkCycle()
  save('sprites/player-walk.png', walk, walkJson)
}
