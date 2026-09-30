import {
  crowdPositions,
  crowdSize,
  type GameState,
  generatorsAt,
  getLocation,
} from '@spin-doctor/shared'
import { Easing, Group, Tween } from '@tweenjs/tween.js'
import { Application, Container, Graphics, Text, TextureSource } from 'pixi.js'
import { content } from '../content'
import { drawPlaceholder } from './placeholders'
import { type Art, loadArt } from './sprites'

/**
 * Pixel-art location scene. Everything is authored in "art pixels" (a 320 px wide play
 * area, `scene.height` tall — 400 by default) and scaled up with nearest-neighbour
 * filtering, snapped to whole device pixels where possible so every art pixel has the
 * same size.
 */
export const ART_W = 320
/** Background is wider than the play area so wide screens show more room, not bars. */
const BG_W = 480

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
}

export interface Scene {
  tap(clientX: number, clientY: number, label: string): void
  update(state: GameState): void
  shake(): void
  confetti(): void
  setPaused(paused: boolean): void
  setReducedMotion(on: boolean): void
  /** Height (CSS px) covered by the open menu drawer at the bottom. */
  setInset(px: number): void
  /** Entry performance: the player walks in from the side to their spot. */
  playEnter(): Promise<void>
  destroy(): void
}

/** Builds the idle scene of one location from its content definition (`location.scene`). */
export async function createScene(host: HTMLElement, locationId: string): Promise<Scene> {
  const location = getLocation(content, locationId)
  const def = location.scene
  const wall = Number.parseInt(def.backdrop.top.slice(1), 16)
  const floor = Number.parseInt(def.backdrop.bottom.slice(1), 16)
  TextureSource.defaultOptions.scaleMode = 'nearest'
  const app = new Application()
  await app.init({
    resizeTo: host,
    background: wall,
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

  const artH = def.height
  const bg = await loadArt(def.background, () => drawPlaceholder(def.background, BG_W, artH))
  bg.view.position.set(ART_W / 2, artH)
  root.addChild(bg.view)

  // Everything that stands in the room is depth-sorted by its foot point (y).
  const room = new Container()
  room.sortableChildren = true
  root.addChild(room)
  const place = (art: Art, x: number, y: number, bias = 0) => {
    art.view.position.set(x, y)
    art.view.zIndex = y * 10 + bias
    room.addChild(art.view)
  }

  const reactors: Array<{ art: Art; tag: string }> = []
  for (const prop of def.props) {
    const art = await loadArt(prop.sprite, () => drawPlaceholder(prop.sprite, 48, 48))
    place(art, prop.x, prop.y)
    if (prop.react && art.has(prop.react)) reactors.push({ art, tag: prop.react })
  }

  // Generator copies: the room fills up as the collection grows.
  const propsByGenerator = new Map<string, Art[]>()
  const exponents = new Map<string, number | undefined>()
  for (const g of generatorsAt(content, location.id)) {
    const name = g.sprite ?? `gen-${g.id}`
    const authored =
      def.slots[g.id] ?? (def.crowds[g.id] ? [] : [[ART_W / 2, def.backdrop.splitY + 40]])
    const spots = crowdPositions(g.id, authored as Array<[number, number]>, def.crowds[g.id])
    const list: Art[] = []
    for (const [x, y] of spots) {
      const art = await loadArt(name, () => drawPlaceholder(name))
      art.view.visible = false
      place(art, x, y)
      list.push(art)
    }
    propsByGenerator.set(g.id, list)
    exponents.set(g.id, def.crowds[g.id]?.exponent)
  }

  // The player stands behind the podium.
  const player = await loadArt('player', () => drawPlaceholder('player', 24, 56))
  const PLAYER_Y = def.player.y
  place(player, def.player.x, PLAYER_Y, 1)

  const target = def.tapTarget
  const podium = await loadArt(target.sprite, () => drawPlaceholder(target.sprite, 80, 64))
  place(podium, target.x, target.y, 2)

  // --- Layout: `viewH` art pixels above `coverY` fit above the open menu drawer ---
  let scale = 1
  let inset = 0
  function layout(): void {
    const { width, height } = app.screen
    const res = app.renderer.resolution
    const visible = Math.max(height / 3, height - inset)
    const fit = Math.min(width / ART_W, visible / def.viewH)
    // Whole device pixels per art pixel when that doesn't shrink the room by much.
    const snapped = Math.floor(fit * res) / res
    scale = snapped >= 1 / res && snapped / fit > 0.8 ? snapped : fit
    root.scale.set(scale)
    root.position.set(
      Math.round((width - ART_W * scale) / 2),
      Math.round(visible - def.coverY * scale),
    )
    const floorY = root.position.y + def.backdrop.splitY * scale
    backdrop
      .clear()
      .rect(0, 0, width, floorY)
      .fill(wall)
      .rect(0, floorY, width, height - floorY)
      .fill(floor)
  }
  layout()
  app.renderer.on('resize', layout)
  const observer = new ResizeObserver(() => {
    app.resize()
    layout()
  })
  observer.observe(host)

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

      // The press secretary talks and gestures on every statement; the press reacts.
      player.play('talk', true)
      const reactor = reactors[Math.floor(Math.random() * reactors.length)]
      if (reactor && Math.random() < 0.6) reactor.art.play(reactor.tag, true)
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
        const visible = crowdSize(state.generators[id] ?? 0, list.length, exponents.get(id))
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
      else {
        app.resize()
        layout()
        app.ticker.start()
      }
    },
    setReducedMotion(on) {
      reducedMotion = on
    },
    setInset(px) {
      if (px === inset) return
      inset = px
      layout()
    },
    playEnter() {
      if (reducedMotion) return Promise.resolve()
      const toX = def.player.x
      const fromX = toX < ART_W / 2 ? toX + 200 : toX - 200
      player.view.x = fromX
      return new Promise<void>((resolve) => {
        new Tween({ x: fromX, t: 0 }, tweens)
          .to({ x: toX, t: 1 }, 650)
          .easing(Easing.Quadratic.Out)
          .onUpdate(({ x, t }) => {
            player.view.x = Math.round(x)
            // Two-pixel step bob while walking in.
            player.view.y =
              PLAYER_Y - (t < 1 ? Math.round(Math.abs(Math.sin(t * Math.PI * 6)) * 2) : 0)
          })
          .onComplete(() => {
            player.play('talk', true)
            resolve()
          })
          .start()
      })
    },
    destroy() {
      observer.disconnect()
      app.destroy(true, { children: true })
    },
  }
}
