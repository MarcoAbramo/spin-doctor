/**
 * Screen transitions in pixel style: an ordered-dither (Bayer 4×4) wipe, a title
 * banner, camera flashes and a coin stream into the HUD. Every step can be
 * skipped by tapping; with reduced motion the wipe becomes a quick cut.
 */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]
const CELL = 8
const INK = '#181425'

let canvas: HTMLCanvasElement | null = null
let skipping = false
let reduced = false

export function setTransitionReducedMotion(on: boolean): void {
  reduced = on
}

function overlay(): HTMLCanvasElement {
  if (canvas) return canvas
  canvas = document.createElement('canvas')
  canvas.className = 'transition-overlay'
  canvas.addEventListener('pointerdown', () => {
    skipping = true
  })
  document.querySelector('.app')?.appendChild(canvas)
  return canvas
}

function drawDither(ctx: CanvasRenderingContext2D, w: number, h: number, p: number): void {
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = INK
  const level = p * 16
  for (let y = 0; y < h; y += CELL)
    for (let x = 0; x < w; x += CELL) {
      const threshold = BAYER[((y / CELL) % 4) * 4 + ((x / CELL) % 4)]!
      if (threshold < level) ctx.fillRect(x, y, CELL, CELL)
    }
}

function animate(ms: number, frame: (p: number) => void): Promise<void> {
  if (reduced || skipping) {
    frame(1)
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const start = performance.now()
    const step = (now: number) => {
      const p = skipping ? 1 : Math.min(1, (now - start) / ms)
      // Quantised progress keeps the pixel look.
      frame(Math.round(p * 8) / 8)
      if (p < 1) requestAnimationFrame(step)
      else resolve()
    }
    requestAnimationFrame(step)
  })
}

/** Covers the screen with the dither pattern. */
export function cover(ms = 320): Promise<void> {
  skipping = false
  const c = overlay()
  const rect = c.parentElement?.getBoundingClientRect()
  c.width = Math.ceil(rect?.width ?? window.innerWidth)
  c.height = Math.ceil(rect?.height ?? window.innerHeight)
  c.style.display = 'block'
  const ctx = c.getContext('2d')!
  return animate(ms, (p) => drawDither(ctx, c.width, c.height, p))
}

/** Reveals the new scene by dithering the cover away. */
export function reveal(ms = 320): Promise<void> {
  const c = overlay()
  const ctx = c.getContext('2d')!
  return animate(ms, (p) => drawDither(ctx, c.width, c.height, 1 - p)).then(() => {
    c.style.display = 'none'
    skipping = false
  })
}

/** Location title banner sliding in and out (non-blocking). */
export function banner(title: string, emoji = ''): void {
  const el = document.createElement('div')
  el.className = 'transition-banner'
  el.innerHTML = `<span class="transition-banner-emoji">${emoji}</span><span>${title}</span>`
  document.querySelector('.app')?.appendChild(el)
  setTimeout(() => el.classList.add('transition-banner-out'), reduced ? 900 : 1500)
  setTimeout(() => el.remove(), reduced ? 1200 : 1900)
}

/** Camera flashes (press house entry). */
export function flashes(count = 3): Promise<void> {
  if (reduced) return Promise.resolve()
  const scene = document.querySelector('.scene')
  if (!scene) return Promise.resolve()
  return new Promise((resolve) => {
    let n = 0
    const flash = () => {
      const el = document.createElement('div')
      el.className = 'camera-flash'
      el.style.left = `${15 + Math.random() * 70}%`
      el.style.top = `${40 + Math.random() * 40}%`
      scene.appendChild(el)
      setTimeout(() => el.remove(), 180)
      n++
      if (n < count) setTimeout(flash, 140 + Math.random() * 120)
      else setTimeout(resolve, 200)
    }
    flash()
  })
}

/** Coins fly from the scene into the HUD counter. */
export function coinStream(count = 12): Promise<void> {
  const scene = document.querySelector('.scene')?.getBoundingClientRect()
  const hud = document.querySelector('.hud-spin strong')?.getBoundingClientRect()
  const app = document.querySelector('.app')
  if (!scene || !hud || !app || reduced) return Promise.resolve()
  const appRect = app.getBoundingClientRect()
  return new Promise((resolve) => {
    for (let i = 0; i < count; i++) {
      const coin = document.createElement('div')
      coin.className = 'fly-coin'
      const sx = scene.left + scene.width / 2 + (Math.random() - 0.5) * 80 - appRect.left
      const sy = scene.top + scene.height * 0.7 - appRect.top
      coin.style.transform = `translate(${sx}px, ${sy}px)`
      app.appendChild(coin)
      setTimeout(
        () => {
          coin.style.transform = `translate(${hud.left + hud.width / 2 - appRect.left}px, ${hud.top + hud.height / 2 - appRect.top}px) scale(0.6)`
        },
        30 + i * 45,
      )
      setTimeout(() => coin.remove(), 700 + i * 45)
    }
    setTimeout(resolve, 700 + count * 45)
  })
}

/** Big pixel stamp in the middle of the screen (spin quality, records). */
export function stamp(text: string, sub = '', tone: 'good' | 'meh' | 'bad' = 'good'): void {
  const el = document.createElement('div')
  el.className = `stamp stamp-${tone}`
  el.innerHTML = `<span class="stamp-text">${text}</span>${sub ? `<span class="stamp-sub">${sub}</span>` : ''}`
  document.querySelector('.app')?.appendChild(el)
  setTimeout(() => el.classList.add('stamp-out'), reduced ? 1200 : 1800)
  setTimeout(() => el.remove(), reduced ? 1500 : 2200)
}

/** Wind gust: papers fly across the scene (Rosengarten entry). */
export function paperGust(count = 9): Promise<void> {
  const scene = document.querySelector('.scene')
  if (!scene || reduced) return Promise.resolve()
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    p.className = 'gust-paper'
    p.style.top = `${10 + Math.random() * 70}%`
    p.style.animationDelay = `${i * 70}ms`
    p.style.animationDuration = `${700 + Math.random() * 400}ms`
    scene.appendChild(p)
    setTimeout(() => p.remove(), 1400 + i * 70)
  }
  return new Promise((resolve) => setTimeout(resolve, 900))
}
