/**
 * Pixel placeholders for level 1, the press briefing hall (480×600): blue back wall with
 * an oval plaque, a small stage with podium and flags, and tiered rows of seats that run
 * to the bottom and beyond both edges of the screen. Seen from the back of the hall with
 * a flat perspective, so every reporter is small and many fit in.
 * Play-area coordinates (0…320) map to background x + 80.
 */
import { asepriteJson, C, Canvas, rng, save } from './pixel-lib.mjs'

const OX = 80
export const HALL_H = 600
const STAGE_TOP = 200
const STAGE_FRONT = 252
/** Seat grid — keep in sync with content/locations/press-house.json. */
export const SEAT_X = [14, 38, 62, 86, 110, 134, 186, 210, 234, 258, 282, 306]
export const ROW_Y = Array.from({ length: 14 }, (_, i) => 276 + i * 24)
/** Seats outside the 320 px core: always occupied, only visible on wide screens. */
const OUTER_X = [-58, -34, -10, 330, 354, 378]

const GLYPHS = {
  S: ['.xx', 'x..', '.x.', '..x', 'xx.'],
  U: ['x.x', 'x.x', 'x.x', 'x.x', 'xxx'],
  P: ['xx.', 'x.x', 'xx.', 'x..', 'x..'],
  E: ['xxx', 'x..', 'xx.', 'x..', 'xxx'],
  R: ['xx.', 'x.x', 'xx.', 'x.x', 'x.x'],
  B: ['xx.', 'x.x', 'xx.', 'x.x', 'xx.'],
  I: ['xxx', '.x.', '.x.', '.x.', 'xxx'],
  A: ['.x.', 'x.x', 'xxx', 'x.x', 'x.x'],
  L: ['x..', 'x..', 'x..', 'x..', 'xxx'],
  T: ['xxx', '.x.', '.x.', '.x.', '.x.'],
}
function write(c, x, y, text, color) {
  let cx = x
  for (const ch of text) {
    const g = GLYPHS[ch]
    if (g)
      g.forEach((row, j) => {
        ;[...row].forEach((p, i) => {
          if (p === 'x') c.px(cx + i, y + j, color)
        })
      })
    cx += 4
  }
}

/** Seat back seen from behind, bottom-centre at (x, y) — 18×10. */
function chair(c, x, y) {
  c.rect(x - 9, y - 10, 18, 8, C.blueD)
  c.hline(x - 8, x + 8, y - 10, C.blue)
  c.rect(x - 9, y - 2, 18, 2, C.navyD)
}

/** A seated person from behind, bottom-centre at (x, y) — 24×28 box. */
function person(c, x, y, { hair, jacket, bun = false, bob = 0 }) {
  chair(c, x, y)
  c.ellipse(x, y - 9 + bob, 9, 5, jacket)
  c.ellipse(x, y - 19 + bob, 5, 6, hair)
  c.px(x - 6, y - 18 + bob, C.skin)
  c.px(x + 6, y - 18 + bob, C.skin)
  if (bun) c.ellipse(x, y - 26 + bob, 2, 2, hair)
}

const LOOKS = [
  { hair: C.ink, jacket: C.grey3 },
  { hair: C.gold, jacket: C.plum },
  { hair: C.woodD, jacket: C.redD },
  { hair: C.grey1, jacket: C.navy },
  { hair: C.wood, jacket: C.greenD, bun: true },
  { hair: C.rust, jacket: C.blueD },
]

function background() {
  const c = new Canvas(480, HALL_H)
  const r = rng(3)
  // Blue back wall with soft vertical panels.
  for (let y = 0; y < STAGE_TOP; y++) c.hline(0, 479, y, C.blueD)
  for (let x = 0; x < 480; x += 32) {
    c.vline(x, 18, STAGE_TOP - 1, C.navy)
    c.vline(x + 1, 18, STAGE_TOP - 1, C.blue)
  }
  c.rect(0, 0, 480, 16, C.navyD)
  c.hline(0, 479, 16, C.grey1)
  c.hline(0, 479, 17, C.grey2)
  // Side doors outside the core area.
  for (const x0 of [8, 424]) {
    c.rect(x0, 118, 48, STAGE_TOP - 118, C.wood)
    c.rect(x0 + 4, 122, 40, STAGE_TOP - 122, C.woodL)
    c.vline(x0 + 24, 122, STAGE_TOP - 1, C.woodD)
    c.rect(x0 + 18, 160, 3, 3, C.gold)
    c.rect(x0 + 27, 160, 3, 3, C.gold)
  }
  // Stage.
  for (let y = STAGE_TOP; y < STAGE_FRONT; y++) c.hline(0, 479, y, y % 6 ? C.navy : C.navyD)
  c.rect(0, STAGE_FRONT - 4, 480, 4, C.woodL)
  c.hline(0, 479, STAGE_FRONT - 4, C.sand)
  c.rect(0, STAGE_FRONT, 480, 5, C.woodD)
  // Two flags behind the podium.
  for (const [px, dir, colors] of [
    [OX + 96, 1, [C.gold, C.red]],
    [OX + 224, -1, [C.red, C.gold]],
  ]) {
    c.vline(px, 118, STAGE_FRONT - 6, C.grey1)
    c.rect(px - 1, 114, 3, 4, C.gold)
    for (let y = 0; y < 50; y++) {
      const fold = Math.floor(y / 10) % 2
      for (let i = 1; i <= 11; i++)
        c.px(px + dir * i, 120 + y, (i + fold) % 5 === 0 ? C.ink : colors[Math.floor(y / 17) % 2])
    }
    c.rect(px - 3, STAGE_FRONT - 8, 7, 3, C.gold)
  }
  // Tiered rows („Ränge“): alternating tier colours with a front lip.
  for (let y = STAGE_FRONT + 5; y < HALL_H; y++) c.hline(0, 479, y, C.navyD)
  ROW_Y.forEach((rowY, i) => {
    const top = rowY - 22
    for (let y = top; y < rowY + 2; y++) c.hline(0, 479, y, i % 2 ? C.navy : C.navyD)
    c.hline(0, 479, rowY + 1, C.grey3)
    // centre aisle with steps
    c.rect(OX + 146, top, 28, 24, C.grey3)
    c.hline(OX + 146, OX + 173, rowY + 1, C.grey2)
    for (let k = 0; k < 6; k++)
      c.px(OX + 150 + Math.floor(r() * 20), top + 4 + Math.floor(r() * 16), C.grey2)
  })
  // Empty seats in the core (the press corps and court reporters sit on top of them).
  for (const y of ROW_Y) for (const x of SEAT_X) chair(c, OX + x, y)
  // Full rows beyond both edges: the hall is packed.
  let look = 0
  for (const y of ROW_Y) for (const x of OUTER_X) person(c, OX + x, y, LOOKS[look++ % LOOKS.length])
  // TV cameras on a riser at the far right of the stage.
  c.rect(OX + 336, 214, 56, 38, C.grey3)
  c.rect(OX + 348, 196, 24, 16, C.ink)
  c.rect(OX + 340, 200, 10, 7, C.grey2)
  c.px(OX + 368, 199, C.red)
  return c
}

/** Oval plaque above the podium — fictional, no real seal or wording. */
function plaque() {
  const c = new Canvas(104, 64)
  c.ellipse(52, 32, 51, 31, C.gold)
  c.ellipse(52, 32, 48, 28, C.navyD)
  c.ellipse(52, 32, 44, 24, C.blueD)
  write(c, 41, 12, 'PALAST', C.gold)
  c.ascii(46, 20, ['...y...', '..yyy..', 'yyyyyyy', '.yyyyy.', '.yy.yy.'], { y: C.yellow })
  write(c, 36, 44, 'SUPERBIA', C.gold)
  c.hline(18, 86, 30, C.gold)
  c.px(17, 30, C.yellow)
  c.px(87, 30, C.yellow)
  return c
}

function podium() {
  const c = new Canvas(80, 64)
  for (const mx of [34, 46]) {
    c.vline(mx, 5, 17, C.grey2)
    c.rect(mx - 2, 0, 5, 6, C.grey3)
    c.px(mx, 1, C.grey1)
  }
  c.rect(3, 16, 74, 6, C.woodL)
  c.hline(3, 76, 16, C.skin)
  c.hline(3, 76, 21, C.woodD)
  for (let y = 22; y < 60; y++) {
    const inset = 7 + Math.floor((y - 22) / 7)
    c.hline(inset, 79 - inset, y, C.wood)
    c.px(inset, y, C.woodL)
    c.px(79 - inset, y, C.woodD)
  }
  c.rect(4, 59, 72, 5, C.woodD)
  c.ellipse(40, 38, 13, 11, C.gold)
  c.ellipse(40, 38, 11, 9, C.blueD)
  c.ascii(36, 33, ['...y...', '..yyy..', 'yyyyyyy', '.yyyyy.', '.yy.yy.'], { y: C.yellow })
  c.hline(33, 47, 44, C.gold)
  c.outline(C.ink)
  return c
}

/**
 * Reporters of the press corps, seen from behind. 24×28 frames: idle 0-1,
 * react 2-4 (hand up, notepad or camera flash). A random one reacts on taps.
 */
const REPORTERS = {
  'reporter-frieda': { ...LOOKS[4], prop: 'pen' },
  'reporter-a': { ...LOOKS[0], prop: 'hand' },
  'reporter-b': { ...LOOKS[1], prop: 'camera' },
  'reporter-c': { ...LOOKS[2], prop: 'notepad' },
  'reporter-d': { ...LOOKS[3], prop: 'hand' },
  'reporter-e': { ...LOOKS[5], prop: 'notepad' },
}
function reporter(name, look) {
  const W = 24
  const H = 28
  const c = new Canvas(W * 5, H)
  for (let f = 0; f < 5; f++) {
    const o = f * W
    person(c, o + 12, H, { ...look, bob: f === 1 ? 1 : 0 })
    if (f >= 2) {
      const lift = [0, 3, 1][f - 2]
      if (look.prop === 'camera') {
        c.rect(o + 7, 3 + lift, 10, 6, C.ink)
        c.rect(o + 10, 4 + lift, 4, 4, C.grey3)
        if (f === 2) c.ascii(o + 9, 0, ['w.w', '.w.', 'w.w'], { w: C.white })
      } else {
        c.rect(o + 18, 2 + lift, 2, 12 - lift, look.jacket)
        c.rect(o + 18, lift, 2, 2, C.skin)
        if (look.prop === 'notepad') {
          c.rect(o + 19, lift, 5, 5, C.white)
          c.px(o + 21, lift + 2, C.grey2)
        }
        if (look.prop === 'pen') c.vline(o + 21, lift, lift + 3, C.gold)
      }
    }
  }
  return [c, asepriteJson(`${name}.png`, W, H, 5, { idle: [0, 1, 700], react: [2, 4, 160] })]
}

/** Court reporter („Hofberichterstatter“): gold jacket, waves the gilded paper. */
function courtReporter() {
  const c = new Canvas(48, 28)
  for (let f = 0; f < 2; f++) {
    const o = f * 24
    person(c, o + 12, 28, { hair: [C.woodD, C.ink][f], jacket: C.gold })
    const y = 1 + f * 2
    c.rect(o + 2, y, 9, 7, C.yellow)
    c.hline(o + 3, o + 9, y + 2, C.orange)
    c.px(o + 9, y + 5, C.red)
  }
  return [c, asepriteJson('gen-paper.png', 24, 28, 2, { idle: [0, 1, 500] })]
}

export function generatePressRoom() {
  save('sprites/scene-background.png', background())
  save('sprites/scene-plaque.png', plaque())
  save('sprites/scene-podium.png', podium())
  for (const [name, look] of Object.entries(REPORTERS)) {
    const [c, json] = reporter(name, look)
    save(`sprites/${name}.png`, c, json)
  }
  const [paper, paperJson] = courtReporter()
  save('sprites/gen-paper.png', paper, paperJson)
}
