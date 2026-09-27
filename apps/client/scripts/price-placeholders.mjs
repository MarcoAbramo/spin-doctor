/** Pixel placeholders for level 3: „P.R.I.C.E.-Behörde“, the record wall and the shark moat. */
import { asepriteJson, C, Canvas, rng, save } from './pixel-lib.mjs'

/** 3×5 pixel glyphs for signs and stamps. */
const GLYPHS = {
  P: ['xx.', 'x.x', 'xx.', 'x..', 'x..'],
  R: ['xx.', 'x.x', 'xx.', 'x.x', 'x.x'],
  I: ['xxx', '.x.', '.x.', '.x.', 'xxx'],
  C: ['.xx', 'x..', 'x..', 'x..', '.xx'],
  E: ['xxx', 'x..', 'xx.', 'x..', 'xxx'],
  A: ['.x.', 'x.x', 'xxx', 'x.x', 'x.x'],
  S: ['.xx', 'x..', '.x.', '..x', 'xx.'],
  Z: ['xxx', '..x', '.x.', 'x..', 'xxx'],
  O: ['xxx', 'x.x', 'x.x', 'x.x', 'xxx'],
  L: ['x..', 'x..', 'x..', 'x..', 'xxx'],
  '.': ['...', '...', '...', '...', '.x.'],
  1: ['.x.', 'xx.', '.x.', '.x.', 'xxx'],
  0: ['xxx', 'x.x', 'x.x', 'x.x', 'xxx'],
  '%': ['x.x', '..x', '.x.', 'x..', 'x.x'],
  '+': ['...', '.x.', 'xxx', '.x.', '...'],
}
function write(c, x, y, text, color, scale = 1) {
  let cx = x
  for (const ch of text) {
    const g = GLYPHS[ch]
    if (g)
      g.forEach((row, j) => {
        ;[...row].forEach((p, i) => {
          if (p === 'x') c.rect(cx + i * scale, y + j * scale, scale, scale, color)
        })
      })
    cx += 4 * scale
  }
}

function background() {
  const c = new Canvas(480, 400)
  const r = rng(33)
  // grey office hall, fluorescent tubes
  for (let y = 0; y < 262; y++) c.hline(0, 479, y, y < 40 ? C.grey3 : C.grey2)
  for (let x = 30; x < 480; x += 90) {
    c.rect(x, 18, 50, 4, C.white)
    c.rect(x, 22, 50, 2, C.grey1)
  }
  // wall of counters with numbered windows
  for (let x = 12; x < 470; x += 58) {
    c.rect(x, 120, 48, 110, C.navy)
    c.rect(x + 4, 126, 40, 40, C.cyan)
    c.rect(x + 6, 128, 36, 36, C.blue)
    c.rect(x + 14, 170, 20, 8, C.gold)
    write(c, x + 16, 171, String(1 + Math.floor(r() * 9)), C.ink)
    c.rect(x, 200, 48, 30, C.grey3)
    c.hline(x, x + 47, 200, C.grey1)
  }
  // queue rope posts
  for (let x = 40; x < 470; x += 40) {
    c.rect(x, 236, 4, 22, C.gold)
    c.hline(x + 4, x + 39, 242 + ((x / 40) % 2), C.red)
  }
  // floor tiles
  for (let y = 262; y < 400; y++) {
    for (let x = 0; x < 480; x += 24) {
      const dark = (Math.floor(x / 24) + Math.floor((y - 262) / 16)) % 2
      c.hline(x, x + 23, y, dark ? C.grey3 : C.grey2)
    }
  }
  // stacks of forms on the floor
  for (let k = 0; k < 14; k++) {
    const x = Math.floor(r() * 460)
    const y = 280 + Math.floor(r() * 100)
    c.rect(x, y, 12, 4, C.white)
    c.hline(x, x + 11, y + 4, C.grey1)
  }
  return c
}

function sign() {
  const c = new Canvas(200, 36)
  c.rect(0, 0, 200, 36, C.navyD)
  c.rect(2, 2, 196, 32, C.navy)
  write(c, 30, 7, 'P.R.I.C.E.', C.gold, 3)
  c.hline(10, 189, 28, C.gold)
  c.outline(C.ink)
  return c
}

function counter() {
  const c = new Canvas(96, 64)
  c.rect(0, 14, 96, 50, C.woodD)
  c.rect(2, 16, 92, 46, C.wood)
  c.rect(0, 10, 96, 6, C.woodL)
  // stamp and ink pad
  c.rect(60, 2, 10, 8, C.woodD)
  c.rect(58, 0, 14, 3, C.wood)
  c.rect(74, 6, 16, 4, C.redD)
  // forms
  c.rect(8, 4, 20, 7, C.white)
  c.hline(10, 25, 7, C.grey2)
  // big "ZOLL" plate
  c.rect(26, 26, 44, 20, C.gold)
  write(c, 32, 30, 'ZOLL', C.ink, 2)
  c.outline(C.ink)
  return c
}

function turnstile() {
  const c = new Canvas(40, 56)
  c.rect(14, 8, 12, 48, C.grey3)
  c.rect(12, 4, 16, 6, C.grey1)
  c.rect(2, 22, 36, 3, C.grey1)
  c.rect(19, 12, 2, 40, C.grey2)
  c.rect(16, 6, 8, 3, C.red) // fee display
  c.outline(C.ink)
  return c
}

function strip(n, draw) {
  const c = new Canvas(48 * n, 48)
  for (let i = 0; i < n; i++) {
    draw(c, i * 48, i)
    c.outline(C.ink, i * 48, 0, 48, 48)
  }
  return c
}
const GENERATORS = {
  'gen-entry-till': (c, o, f) => {
    c.rect(o + 8, 20, 32, 26, C.grey3)
    c.rect(o + 10, 12, 28, 10, C.navy)
    c.rect(o + 12, 14, 24, 6, C.green)
    write(c, o + 14, 14, '+1', C.ink)
    c.rect(o + 12, 26, 24, 4, C.grey1)
    c.rect(o + 14, 34 + f * 2, 20, 6, C.gold) // drawer
    if (f) c.ellipse(o + 42, 10, 3, 3, C.gold)
  },
  'gen-cookie-sniffer': (c, o, f) => {
    c.ellipse(o + 22, 32, 12, 7, C.woodL)
    c.ellipse(o + 34, 26 - f, 7, 6, C.woodL)
    c.rect(o + 38, 26 - f, 5, 3, C.wood)
    c.px(o + 42, 26 - f, C.ink)
    c.rect(o + 30, 20 - f, 3, 6, C.wood) // ear
    for (const x of [14, 20, 26, 30]) c.rect(o + x, 37, 3, 8, C.woodL)
    c.rect(o + 18, 28, 10, 3, C.blueD) // P.R.I.C.E. vest
    c.ellipse(o + 8, 12, 5, 5, C.sand) // cookie
    c.px(o + 7, 11, C.wood)
    c.px(o + 9, 13, C.wood)
  },
  'gen-form-labyrinth': (c, o, f) => {
    for (let k = 0; k < 4; k++) {
      c.rect(o + 6 + k * 9, 44 - (k + 2) * 7, 8, (k + 2) * 7, C.white)
      for (let y = 44 - (k + 2) * 7 + 2; y < 44; y += 3)
        c.hline(o + 7 + k * 9, o + 12 + k * 9, y, C.grey2)
    }
    c.rect(o + 4, 44, 40, 4, C.grey3)
    c.rect(o + 30, 4 + f * 2, 10, 7, C.white) // flying form
  },
  'gen-stamp-robot': (c, o, f) => {
    c.rect(o + 14, 18, 20, 20, C.grey2)
    c.rect(o + 16, 8, 16, 10, C.grey1)
    c.rect(o + 19, 11, 3, 3, C.red)
    c.rect(o + 26, 11, 3, 3, C.red)
    c.rect(o + 34, 20 + f * 8, 8, 6, C.woodD) // stamping arm
    c.rect(o + 32, 22, 4, 3, C.grey3)
    c.rect(o + 16, 38, 6, 8, C.grey3)
    c.rect(o + 26, 38, 6, 8, C.grey3)
    if (f) c.rect(o + 34, 44, 10, 3, C.red)
  },
}

/**
 * The record wall along the eastern city edge: 11 construction stages
 * (the map picks the frame from owned / maxCount).
 */
function recordWall() {
  const W = 176
  const H = 24
  const N = 11
  const c = new Canvas(W * N, H)
  for (let f = 0; f < N; f++) {
    const o = f * W
    const built = Math.round((f / (N - 1)) * W)
    // foundation line (surveyor's pegs)
    for (let x = 0; x < W; x += 16) c.rect(o + x, H - 3, 2, 3, C.orange)
    for (let x = 0; x < built; x++) {
      const cardboard = f >= 4 && x > W * 0.3 && x < W * 0.5
      const col = cardboard
        ? C.sand
        : (Math.floor(x / 8) + (x % 8 === 0 ? 1 : 0)) % 2
          ? C.grey2
          : C.grey1
      c.vline(o + x, 6, H - 1, col)
      if (x % 8 === 0) c.vline(o + x, 6, H - 1, C.grey3)
      if (x % 16 < 8) c.px(o + x, 5, C.grey1) // battlements
    }
    if (built > 0) c.hline(o, o + built - 1, H - 1, C.grey3)
    if (f === N - 1) {
      c.rect(o + W / 2 - 10, 0, 20, 7, C.gold) // plaque
      c.rect(o + W / 2 - 1, 0, 2, 2, C.red)
    }
    if (f > 0 && f < N - 1) {
      // crane at the building front
      const x = o + Math.min(W - 6, built + 4)
      c.vline(x, 0, H - 1, C.yellow)
      c.hline(x - 12, x + 4, 1, C.yellow)
      c.vline(x - 10, 1, 8, C.grey3)
    }
  }
  const json = asepriteJson('map-record-wall.png', W, H, N, { idle: [0, 0, 1000] })
  return [c, json]
}

/** Moat with laser sharks around the finance ministry: 5 stages. */
function sharkMoat() {
  const W = 112
  const H = 96
  const N = 5
  const c = new Canvas(W * N, H)
  for (let f = 0; f < N; f++) {
    const o = f * W
    if (f === 0) {
      for (let x = 0; x < W; x += 12) c.rect(o + x, H - 4, 6, 2, C.orange)
      continue
    }
    // ring of water (hole in the middle for the building)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const inRing = x < 10 || x >= W - 10 || y < 10 || y >= H - 10
        if (!inRing) continue
        const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1
        c.px(o + x, y, edge ? C.grey3 : (x + y) % 9 ? C.blueD : C.blue)
      }
    // bridge in front of the door, raised from stage 2
    c.rect(o + 44, H - 10, 20, 10, f >= 2 ? C.blueD : C.wood)
    if (f >= 2) c.rect(o + 44, H - 22, 3, 12, C.wood)
    // sharks: one fin per stage, lasers on top
    const fins = [
      [16, 4],
      [92, 40],
      [4, 60],
      [70, 88],
    ]
    fins.slice(0, f).forEach(([x, y]) => {
      c.ascii(o + x, y, ['..g.', '.gg.', 'gggg'], { g: C.grey1 })
      c.px(o + x + 2, y - 1, C.hot)
    })
  }
  const json = asepriteJson('map-shark-moat.png', W, H, N, { idle: [0, 0, 1000] })
  return [c, json]
}

function portraitHebesatz() {
  const c = new Canvas(48, 48)
  c.rect(0, 0, 48, 48, C.grey3)
  for (let y = 0; y < 48; y += 4) c.hline(0, 47, y, C.navy)
  c.ellipse(24, 50, 18, 12, C.blueD) // uniform
  c.rect(20, 38, 8, 10, C.gold) // tie
  c.ellipse(24, 24, 10, 12, C.skin)
  c.ellipse(13, 25, 2, 3, C.skin)
  c.ellipse(35, 25, 2, 3, C.skin)
  // peaked cap with P.R.I.C.E. badge
  c.rect(12, 8, 24, 8, C.blueD)
  c.rect(10, 15, 28, 3, C.ink)
  c.rect(21, 9, 6, 5, C.gold)
  // round glasses & moustache
  c.ellipse(19, 23, 3, 3, C.grey1)
  c.ellipse(29, 23, 3, 3, C.grey1)
  c.px(19, 23, C.ink)
  c.px(29, 23, C.ink)
  c.hline(22, 26, 23, C.grey1)
  c.rect(19, 29, 10, 2, C.woodD)
  // stamp in hand
  c.rect(38, 30, 6, 8, C.woodD)
  c.rect(37, 38, 8, 3, C.red)
  c.outline(C.ink)
  return c
}

export function generatePrice() {
  save('sprites/scene-price.png', background())
  save('sprites/price-sign.png', sign())
  save('sprites/price-counter.png', counter())
  save('sprites/price-turnstile.png', turnstile())
  for (const [name, draw] of Object.entries(GENERATORS)) {
    save(
      `sprites/${name}.png`,
      strip(2, draw),
      asepriteJson(`${name}.png`, 48, 48, 2, { idle: [0, 1, 400] }),
    )
  }
  const [wall, wallJson] = recordWall()
  save('sprites/map-record-wall.png', wall, wallJson)
  const [moat, moatJson] = sharkMoat()
  save('sprites/map-shark-moat.png', moat, moatJson)
  save('portraits/hebesatz.png', portraitHebesatz())
}
