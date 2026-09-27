/**
 * Generates pixel-art placeholder PNGs (Endesga 32 palette) into public/assets.
 * Existing files are NEVER overwritten (your art is safe) unless you pass --force.
 *
 *   pnpm --filter @spin-doctor/client pixel-placeholders [--force]
 *
 * Animated sprites get an Aseprite-compatible JSON (frames array + meta.frameTags),
 * so you can open the PNG in Aseprite, repaint it and export sheet + JSON again.
 */

import { generateMap } from './map-placeholders.mjs'
import { asepriteJson, C, Canvas, rng, save, stats } from './pixel-lib.mjs'
import { generateRosengarten } from './rosengarten-placeholders.mjs'

// ---------------------------------------------------------------------------
// Scene: background 480×400 (core play area 320×400 centred, x = 80…400)
// ---------------------------------------------------------------------------
function background() {
  const c = new Canvas(480, 400)
  const FLOOR = 290
  c.rect(0, 0, 480, FLOOR, C.blueD)
  // wall panels
  for (let x = 8; x < 480; x += 56) {
    c.rect(x, 34, 44, 180, C.navy)
    c.hline(x, x + 43, 34, C.blue)
    c.vline(x, 34, 213, C.blue)
    c.hline(x, x + 43, 213, C.navyD)
    c.vline(x + 43, 34, 213, C.navyD)
  }
  // crown moulding
  c.rect(0, 0, 480, 14, C.navyD)
  c.hline(0, 479, 14, C.gold)
  c.hline(0, 479, 15, C.orange)
  // wainscot
  c.rect(0, 226, 480, FLOOR - 226, C.wood)
  c.hline(0, 479, 226, C.gold)
  c.hline(0, 479, 227, C.woodL)
  for (let x = 0; x < 480; x += 24) c.vline(x, 230, FLOOR - 2, C.woodD)
  c.hline(0, 479, FLOOR - 1, C.woodD)
  // floor planks
  c.rect(0, FLOOR, 480, 400 - FLOOR, C.wood)
  for (let y = FLOOR + 10, row = 0; y < 400; y += 12, row++) {
    c.hline(0, 479, y, C.woodD)
    for (let x = (row % 2) * 30; x < 480; x += 60) c.vline(x, y - 11, y - 1, C.woodD)
  }
  const r = rng(7)
  for (let i = 0; i < 160; i++)
    c.px(Math.floor(r() * 480), FLOOR + 1 + Math.floor(r() * 109), C.woodL)
  // red carpet towards the podium
  for (let y = FLOOR; y < 400; y++) {
    const half = 40 + Math.floor((y - FLOOR) * 0.35)
    c.hline(240 - half, 240 + half, y, C.redD)
    c.px(240 - half, y, C.gold)
    c.px(240 + half, y, C.gold)
  }
  // curtains at the edges of the core area
  for (const x0 of [80, 376]) {
    c.rect(x0, 16, 24, FLOOR - 16, C.redD)
    for (let x = x0 + 2; x < x0 + 24; x += 6) c.vline(x, 16, FLOOR - 2, C.red)
    for (let x = x0 + 4; x < x0 + 24; x += 6) c.vline(x, 16, FLOOR - 2, C.rust)
    c.rect(x0 - 2, 110, 28, 4, C.gold) // tie-back
  }
  c.rect(80, 16, 320, 10, C.redD) // valance
  for (let x = 80; x < 400; x += 8) c.rect(x, 26, 4, 3, C.redD)
  c.hline(80, 399, 16, C.gold)
  // flags left and right of the portrait
  for (const [px, dir] of [
    [168, 1],
    [312, -1],
  ]) {
    c.vline(px, 60, 225, C.grey2)
    c.px(px, 58, C.gold)
    c.px(px, 59, C.gold)
    for (let y = 0; y < 44; y++) {
      const len = 26 - Math.floor(y / 8)
      for (let i = 1; i <= len; i++) c.px(px + dir * i, 64 + y, y % 14 < 7 ? C.gold : C.red)
    }
  }
  // emblem star above portrait
  c.ascii(234, 34, ['...y...', '..yyy..', 'yyyyyyy', '.yyyyy.', '.yy.yy.', 'y.....y'])
  return c
}

function portrait() {
  const c = new Canvas(64, 80)
  c.rect(0, 0, 64, 80, C.orange)
  c.rect(2, 2, 60, 76, C.gold)
  c.hline(2, 61, 2, C.yellow)
  c.vline(2, 2, 77, C.yellow)
  c.rect(6, 6, 52, 68, C.redD)
  for (let y = 6; y < 74; y++) for (let x = 6 + (y % 4); x < 58; x += 4) c.px(x, y, C.rust)
  // shoulders + sash
  c.ellipse(32, 72, 22, 12, C.navyD)
  for (let i = 0; i < 18; i++) {
    c.px(20 + i, 60 + Math.floor(i * 0.7), C.gold)
    c.px(21 + i, 60 + Math.floor(i * 0.7), C.gold)
  }
  c.rect(29, 56, 6, 4, C.white)
  // head (bald, stylised — deliberately no real-person likeness)
  c.ellipse(32, 38, 11, 13, C.skinL)
  c.ellipse(20, 39, 2, 3, C.skinL)
  c.ellipse(44, 39, 2, 3, C.skinL)
  c.hline(26, 29, 34, C.woodD)
  c.hline(35, 38, 34, C.woodD)
  c.px(27, 37, C.ink)
  c.px(28, 37, C.ink)
  c.px(36, 37, C.ink)
  c.px(37, 37, C.ink)
  // smug grin
  c.hline(27, 37, 45, C.wood)
  c.px(26, 44, C.wood)
  c.px(38, 44, C.wood)
  c.hline(28, 36, 46, C.white)
  // crown
  c.ascii(21, 17, [
    'y....y....y....y....y..',
    'yy..yyy..yyy..yyy..yy..',
    'yyyyyyyyyyyyyyyyyyyyy..',
    'yyrryyyybbyyyyrryyyyy..',
    'yyyyyyyyyyyyyyyyyyyyy..',
  ])
  // name plate
  c.rect(18, 72, 28, 5, C.yellow)
  for (let x = 21; x < 44; x += 3) c.px(x, 74, C.wood)
  return c
}

function podium() {
  const c = new Canvas(80, 64)
  // microphone
  c.vline(40, 5, 17, C.grey2)
  c.rect(37, 0, 6, 6, C.grey3)
  c.hline(38, 41, 1, C.grey1)
  // top slab
  c.rect(3, 16, 74, 6, C.woodL)
  c.hline(3, 76, 16, C.skin)
  c.hline(3, 76, 21, C.woodD)
  // body (slightly narrowing)
  for (let y = 22; y < 60; y++) {
    const inset = 7 + Math.floor((y - 22) / 7)
    c.hline(inset, 79 - inset, y, C.wood)
    c.px(inset, y, C.woodL)
    c.px(inset + 1, y, C.woodL)
    c.px(79 - inset, y, C.woodD)
    c.px(78 - inset, y, C.woodD)
  }
  c.rect(4, 59, 72, 5, C.woodD)
  // emblem
  c.ellipse(40, 39, 10, 10, C.orange)
  c.ellipse(40, 39, 8, 8, C.gold)
  c.ascii(35, 34, [
    '....r....',
    '...rrr...',
    'rrrrrrrrr',
    '.rrrrrrr.',
    '..rrrrr..',
    '.rr...rr.',
    'r.......r',
  ])
  c.outline(C.ink)
  return c
}

// ---------------------------------------------------------------------------
// Player (the press secretary): 6 frames of 48×64 — idle 0-1, talk 2-4, point 5
// ---------------------------------------------------------------------------
function player() {
  const FW = 48
  const c = new Canvas(FW * 6, 64)
  const frames = [
    { bob: 0, mouth: 0, arms: 'down' },
    { bob: 1, mouth: 0, arms: 'down' },
    { bob: 0, mouth: 1, arms: 'half' },
    { bob: -1, mouth: 0, arms: 'high' },
    { bob: 0, mouth: 1, arms: 'wide' },
    { bob: 0, mouth: 1, arms: 'point' },
  ]
  frames.forEach((f, i) => {
    const o = i * FW
    const b = f.bob
    const sleeve = (x, y, w, h) => c.rect(o + x, y + b, w, h, C.navyD)
    const hand = (x, y) => c.rect(o + x, y + b, 3, 3, C.skin)
    // legs
    c.rect(o + 18, 50, 5, 14, C.ink)
    c.rect(o + 25, 50, 5, 14, C.ink)
    // torso + shirt + tie
    c.rect(o + 14, 27 + b, 20, 25, C.navyD)
    for (let y = 0; y < 8; y++)
      c.hline(o + 20 + Math.floor(y / 2), o + 27 - Math.floor(y / 2), 27 + b + y, C.white)
    c.rect(o + 23, 29 + b, 2, 10, C.red)
    c.px(o + 23, 39 + b, C.redD)
    c.hline(o + 14, o + 33, 27 + b, C.navy)
    // arms
    if (f.arms === 'down') {
      sleeve(10, 28, 4, 17)
      sleeve(34, 28, 4, 17)
      hand(10, 45)
      hand(35, 45)
    } else if (f.arms === 'half') {
      sleeve(10, 28, 4, 17)
      hand(10, 45)
      sleeve(34, 22, 4, 9)
      hand(35, 18)
    } else if (f.arms === 'high') {
      sleeve(10, 28, 4, 17)
      hand(10, 45)
      sleeve(35, 12, 4, 17)
      hand(35, 8)
    } else if (f.arms === 'wide') {
      sleeve(4, 28, 10, 4)
      hand(1, 27)
      sleeve(34, 28, 10, 4)
      hand(44, 27)
    } else {
      sleeve(10, 28, 4, 17)
      hand(10, 45)
      sleeve(34, 28, 9, 4)
      hand(43, 28)
      c.hline(o + 46, o + 47, 29 + b, C.skin)
    }
    // head
    c.ellipse(o + 24, 17 + b, 7, 8, C.skin)
    c.rect(o + 17, 9 + b, 15, 4, C.woodD)
    c.px(o + 17, 13 + b, C.woodD)
    c.px(o + 31, 13 + b, C.woodD)
    c.rect(o + 21, 16 + b, 1, 2, C.ink)
    c.rect(o + 27, 16 + b, 1, 2, C.ink)
    if (f.mouth) c.rect(o + 22, 21 + b, 4, 2, C.redD)
    else c.hline(o + 22, o + 25, 22 + b, C.wood)
    c.outline(C.ink, o, 0, FW, 64)
  })
  return [
    c,
    asepriteJson('player.png', FW, 64, 6, {
      idle: [0, 1, 600],
      talk: [2, 4, 90],
      point: [5, 5, 300],
    }),
  ]
}

// ---------------------------------------------------------------------------
// Generators: 48×48 frames
// ---------------------------------------------------------------------------
function strip(n, draw) {
  const c = new Canvas(48 * n, 48)
  for (let i = 0; i < n; i++) {
    draw(c, i * 48, i)
    c.outline(C.ink, i * 48, 0, 48, 48)
  }
  return c
}

const generators = {
  'gen-intern': [
    2,
    (c, o, f) => {
      c.rect(o + 19, 37, 4, 11, C.navy)
      c.rect(o + 25, 37, 4, 11, C.navy)
      c.rect(o + 17, 23, 14, 15, C.blue)
      c.rect(o + 14, 24, 3, 11, C.blue)
      c.rect(o + 14, 35, 3, 3, C.skin)
      c.rect(o + 31, 24, 3, 7, C.blue)
      c.ellipse(o + 24, 16 + f, 6, 6, C.skin)
      c.rect(o + 18, 9 + f, 13, 3, C.gold)
      c.px(o + 26, 16 + f, C.ink)
      c.px(o + 28, 16 + f, C.ink)
      c.rect(o + 30, 17, 5, 9, C.ink)
      c.rect(o + 31, 18, 3, 6, f ? C.yellow : C.cyan)
      c.rect(o + 31, 26, 3, 2, C.skin)
    },
  ],
  'gen-talkshow': [
    2,
    (c, o, f) => {
      c.rect(o + 10, 12, 28, 20, C.redD)
      c.rect(o + 8, 30, 32, 8, C.red)
      c.rect(o + 5, 22, 6, 16, C.rust)
      c.rect(o + 37, 22, 6, 16, C.rust)
      c.rect(o + 8, 38, 3, 8, C.woodD)
      c.rect(o + 37, 38, 3, 8, C.woodD)
      c.rect(o + 17, 18, 14, 13, C.greenD)
      c.ellipse(o + 24, 12, 5, 5, C.tan)
      c.rect(o + 19, 7, 11, 2, C.ink)
      c.px(o + 22, 12, C.ink)
      c.px(o + 26, 12, C.ink)
      if (f) c.rect(o + 23, 15, 3, 2, C.redD)
      else c.hline(o + 23, o + 25, 15, C.wood)
    },
  ],
  'gen-botfarm': [
    2,
    (c, o, f) => {
      c.rect(o + 12, 1, 24, 47, C.navyD)
      c.rect(o + 13, 2, 22, 45, C.navy)
      for (let y = 8, i = 0; y < 44; y += 6, i++) {
        c.rect(o + 15, y, 18, 4, C.navyD)
        c.px(o + 29, y + 1, (i + f) % 2 ? C.green : C.greenD)
        c.px(o + 31, y + 1, (i + f) % 3 ? C.greenD : C.red)
        c.hline(o + 16, o + 24, y + 2, C.grey3)
      }
      c.ellipse(o + 24, 4, 3, 2, C.gold)
      c.px(o + 23, 4, C.ink)
      c.px(o + 25, 4, C.ink)
    },
  ],
  'gen-paper': [
    1,
    (c, o) => {
      for (let i = 0; i < 5; i++) {
        c.rect(o + 7 + (i % 2) * 2, 41 - i * 6, 32, 6, i % 2 ? C.sand : C.white)
        c.hline(o + 9 + (i % 2) * 2, o + 36, 43 - i * 6, C.grey2)
      }
      c.rect(o + 9, 11, 30, 6, C.white)
      c.rect(o + 10, 12, 28, 2, C.red)
      c.hline(o + 11, o + 30, 15, C.grey3)
    },
  ],
  'gen-tv': [
    2,
    (c, o, f) => {
      c.rect(o + 3, 4, 42, 32, C.ink)
      c.rect(o + 6, 7, 36, 26, f ? C.blueD : C.blue)
      const r = rng(11 + f)
      for (let i = 0; i < 18; i++)
        c.px(
          o + 7 + Math.floor(r() * 34),
          8 + Math.floor(r() * 24),
          [C.gold, C.red, C.green, C.white][i % 4],
        )
      c.ascii(o + 20, 14, ['...y...', '..yyy..', 'yyyyyyy', '.yyyyy.', '.yy.yy.'])
      c.rect(o + 22, 36, 4, 7, C.grey3)
      c.rect(o + 14, 43, 20, 3, C.grey3)
    },
  ],
  'gen-ministry': [
    2,
    (c, o, f) => {
      c.rect(o + 3, 42, 42, 6, C.grey2)
      c.rect(o + 5, 40, 38, 2, C.grey1)
      for (const x of [7, 16, 25, 34]) {
        c.rect(o + x, 22, 6, 18, C.grey1)
        c.vline(o + x + 5, 22, 39, C.grey2)
      }
      c.rect(o + 4, 18, 40, 4, C.grey1)
      for (let y = 0; y < 9; y++) c.hline(o + 24 - y * 2 - 2, o + 24 + y * 2 + 1, 9 + y, C.white)
      c.vline(o + 24, 0, 8, C.grey3)
      c.ascii(o + 25, f, f ? ['yyyyy', 'rrrrrr', 'yyyyy'] : ['yyyyyy', 'rrrrr', 'yyyyyy'])
    },
  ],
}

// ---------------------------------------------------------------------------
// 16×16 icons (tab bar + HUD)
// ---------------------------------------------------------------------------
const ICONS = {
  'tab-generators': [
    '................',
    '..........kk....',
    '.........kggk...',
    '..........kk....',
    '........kkk.....',
    '........kGk.....',
    '.kkk....kGk.....',
    '.kGk....kGk.....',
    'kkGkkkkkkGkkkkk.',
    'kGGGGkGGGGkGGGk.',
    'kGyyGkGyyGkGyyk.',
    'kGyyGkGyyGkGyyk.',
    'kGGGGGGGGGGGGGk.',
    'kGnnGGGnnGGGnnk.',
    'kGnnGGGnnGGGnnk.',
    'kkkkkkkkkkkkkkk.',
  ],
  'tab-upgrades': [
    '................',
    '.......kk.......',
    '......kyyk......',
    '.....kyYyyk.....',
    '....kyYyyyyk....',
    '...kyYyyyyyyk...',
    '..kkkkyyyykkkk..',
    '.....kyyyyk.....',
    '.....kyooyk.....',
    '.....kyooyk.....',
    '.....kyooyk.....',
    '.....kyooyk.....',
    '.....kooook.....',
    '.....kkkkkk.....',
    '................',
    '................',
  ],
  'tab-quests': [
    '................',
    '.....kkkkkk.....',
    '..kkkkggggkkkk..',
    '..kPPkkkkkkPPk..',
    '..kPwwwwwwwwPk..',
    '..kPwlwkkkkwPk..',
    '..kPwwwwwwwwPk..',
    '..kPwlwkkkkwPk..',
    '..kPwwwwwwwwPk..',
    '..kPwrwkkkwwPk..',
    '..kPwwwwwwwwPk..',
    '..kPwwwwwwwwPk..',
    '..kPPPPPPPPPPk..',
    '..kkkkkkkkkkkk..',
    '................',
    '................',
  ],
  'tab-lexicon': [
    '................',
    '................',
    '.kkkkkk..kkkkkk.',
    'kBBBBBBkkBBBBBBk',
    'kBwwwwwkkwwwwwBk',
    'kBwkkkwkkwkkkwBk',
    'kBwwwwwkkwwwwwBk',
    'kBwkkkwkkwkkkwBk',
    'kBwwwwwkkwwwwwBk',
    'kBwkkwwkkwkkwwBk',
    'kBwwwwwkkwwwwwBk',
    'kBBBBBBkkBBBBBBk',
    '.kkkkkkkkkkkkkk.',
    '.......yy.......',
    '.......yy.......',
    '................',
  ],
  'tab-settings': [
    '................',
    '.......kk.......',
    '...kk.kGGk.kk...',
    '..kGGkkGGkkGGk..',
    '..kGGGGGGGGGGk..',
    '...kGGGkkGGGk...',
    '.kkGGGkddkGGGkk.',
    'kGGGGkd..dkGGGGk',
    'kGGGGkd..dkGGGGk',
    '.kkGGGkddkGGGkk.',
    '...kGGGkkGGGk...',
    '..kGGGGGGGGGGk..',
    '..kGGkkGGkkGGk..',
    '...kk.kGGk.kk...',
    '.......kk.......',
    '................',
  ],
  'stat-spin': [
    '................',
    '...........kk...',
    '.........kkyk...',
    '.......kkyyyk...',
    '.kkkkkkyyyyyk.k.',
    '.kggkyyyyyyyk..k',
    '.kggkyYyyyyyk.k.',
    '.kggkyYyyyyyk...',
    '.kggkyyyyyyyk.kk',
    '.kkkkkkyyyyyk...',
    '...kr.kkyyyyk.k.',
    '...kr...kkyyk..k',
    '...kr.....kkk...',
    '...kk...........',
    '................',
    '................',
  ],
  'stat-approval': [
    '................',
    '............kkk.',
    '............klk.',
    '........kkk.klk.',
    '........kyk.klk.',
    '....kkk.kyk.klk.',
    '....kok.kyk.klk.',
    '....kok.kyk.klk.',
    'kkk.kok.kyk.klk.',
    'krk.kok.kyk.klk.',
    'krk.kok.kyk.klk.',
    'krk.kok.kyk.klk.',
    'kkkkkkkkkkkkkkk.',
    '................',
    '................',
    '................',
  ],
  'stat-prices': [
    '................',
    '......kkkkkkkk..',
    '.....kyyyyyyyyk.',
    '....kyyyyyyyyyk.',
    '...kyykkyyyyyyk.',
    '..kyyykkyyyyyyk.',
    '.kyyyyyyyyyyyyk.',
    'kyyyyyrryyyyyyk.',
    'kyyyyrrrryyyyk..',
    '.kyyyyrryyyyk...',
    '..kyyyyyyyyk....',
    '...kyyyyyyk.....',
    '....kyyyyk......',
    '.....kkkk.......',
    '................',
    '................',
  ],
  'stat-democracy': [
    '.......kk.......',
    '.....kkggkk.....',
    '...kkggggggkk...',
    '.kkggggggggggkk.',
    'kkkkkkkkkkkkkkkk',
    '.kgGk.kgGk.kgGk.',
    '.kgGk.kgGk.kgGk.',
    '.kgGk.kgGk.kgGk.',
    '.kgGk.kgGk.kgGk.',
    '.kgGk.kgGk.kgGk.',
    '.kgGk.kgGk.kgGk.',
    'kkkkkkkkkkkkkkkk',
    'kggggggggggggggk',
    'kkkkkkkkkkkkkkkk',
    '................',
    '................',
  ],
}

// ---------------------------------------------------------------------------
// Dialog portraits 48×48 (head & shoulders)
// ---------------------------------------------------------------------------
function bust({ bg, skin, suit, hair, extra }) {
  const c = new Canvas(48, 48)
  c.rect(0, 0, 48, 48, bg)
  for (let y = 0; y < 48; y += 4) c.hline(0, 47, y, bg === C.navy ? C.navyD : C.ink)
  c.ellipse(24, 50, 18, 12, suit)
  c.ellipse(24, 23, 10, 12, skin)
  c.ellipse(13, 24, 2, 3, skin)
  c.ellipse(35, 24, 2, 3, skin)
  c.rect(19, 22, 2, 2, C.ink)
  c.rect(28, 22, 2, 2, C.ink)
  if (hair) hair(c)
  if (extra) extra(c)
  return c
}
const PORTRAITS = {
  president: bust({
    bg: C.redD,
    skin: C.skinL,
    suit: C.navyD,
    extra: (c) => {
      c.hline(20, 28, 30, C.wood)
      c.hline(21, 27, 31, C.white)
      c.hline(18, 21, 19, C.woodD)
      c.hline(27, 30, 19, C.woodD)
      c.ascii(14, 4, [
        'y...y...y...y...y..',
        'yy.yyy.yyy.yyy.yy..',
        'yyyyyyyyyyyyyyyyy..',
        'yyryyyybyyyyryyyy..',
      ])
      for (let i = 0; i < 12; i++) c.rect(12 + i * 2, 38 + Math.floor(i * 0.8), 2, 2, C.gold)
    },
  }),
  konstantin: bust({
    bg: C.navy,
    skin: C.skin,
    suit: C.plum,
    hair: (c) => {
      c.rect(14, 10, 20, 5, C.gold)
      c.rect(14, 15, 3, 4, C.gold)
    },
    extra: (c) => {
      c.hline(21, 27, 30, C.wood)
      // lanyards and badges — minister for everything
      for (const [x, col] of [
        [16, C.red],
        [22, C.green],
        [28, C.blue],
        [33, C.gold],
      ]) {
        c.vline(x, 36, 42, col)
        c.rect(x - 1, 42, 4, 5, C.white)
        c.px(x, 44, col)
      }
    },
  }),
  frieda: bust({
    bg: C.green3,
    skin: C.skin,
    suit: C.greenD,
    hair: (c) => {
      c.rect(13, 9, 22, 6, C.wood)
      c.rect(12, 13, 4, 16, C.wood)
      c.rect(32, 13, 4, 16, C.wood)
    },
    extra: (c) => {
      // glasses + notepad + pencil
      c.rect(17, 21, 6, 4, C.ink)
      c.rect(26, 21, 6, 4, C.ink)
      c.rect(18, 22, 4, 2, C.cyan)
      c.rect(27, 22, 4, 2, C.cyan)
      c.hline(23, 25, 22, C.ink)
      c.hline(21, 26, 30, C.redD)
      c.rect(30, 34, 10, 12, C.white)
      for (let y = 36; y < 45; y += 2) c.hline(31, 38, y, C.grey2)
      c.vline(41, 30, 40, C.gold)
    },
  }),
  you: bust({
    bg: C.blueD,
    skin: C.skin,
    suit: C.navyD,
    hair: (c) => {
      c.rect(14, 9, 20, 6, C.woodD)
      c.rect(14, 15, 2, 3, C.woodD)
      c.rect(32, 15, 2, 3, C.woodD)
    },
    extra: (c) => {
      c.hline(21, 27, 30, C.wood)
      c.rect(20, 36, 8, 4, C.white)
      c.rect(23, 37, 2, 10, C.red)
    },
  }),
}

// ---------------------------------------------------------------------------
save('sprites/scene-background.png', background())
save('sprites/scene-portrait.png', portrait())
save('sprites/scene-podium.png', podium())
{
  const [c, json] = player()
  save('sprites/player.png', c, json)
}
for (const [name, [frames, draw]] of Object.entries(generators)) {
  const c = strip(frames, draw)
  const json =
    frames > 1
      ? asepriteJson(`${name}.png`, 48, 48, frames, { idle: [0, frames - 1, 500] })
      : undefined
  save(`sprites/${name}.png`, c, json)
}
for (const [id, canvas] of Object.entries(PORTRAITS)) save(`portraits/${id}.png`, canvas)
for (const [name, rows] of Object.entries(ICONS)) {
  const c = new Canvas(16, 16)
  c.ascii(0, 0, rows)
  save(`icons/${name}.png`, c)
}
generateMap()
generateRosengarten()
console.log(
  `Pixel placeholders: ${stats.written} written, ${stats.skipped} kept (existing files are never overwritten; use --force).`,
)
