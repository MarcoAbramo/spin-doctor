/** Pixel placeholders for level 2: „Rosengarten der Strafzölle“ (Endesga 32). */
import { asepriteJson, C, Canvas, rng, save } from './pixel-lib.mjs'

/** 3×5 pixel glyphs for tiny marker scribbles. */
const GLYPHS = {
  '+': ['...', '.x.', 'xxx', '.x.', '...'],
  4: ['x.x', 'x.x', 'xxx', '..x', '..x'],
  0: ['xxx', 'x.x', 'x.x', 'x.x', 'xxx'],
  '%': ['x.x', '..x', '.x.', 'x..', 'x.x'],
  Z: ['xxx', '..x', '.x.', 'x..', 'xxx'],
  O: ['xxx', 'x.x', 'x.x', 'x.x', 'xxx'],
  L: ['x..', 'x..', 'x..', 'x..', 'xxx'],
  E: ['xxx', 'x..', 'xx.', 'x..', 'xxx'],
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
  const r = rng(21)
  // sky bands
  const sky = [C.cyan, C.blue, C.blue, C.blueD]
  for (let y = 0; y < 200; y++) c.hline(0, 479, y, sky[Math.min(3, Math.floor(y / 30))] ?? C.blue)
  c.rect(0, 0, 480, 60, C.cyan)
  for (const [x, y] of [
    [60, 30],
    [300, 20],
    [420, 50],
  ]) {
    c.ellipse(x, y, 26, 8, C.white)
    c.ellipse(x + 16, y - 6, 14, 8, C.white)
  }
  // white facade
  c.rect(20, 70, 440, 170, C.white)
  c.rect(10, 60, 460, 12, C.grey1)
  c.hline(10, 469, 60, C.grey2)
  for (let x = 40; x < 450; x += 44) {
    c.rect(x, 90, 18, 26, C.blueD)
    c.rect(x + 2, 92, 14, 10, C.blue)
    c.rect(x, 140, 18, 30, C.blueD)
    c.rect(x + 2, 142, 14, 12, C.blue)
    c.rect(x - 4, 180, 6, 60, C.grey1)
  }
  c.rect(220, 176, 40, 64, C.wood) // door
  c.vline(240, 176, 239, C.woodD)
  // colonnade shadow & hedge
  c.rect(0, 232, 480, 30, C.green3)
  for (let x = 0; x < 480; x += 6) c.rect(x, 230 + (x % 12 ? 0 : 2), 6, 4, C.greenD)
  // roses along the hedge
  for (let x = 6; x < 480; x += 14) {
    c.rect(x, 236 + Math.floor(r() * 16), 3, 3, C.red)
    c.px(x + 1, 236 + Math.floor(r() * 16), C.pink)
  }
  // lawn with mowing stripes
  for (let y = 262; y < 400; y++) c.hline(0, 479, y, Math.floor(y / 10) % 2 ? C.green : C.greenD)
  // sand path to the podium
  for (let y = 262; y < 400; y++) {
    const half = 18 + Math.floor((y - 262) * 0.25)
    c.hline(220 - half, 220 + half, y, C.sand)
  }
  // rose beds in the lawn
  for (const bx of [110, 330, 60, 410]) {
    const by = bx === 60 || bx === 410 ? 330 : 290
    c.ellipse(bx, by, 22, 8, C.green3)
    for (let k = 0; k < 9; k++)
      c.rect(bx - 18 + k * 4, by - 4 + ((k * 3) % 7), 3, 3, k % 3 ? C.red : C.pink)
  }
  return c
}

function podium() {
  const c = new Canvas(80, 64)
  const mics = [C.ink, C.red, C.blue, C.grey3, C.green]
  mics.forEach((col, i) => {
    const x = 20 + i * 10
    c.vline(x, 6 + (i % 2) * 3, 17, C.grey2)
    c.rect(x - 2, 1 + (i % 2) * 3, 5, 6, col)
  })
  c.rect(4, 16, 72, 6, C.woodL)
  c.hline(4, 75, 16, C.skin)
  for (let y = 22; y < 60; y++) {
    const inset = 8 + Math.floor((y - 22) / 8)
    c.hline(inset, 79 - inset, y, C.wood)
    c.px(inset, y, C.woodL)
    c.px(79 - inset, y, C.woodD)
  }
  c.rect(4, 59, 72, 5, C.woodD)
  // flapping papers
  c.rect(10, 12, 12, 8, C.white)
  c.hline(12, 20, 15, C.grey2)
  c.rect(56, 10, 14, 7, C.white)
  c.hline(58, 67, 13, C.grey2)
  // seal
  c.ellipse(40, 40, 9, 9, C.gold)
  c.ellipse(40, 40, 6, 6, C.red)
  c.outline(C.ink)
  return c
}

function easel() {
  const c = new Canvas(72, 96)
  // legs
  for (let y = 40; y < 96; y++) {
    c.px(14 + Math.floor((y - 40) / 6), y, C.wood)
    c.px(57 - Math.floor((y - 40) / 6), y, C.wood)
  }
  c.vline(36, 50, 95, C.woodD)
  // board with world map
  c.rect(2, 4, 68, 48, C.sand)
  c.rect(4, 6, 64, 44, C.blue)
  c.ellipse(18, 20, 10, 7, C.green)
  c.ellipse(44, 16, 12, 6, C.green)
  c.ellipse(54, 36, 9, 7, C.green)
  c.ellipse(22, 40, 8, 5, C.green)
  // marker strokes
  for (let k = 0; k < 12; k++) {
    c.px(10 + k, 14 + k, C.ink)
    c.px(22 - k, 14 + k, C.ink)
    c.px(38 + k, 10 + (k >> 1), C.ink)
  }
  write(c, 8, 30, '+400%', C.red)
  write(c, 38, 40, 'ZOLL', C.ink)
  c.rect(0, 50, 72, 4, C.woodL)
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
  'gen-easel-setter': (c, o, f) => {
    c.rect(o + 18, 36, 4, 12, C.navy)
    c.rect(o + 24, 36, 4, 12, C.navy)
    c.rect(o + 16, 22, 14, 15, C.orange)
    c.ellipse(o + 23, 15 + f, 6, 6, C.skin)
    c.rect(o + 17, 8 + f, 12, 3, C.woodD)
    // easel carried on the shoulder
    c.rect(o + 28, 6 + f, 16, 12, C.sand)
    c.rect(o + 30, 8 + f, 12, 8, C.blue)
    c.vline(o + 34, 18 + f, 40, C.wood)
    c.vline(o + 40, 18 + f, 40, C.wood)
  },
  'gen-marker-pack': (c, o, f) => {
    c.rect(o + 8, 22, 32, 24, C.red)
    c.rect(o + 8, 20, 32, 4, C.redD)
    for (let k = 0; k < 6; k++) {
      c.rect(o + 11 + k * 5, 8 + ((k + f) % 2) * 2, 3, 14, C.ink)
      c.rect(o + 11 + k * 5, 6 + ((k + f) % 2) * 2, 3, 3, C.grey1)
    }
    c.rect(o + 12, 30, 24, 8, C.white)
    c.hline(o + 14, o + 33, 34, C.ink)
    if (f) c.px(o + 40, 12, C.yellow)
  },
  'gen-wind-machine': (c, o, f) => {
    c.rect(o + 20, 30, 8, 16, C.grey3)
    c.rect(o + 12, 44, 24, 4, C.grey3)
    c.ellipse(o + 24, 20, 14, 14, C.grey1)
    c.ellipse(o + 24, 20, 12, 12, C.grey2)
    const blades = f
      ? [
          [0, -1],
          [1, 0],
          [0, 1],
          [-1, 0],
        ]
      : [
          [1, -1],
          [1, 1],
          [-1, 1],
          [-1, -1],
        ]
    for (const [dx, dy] of blades)
      for (let k = 2; k < 11; k++) c.rect(o + 24 + dx * k - 1, 20 + dy * k - 1, 3, 3, C.white)
    c.rect(o + 22, 18, 4, 4, C.red)
    // papers in the draught
    c.rect(o + 40, 10 + f * 3, 6, 5, C.white)
  },
  'gen-tariff-press': (c, o, f) => {
    c.rect(o + 6, 18, 36, 26, C.grey3)
    c.rect(o + 4, 42, 40, 6, C.navyD)
    c.ellipse(o + 16, 28, 6, 6, C.grey1)
    c.ellipse(o + 32, 28, 6, 6, C.grey1)
    c.rect(o + 12, 6 - f * 2, 24, 14, C.white)
    write(c, o + 14, 9 - f * 2, '+400', C.red)
    c.rect(o + 36, 14, 8, 3, C.red)
  },
}

function reflectingPool() {
  // 4 construction stages: water → drained → gilding → golden mirror with statue
  const W = 96
  const H = 48
  const c = new Canvas(W * 4, H)
  for (let f = 0; f < 4; f++) {
    const o = f * W
    c.rect(o, 0, W, H, C.grey1) // stone rim
    c.rect(o + 3, 3, W - 6, H - 6, C.grey2)
    const inner = [o + 5, 5, W - 10, H - 10]
    if (f === 0) {
      c.rect(...inner, C.blue)
      for (let k = 0; k < 5; k++)
        c.hline(o + 12 + k * 15, o + 18 + k * 15, 12 + (k % 3) * 9, C.cyan)
    } else if (f === 1) {
      c.rect(...inner, C.woodD)
      for (let k = 0; k < 20; k++) c.px(o + 8 + ((k * 37) % 80), 8 + ((k * 13) % 30), C.wood)
      // scaffolding & crane
      for (let x = o + 10; x < o + 40; x += 6) c.vline(x, 8, 40, C.orange)
      c.hline(o + 10, o + 40, 12, C.orange)
      c.hline(o + 10, o + 40, 26, C.orange)
      c.vline(o + 80, 4, 42, C.yellow)
      c.hline(o + 60, o + 88, 6, C.yellow)
      c.vline(o + 64, 6, 20, C.grey3)
    } else if (f === 2) {
      c.rect(...inner, C.woodD)
      c.rect(o + 5, 5, 46, H - 10, C.gold)
      for (let y = 8; y < 40; y += 6) c.hline(o + 6, o + 50, y, C.orange)
      c.rect(o + 52, 18, 5, 10, C.navy) // worker
      c.ellipse(o + 54, 15, 3, 3, C.skin)
    } else {
      c.rect(...inner, C.gold)
      for (let k = 0; k < 6; k++)
        c.hline(o + 10 + k * 13, o + 16 + k * 13, 10 + (k % 3) * 10, C.yellow)
      // statue reflection (upside-down silhouette with crown)
      c.rect(o + 44, 10, 8, 16, C.orange)
      c.ellipse(o + 48, 30, 5, 5, C.orange)
      c.ascii(o + 43, 35, ['y.y.y.y', 'yyyyyyy'], { y: C.yellow })
      c.px(o + 20, 20, C.white)
      c.px(o + 76, 30, C.white)
    }
    c.outline(C.ink, o, 0, W, H)
  }
  const json = asepriteJson('map-reflecting-pool.png', W, H, 4, { idle: [0, 0, 1000] })
  return [c, json]
}

function portraitWolke() {
  const c = new Canvas(48, 48)
  c.rect(0, 0, 48, 48, C.blueD)
  for (let y = 0; y < 48; y += 4) c.hline(0, 47, y, C.navy)
  c.ellipse(24, 50, 18, 12, C.cyan)
  c.ellipse(24, 24, 10, 12, C.skinL)
  // cloud-shaped hair
  for (const [x, y, rx] of [
    [16, 11, 6],
    [24, 8, 7],
    [32, 11, 6],
    [13, 17, 4],
    [35, 17, 4],
  ])
    c.ellipse(x, y, rx, 4, C.white)
  c.rect(19, 23, 2, 2, C.ink)
  c.rect(28, 23, 2, 2, C.ink)
  c.hline(21, 27, 30, C.wood)
  // pointer stick & tiny storm symbol
  c.vline(40, 22, 44, C.woodL)
  c.ascii(35, 16, ['.ww.', 'wwww', '.y..', 'y...'], { w: C.grey1, y: C.yellow })
  c.outline(C.ink)
  return c
}

export function generateRosengarten() {
  save('sprites/scene-rosengarten.png', background())
  save('sprites/rosengarten-podium.png', podium())
  save('sprites/rosengarten-easel.png', easel())
  for (const [name, draw] of Object.entries(GENERATORS)) {
    save(
      `sprites/${name}.png`,
      strip(2, draw),
      asepriteJson(`${name}.png`, 48, 48, 2, { idle: [0, 1, 400] }),
    )
  }
  const [pool, poolJson] = reflectingPool()
  save('sprites/map-reflecting-pool.png', pool, poolJson)
  save('portraits/dr-wolke.png', portraitWolke())
}
