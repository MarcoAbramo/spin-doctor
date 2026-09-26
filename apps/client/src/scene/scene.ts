import type { GameState } from '@spin-doctor/shared'
import { Easing, Group, Tween } from '@tweenjs/tween.js'
import { Application, Container, Graphics, Text, TextureSource } from 'pixi.js'
import { content } from '../content'
import { drawPlaceholder } from './placeholders'
import { type Art, loadArt } from './sprites'

/**
 * Pixel-art press room. Everything is authored at 320×400 "art pixels" and
 * scaled up with nearest-neighbour filtering — snapped to whole device pixels
 * where possible so every art pixel has the same size.
 */
export const ART_W = 320
export const ART_H = 400
/** Background is wider than the play area so wide screens show more room, not bars. */
const BG_W = 480
const FLOOR_Y = 290
/** The top of the room (ceiling) may be cropped on short screens; this much must stay visible. */
const VIEW_H = 350

// Endesga 32 colours used by code-drawn effects.
const PAL = {
  ink: 0x181425,
  gold: 0xfeae34,
  yellow: 0xfee761,
  red: 0xe43b44,
  green: 0x63c74d,
  blue: 0x0099db,
  cyan: 0x2ce8f5,
  white: 0xffffff,
  wall: 0x124e89,
  floor: 0x733e39,
}

export interface Scene {
  tap(clientX: number, clientY: number, label: string): void
  update(state: GameState): void
  shake(): void
  confetti(): void
  setPaused(paused: boolean): void
  setReducedMotion(on: boolean): void
}

/** Where generator props stand (art pixels, bottom-centre). Up to 3 copies each. */
const SLOTS: Record<string, Array<[number, number]>> = {
  intern: [
    [44, 384],
    [76, 396],
    [108, 388],
  ],
  'talkshow-guest': [
    [276, 318],
    [300, 332],
  ],
  'bot-farm': [
    [36, 300],
    [62, 300],
  ],
  'court-paper': [
    [240, 392],
    [272, 398],
  ],
  'jubel-tv': [[60, 150]],
  'truth-ministry': [[262, 170]],
}

export async function createScene(host: HTMLElement): Promise<Scene> {
  TextureSource.defaultOptions.scaleMode = 'nearest'
  const app = new Application()
  await app.init({
    resizeTo: host,
    background: PAL.wall,
    antialias: false,
    roundPixels: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    preference: 'webgl',
  })
  app.canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(app.canvas)

  const tweens = new Group()
  let reducedMotion = false

  const backdrop = new Graphics()
  const root = new Container()
  const fx = new Container()
  app.stage.addChild(backdrop, root, fx)

  const bg = await loadArt('scene-background', () =>
    drawPlaceholder('scene-background', BG_W, ART_H),
  )
  bg.view.position.set(ART_W / 2, ART_H)
  root.addChild(bg.view)

  const portrait = await loadArt('scene-portrait', () => drawPlaceholder('scene-portrait', 64, 80))
  portrait.view.position.set(ART_W / 2, 150)
  root.addChild(portrait.view)

  // Generator props between wall and podium.
  const propsByGenerator = new Map<string, Art[]>()
  const props = new Container()
  root.addChild(props)
  for (const g of content.generators) {
    const name = g.sprite ?? `gen-${g.id}`
    const slots = SLOTS[g.id] ?? [[ART_W / 2, FLOOR_Y + 40]]
    const list: Art[] = []
    for (const [x, y] of slots) {
      const art = await loadArt(name, () => drawPlaceholder(name))
      art.view.position.set(x, y)
      art.view.visible = false
      props.addChild(art.view)
      list.push(art)
    }
    propsByGenerator.set(g.id, list)
  }
  // Props further back (smaller y) are drawn first.
  props.children.sort((a, b) => a.y - b.y)

  // The player stands behind the podium.
  const player = await loadArt('player', () => drawPlaceholder('player', 24, 56))
  const PLAYER_Y = 372
  player.view.position.set(ART_W / 2, PLAYER_Y)
  root.addChild(player.view)

  const podium = await loadArt('scene-podium', () => drawPlaceholder('scene-podium', 80, 64))
  podium.view.position.set(ART_W / 2, ART_H)
  root.addChild(podium.view)

  // --- Layout: fit the lower 320×350, anchor at the bottom, snap to device pixels ---
  let scale = 1
  function layout(): void {
    const { width, height } = app.screen
    const res = app.renderer.resolution
    const fit = Math.min(width / ART_W, height / VIEW_H)
    // Whole device pixels per art pixel when that doesn't shrink the room by much.
    const snapped = Math.floor(fit * res) / res
    scale = snapped >= 1 / res && snapped / fit > 0.8 ? snapped : fit
    root.scale.set(scale)
    root.position.set(Math.round((width - ART_W * scale) / 2), Math.round(height - ART_H * scale))
    const floorY = root.position.y + FLOOR_Y * scale
    backdrop
      .clear()
      .rect(0, 0, width, floorY)
      .fill(PAL.wall)
      .rect(0, floorY, width, height - floorY)
      .fill(PAL.floor)
  }
  layout()
  app.renderer.on('resize', layout)

  // --- Effects -------------------------------------------------------------
  let shakeTime = 0
  const floaters: Array<{
    node: Container
    vx: number
    vy: number
    life: number
    gravity: number
  }> = []

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000
    tweens.update()
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i]!
      f.life -= dt
      f.node.x += f.vx * dt
      f.node.y += f.vy * dt
      f.vy += f.gravity * dt
      // Pixel-art friendly fade: blink out instead of alpha ramps.
      f.node.visible = f.life > 0.25 || Math.floor(f.life * 20) % 2 === 0
      if (f.life <= 0) {
        f.node.destroy()
        floaters.splice(i, 1)
      }
    }
    if (shakeTime > 0) {
      shakeTime -= dt
      const k = Math.round(Math.max(0, shakeTime) * 10)
      root.pivot.set(Math.round((Math.random() - 0.5) * k), Math.round((Math.random() - 0.5) * k))
      if (shakeTime <= 0) root.pivot.set(0, 0)
    }
  })

  function toLocal(clientX: number, clientY: number): { x: number; y: number } {
    const rect = app.canvas.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function pixel(color: number, size: number): Graphics {
    return new Graphics().rect(-size / 2, -size / 2, size, size).fill(color)
  }

  return {
    tap(clientX, clientY, label) {
      const { x, y } = toLocal(clientX, clientY)
      const text = new Text({
        text: label,
        style: {
          fontFamily: '"Pixelify Sans", monospace',
          fontSize: Math.max(14, Math.round(9 * scale)),
          fontWeight: '700',
          fill: PAL.yellow,
          stroke: { color: PAL.ink, width: Math.max(3, Math.round(scale * 1.5)) },
        },
      })
      text.anchor.set(0.5)
      text.position.set(Math.round(x), Math.round(y - 10 * scale))
      text.roundPixels = true
      fx.addChild(text)
      floaters.push({ node: text, vx: 0, vy: -28 * scale, life: 0.8, gravity: 0 })

      // The press secretary talks and gestures on every statement.
      player.play('talk', true)
      if (!reducedMotion) {
        for (let i = 0; i < 6; i++) {
          const p = pixel(
            [PAL.gold, PAL.yellow, PAL.white][i % 3]!,
            Math.max(2, Math.round(scale * 2)),
          )
          p.position.set(x, y)
          fx.addChild(p)
          const a = (Math.PI * 2 * i) / 6 + Math.random() * 0.5
          floaters.push({
            node: p,
            vx: Math.cos(a) * 60 * scale,
            vy: Math.sin(a) * 60 * scale - 30 * scale,
            life: 0.45,
            gravity: 200 * scale,
          })
        }
        // A tiny hop — whole art pixels only.
        new Tween({ h: 3 }, tweens)
          .to({ h: 0 }, 220)
          .easing(Easing.Quadratic.Out)
          .onUpdate(({ h }) => {
            player.view.y = PLAYER_Y - Math.round(h)
          })
          .start()
      }
    },
    update(state) {
      for (const [id, list] of propsByGenerator) {
        const count = state.generators[id] ?? 0
        const visible = count === 0 ? 0 : count < 10 ? 1 : count < 25 ? 2 : 3
        list.forEach((art, i) => {
          const show = i < visible
          if (show && !art.view.visible && !reducedMotion) {
            const baseY = art.view.y
            new Tween({ h: 12 }, tweens)
              .to({ h: 0 }, 400)
              .easing(Easing.Bounce.Out)
              .onUpdate(({ h }) => {
                art.view.y = baseY - Math.round(h)
              })
              .start()
          }
          art.view.visible = show
        })
      }
    },
    shake() {
      if (!reducedMotion) shakeTime = 0.4
    },
    confetti() {
      if (reducedMotion) return
      const colors = [PAL.gold, PAL.red, PAL.green, PAL.blue, PAL.cyan, PAL.white]
      const size = Math.max(2, Math.round(scale * 2))
      for (let i = 0; i < 60; i++) {
        const piece = pixel(colors[i % colors.length]!, size)
        piece.position.set(Math.random() * app.screen.width, -size)
        fx.addChild(piece)
        floaters.push({
          node: piece,
          vx: (Math.random() - 0.5) * 30 * scale,
          vy: (20 + Math.random() * 40) * scale,
          life: 2.5,
          gravity: 10 * scale,
        })
      }
    },
    setPaused(paused) {
      if (paused) app.ticker.stop()
      else app.ticker.start()
    },
    setReducedMotion(on) {
      reducedMotion = on
    },
  }
}
