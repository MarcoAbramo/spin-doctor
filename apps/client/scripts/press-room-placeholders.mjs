/**
 * Pixel placeholders for level 1, the press briefing room: blue back wall with an oval
 * plaque, a small stage with podium and flags, rows of seats with the press corps.
 * Play-area coordinates (0…320) map to background x + 80.
 */
import { asepriteJson, C, Canvas, rng, save } from './pixel-lib.mjs'

const OX = 80
/** Seat columns and rows — keep in sync with content/locations/press-house.json. */
export const SEAT_X = [28, 76, 124, 196, 244, 292]
export const ROWS_Y = [340, 370, 400]
const STAGE_TOP = 236
const STAGE_FRONT = 300

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

function chairBack(c, x, y) {
  // Seat seen from behind, bottom-centre at (x, y).
  c.rect(x - 14, y - 18, 28, 14, C.blueD)
  c.hline(x - 13, x + 12, y - 18, C.blue)
  c.rect(x - 14, y - 4, 28, 4, C.navyD)
  c.vline(x - 12, y - 4, y - 1, C.grey3)
  c.vline(x + 11, y - 4, y - 1, C.grey3)
}

function background() {
  const c = new Canvas(480, 400)
  const r = rng(3)
  // Blue back wall with soft vertical panels (the look of a briefing room).
  for (let y = 0; y < STAGE_TOP; y++) c.hline(0, 479, y, C.blueD)
  for (let x = 0; x < 480; x += 32) {
    c.vline(x, 18, STAGE_TOP - 1, C.navy)
    c.vline(x + 1, 18, STAGE_TOP - 1, C.blue)
  }
  c.rect(0, 0, 480, 16, C.navyD)
  c.hline(0, 479, 16, C.grey1)
  c.hline(0, 479, 17, C.grey2)
  // Side walls with doors outside the core area.
  for (const x0 of [8, 424]) {
    c.rect(x0, 150, 48, STAGE_TOP - 150, C.wood)
    c.rect(x0 + 4, 154, 40, STAGE_TOP - 154, C.woodL)
    c.vline(x0 + 24, 154, STAGE_TOP - 1, C.woodD)
    c.rect(x0 + 18, 196, 3, 3, C.gold)
    c.rect(x0 + 27, 196, 3, 3, C.gold)
  }
  // Stage: carpet, front edge.
  for (let y = STAGE_TOP; y < STAGE_FRONT; y++) c.hline(0, 479, y, y % 6 ? C.navy : C.navyD)
  c.rect(0, STAGE_FRONT - 4, 480, 4, C.woodL)
  c.hline(0, 479, STAGE_FRONT - 4, C.sand)
  c.rect(0, STAGE_FRONT, 480, 6, C.woodD)
  // Two flags behind the podium.
  for (const [px, dir, colors] of [
    [OX + 96, 1, [C.gold, C.red]],
    [OX + 224, -1, [C.red, C.gold]],
  ]) {
    c.vline(px, 150, STAGE_FRONT - 6, C.grey1)
    c.rect(px - 1, 146, 3, 4, C.gold)
    for (let y = 0; y < 60; y++) {
      const fold = Math.floor(y / 10) % 2
      for (let i = 1; i <= 12; i++)
        c.px(px + dir * i, 152 + y, (i + fold) % 5 === 0 ? C.ink : colors[Math.floor(y / 20) % 2])
    }
    c.rect(px - 3, STAGE_FRONT - 8, 7, 3, C.gold)
  }
  // Audience floor: dark carpet with a lighter aisle pattern.
  for (let y = STAGE_FRONT + 6; y < 400; y++) c.hline(0, 479, y, (y >> 2) % 2 ? C.navyD : C.navy)
  for (let i = 0; i < 120; i++)
    c.px(Math.floor(r() * 480), STAGE_FRONT + 6 + Math.floor(r() * 94), C.grey3)
  // Rows 2 and 3 are empty seats until the court reporters move in.
  for (const y of ROWS_Y.slice(1)) for (const x of SEAT_X) chairBack(c, OX + x, y)
  // Seats outside the core area (wide screens).
  for (const y of ROWS_Y) for (const x of [-20, 340, 388]) chairBack(c, OX + x, y)
  // TV camera riser at the far right.
  c.rect(OX + 330, 250, 60, 50, C.grey3)
  c.rect(OX + 344, 226, 26, 20, C.ink)
  c.rect(OX + 336, 232, 10, 8, C.grey2)
  c.px(OX + 366, 230, C.red)
  return c
}

/** Oval plaque above the podium — fictional, no real seal or wording. */
function plaque() {
  const c = new Canvas(104, 64)
  c.ellipse(52, 32, 51, 31, C.gold)
  c.ellipse(52, 32, 48, 28, C.navyD)
  c.ellipse(52, 32, 44, 24, C.blueD)
  write(c, 41, 12, 'PALAST', C.gold)
  c.ascii(46, 20, ['...y...', '..yyy..', 'yyyyyyy', '.yyyyy.', '.yy.yy.'], {
    y: C.yellow,
  })
  write(c, 36, 44, 'SUPERBIA', C.gold)
  c.hline(18, 86, 30, C.gold)
  c.px(17, 30, C.yellow)
  c.px(87, 30, C.yellow)
  return c
}

function podium() {
  const c = new Canvas(80, 64)
  // two microphones
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
  // blue oval seal with a gold star
  c.ellipse(40, 38, 13, 11, C.gold)
  c.ellipse(40, 38, 11, 9, C.blueD)
  c.ascii(36, 33, ['...y...', '..yyy..', 'yyyyyyy', '.yyyyy.', '.yy.yy.'], { y: C.yellow })
  c.hline(33, 47, 44, C.gold)
  c.outline(C.ink)
  return c
}

/**
 * Reporters seen from behind (front row). 40×44 frames: idle 0-1, react 2-4
 * (hand up, notepad or camera flash). Variants differ in hair, jacket and prop.
 */
const REPORTERS = {
  'reporter-frieda': { hair: C.wood, jacket: C.greenD, bun: true, prop: 'pen' },
  'reporter-a': { hair: C.ink, jacket: C.grey3, prop: 'hand' },
  'reporter-b': { hair: C.gold, jacket: C.plum, prop: 'camera' },
  'reporter-c': { hair: C.woodD, jacket: C.redD, prop: 'notepad' },
  'reporter-d': { hair: C.grey1, jacket: C.navy, prop: 'hand' },
}
function reporter(name, { hair, jacket, bun, prop }) {
  const W = 40
  const H = 44
  const c = new Canvas(W * 5, H)
  for (let f = 0; f < 5; f++) {
    const o = f * W
    const bob = f === 1 ? 1 : 0
    const raise = f >= 2 ? [0, 4, 2][f - 2] : -1
    // chair back
    c.rect(o + 6, 26, 28, 14, C.blueD)
    c.hline(o + 7, o + 32, 26, C.blue)
    c.rect(o + 6, 40, 28, 4, C.navyD)
    // shoulders and head (back view)
    c.ellipse(o + 20, 27 + bob, 13, 6, jacket)
    c.ellipse(o + 20, 15 + bob, 7, 8, hair)
    c.px(o + 12, 16 + bob, C.skin)
    c.px(o + 28, 16 + bob, C.skin)
    if (bun) c.ellipse(o + 20, 6 + bob, 3, 3, hair)
    if (raise >= 0) {
      const top = 2 + raise
      if (prop === 'camera') {
        c.rect(o + 12, 8 + raise, 16, 10, C.ink)
        c.rect(o + 17, 10 + raise, 6, 6, C.grey3)
        if (f === 2) {
          c.ascii(o + 14, raise, ['w.w.w', '.www.', 'wwwww', '.www.', 'w.w.w'], { w: C.white })
        }
      } else {
        c.rect(o + 29, top + 4, 4, 18 - raise, jacket)
        c.rect(o + 29, top, 4, 4, C.skin)
        if (prop === 'notepad') {
          c.rect(o + 31, top - 2, 8, 9, C.white)
          c.hline(o + 32, o + 37, top + 1, C.grey2)
        }
        if (prop === 'pen') c.vline(o + 34, top - 3, top + 2, C.gold)
      }
    }
    c.outline(C.ink, o, 0, W, H)
  }
  return [c, asepriteJson(`${name}.png`, W, H, 5, { idle: [0, 1, 700], react: [2, 4, 160] })]
}

/** Court reporter („Hofberichterstatter“): sits in rows 2–3, waves the gilded paper. */
function courtReporter() {
  const c = new Canvas(96, 48)
  for (let f = 0; f < 2; f++) {
    const o = f * 48
    // chair
    c.rect(o + 10, 30, 28, 14, C.blueD)
    c.hline(o + 11, o + 36, 30, C.blue)
    c.rect(o + 10, 44, 28, 4, C.navyD)
    // body, head
    c.ellipse(o + 24, 31, 13, 6, C.gold)
    c.ellipse(o + 24, 19, 7, 8, [C.woodD, C.ink][f])
    c.px(o + 16, 20, C.skin)
    c.px(o + 32, 20, C.skin)
    // gilded newspaper held up
    const y = 4 + f * 2
    c.rect(o + 6, y, 14, 10, C.yellow)
    c.hline(o + 7, o + 18, y + 2, C.orange)
    c.hline(o + 7, o + 16, y + 5, C.gold)
    c.px(o + 18, y + 7, C.red)
    c.outline(C.ink, o, 0, 48, 48)
  }
  return [c, asepriteJson('gen-paper.png', 48, 48, 2, { idle: [0, 1, 500] })]
}

export function generatePressRoom() {
  save('sprites/scene-background.png', background())
  save('sprites/scene-plaque.png', plaque())
  save('sprites/scene-podium.png', podium())
  for (const [name, def] of Object.entries(REPORTERS)) {
    const [c, json] = reporter(name, def)
    save(`sprites/${name}.png`, c, json)
  }
  const [paper, paperJson] = courtReporter()
  save('sprites/gen-paper.png', paper, paperJson)
}
