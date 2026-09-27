/** Shared pixel-art helpers: Endesga 32 palette, tiny canvas, PNG encoder, safe file writer. */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

export const ROOT = fileURLToPath(new URL('../public/assets/', import.meta.url))
export const FORCE = process.argv.includes('--force')

// ---------------------------------------------------------------------------
// Endesga 32 — named for readability
// ---------------------------------------------------------------------------
export const C = {
  rust: 'be4a2f',
  clay: 'd77643',
  sand: 'ead4aa',
  skin: 'e4a672',
  woodL: 'b86f50',
  wood: '733e39',
  woodD: '3e2731',
  redD: 'a22633',
  red: 'e43b44',
  orange: 'f77622',
  gold: 'feae34',
  yellow: 'fee761',
  green: '63c74d',
  greenD: '3e8948',
  green3: '265c42',
  green4: '193c3e',
  blueD: '124e89',
  blue: '0099db',
  cyan: '2ce8f5',
  white: 'ffffff',
  grey1: 'c0cbdc',
  grey2: '8b9bb4',
  grey3: '5a6988',
  navy: '3a4466',
  navyD: '262b44',
  ink: '181425',
  hot: 'ff0044',
  plum: '68386c',
  magenta: 'b55088',
  pink: 'f6757a',
  skinL: 'e8b796',
  tan: 'c28569',
}
export const ASCII = {
  k: C.ink,
  y: C.gold,
  Y: C.yellow,
  o: C.orange,
  w: C.white,
  g: C.grey1,
  G: C.grey2,
  n: C.grey3,
  r: C.red,
  R: C.redD,
  b: C.blue,
  B: C.blueD,
  c: C.cyan,
  l: C.green,
  L: C.greenD,
  p: C.woodL,
  P: C.wood,
  s: C.sand,
  d: C.navy,
  D: C.navyD,
}

// ---------------------------------------------------------------------------
// Tiny canvas + PNG encoder (no dependencies)
// ---------------------------------------------------------------------------
export class Canvas {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.d = new Uint8Array(w * h * 4)
  }
  px(x, y, hex) {
    x = Math.round(x)
    y = Math.round(y)
    if (!hex || x < 0 || y < 0 || x >= this.w || y >= this.h) return
    const i = (y * this.w + x) * 4
    this.d[i] = Number.parseInt(hex.slice(0, 2), 16)
    this.d[i + 1] = Number.parseInt(hex.slice(2, 4), 16)
    this.d[i + 2] = Number.parseInt(hex.slice(4, 6), 16)
    this.d[i + 3] = 255
  }
  filled(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false
    return this.d[(y * this.w + x) * 4 + 3] > 0
  }
  rect(x, y, w, h, hex) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, hex)
  }
  hline(x0, x1, y, hex) {
    for (let x = x0; x <= x1; x++) this.px(x, y, hex)
  }
  vline(x, y0, y1, hex) {
    for (let y = y0; y <= y1; y++) this.px(x, y, hex)
  }
  ellipse(cx, cy, rx, ry, hex) {
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++)
        if ((x * x) / (rx * rx + 0.5) + (y * y) / (ry * ry + 0.5) <= 1) this.px(cx + x, cy + y, hex)
  }
  ascii(x, y, rows, map = ASCII) {
    rows.forEach((row, j) => {
      for (const [i, ch] of [...row].entries()) this.px(x + i, y + j, map[ch])
    })
  }
  /** 1px outline around everything drawn inside the given region (classic pixel-art look). */
  outline(hex, x0 = 0, y0 = 0, w = this.w, h = this.h) {
    const add = []
    for (let y = y0; y < y0 + h; y++)
      for (let x = x0; x < x0 + w; x++) {
        if (this.filled(x, y)) continue
        const n = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => {
          const nx = x + dx
          const ny = y + dy
          return nx >= x0 && ny >= y0 && nx < x0 + w && ny < y0 + h && this.filled(nx, ny)
        })
        if (n) add.push([x, y])
      }
    for (const [x, y] of add) this.px(x, y, hex)
  }
  png() {
    const raw = Buffer.alloc((this.w * 4 + 1) * this.h)
    for (let y = 0; y < this.h; y++) {
      raw[y * (this.w * 4 + 1)] = 0
      Buffer.from(this.d.buffer, y * this.w * 4, this.w * 4).copy(raw, y * (this.w * 4 + 1) + 1)
    }
    const chunk = (type, data) => {
      const len = Buffer.alloc(4)
      len.writeUInt32BE(data.length)
      const td = Buffer.concat([Buffer.from(type), data])
      const crc = Buffer.alloc(4)
      crc.writeUInt32BE(crc32(td))
      return Buffer.concat([len, td, crc])
    }
    const ihdr = Buffer.alloc(13)
    ihdr.writeUInt32BE(this.w, 0)
    ihdr.writeUInt32BE(this.h, 4)
    ihdr.set([8, 6, 0, 0, 0], 8)
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ])
  }
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** Seeded RNG so placeholders are identical on every run. */
export function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export const stats = { written: 0, skipped: 0 }
export function save(path, canvas, json) {
  const file = join(ROOT, path)
  if (existsSync(file) && !FORCE) {
    stats.skipped++
    return
  }
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, canvas.png())
  if (json) writeFileSync(file.replace(/\.png$/, '.json'), `${JSON.stringify(json, null, 2)}\n`)
  stats.written++
}

/** Aseprite "Array" JSON for a horizontal strip. tags: { name: [from, to, msPerFrame] } */
export function asepriteJson(image, fw, fh, count, tags) {
  const durations = Array(count).fill(100)
  for (const [, [from, to, ms]] of Object.entries(tags))
    for (let i = from; i <= to; i++) durations[i] = ms
  return {
    frames: durations.map((duration, i) => ({
      filename: `${image} ${i}`,
      frame: { x: i * fw, y: 0, w: fw, h: fh },
      duration,
    })),
    meta: {
      app: 'spin-doctor pixel-placeholders',
      image,
      size: { w: fw * count, h: fh },
      frameTags: Object.entries(tags).map(([name, [from, to]]) => ({
        name,
        from,
        to,
        direction: 'forward',
      })),
    },
  }
}

/** Writes a text file (e.g. a Tiled map) unless it exists (or --force). */
export function saveText(path, text) {
  const file = join(ROOT, path)
  if (existsSync(file) && !FORCE) {
    stats.skipped++
    return
  }
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
  stats.written++
}
