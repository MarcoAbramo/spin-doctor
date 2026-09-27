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
import { generatePressRoom } from './press-room-placeholders.mjs'
import { generatePrice } from './price-placeholders.mjs'
import { generateRosengarten } from './rosengarten-placeholders.mjs'

// Press room (background, plaque, podium, reporters): see press-room-placeholders.mjs

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
  'stat-loyalists': [
    '................',
    '.....kkkkkk.....',
    '....kyyyyyyk....',
    '...kyyrrrryyk...',
    '...kyrrrrrryk...',
    '...kyyrrrryyk...',
    '....kyyyyyyk....',
    '.....kkkkkk.....',
    '.....kBBBBk.....',
    '....kBBBBBBk....',
    '...kBBBwwBBBk...',
    '...kBBBwwBBBk...',
    '...kBBBBBBBBk...',
    '...kBBBBBBBBk...',
    '...kkkkkkkkkk...',
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
generatePressRoom()
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
generatePrice()
console.log(
  `Pixel placeholders: ${stats.written} written, ${stats.skipped} kept (existing files are never overwritten; use --force).`,
)
