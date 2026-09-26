import { assetUrl, type GameState } from '@spin-doctor/shared'
import { Easing, Group, Tween } from '@tweenjs/tween.js'
import { Application, Assets, Container, Graphics, Sprite, Text } from 'pixi.js'
import { assetExists } from '../assets'
import { content } from '../content'
import { drawPlaceholder } from './placeholders'

/** Virtual design space; the scene is scaled to fit the canvas. */
const W = 400
const H = 500

export interface Scene {
  tap(clientX: number, clientY: number, label: string): void
  update(state: GameState): void
  shake(): void
  confetti(): void
  setPaused(paused: boolean): void
  setReducedMotion(on: boolean): void
}

/** Where generator props stand in the room (design coordinates). */
const SLOTS: Record<string, Array<[number, number]>> = {
  intern: [
    [55, 430],
    [95, 450],
    [135, 435],
  ],
  'talkshow-guest': [
    [335, 345],
    [365, 370],
  ],
  'bot-farm': [
    [40, 300],
    [72, 300],
  ],
  'court-paper': [
    [310, 440],
    [350, 455],
  ],
  'jubel-tv': [[70, 170]],
  'truth-ministry': [[330, 170]],
}

async function loadSprite(path: string, fallback: () => Container): Promise<Container> {
  if (await assetExists(path)) {
    try {
      const texture = await Assets.load(assetUrl(path))
      const sprite = new Sprite(texture)
      sprite.anchor.set(0.5, 1)
      return sprite
    } catch {
      // fall through to placeholder
    }
  }
  return fallback()
}

export async function createScene(host: HTMLElement): Promise<Scene> {
  const app = new Application()
  await app.init({
    resizeTo: host,
    backgroundAlpha: 0,
    antialias: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    preference: 'webgl',
  })
  app.canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(app.canvas)

  const tweens = new Group()
  let reducedMotion = false

  const background = new Container()
  const root = new Container()
  const fx = new Container()
  app.stage.addChild(background, root, fx)

  // --- Room --------------------------------------------------------------
  const room = await loadSprite('sprites/scene-background.png', () =>
    drawPlaceholder('scene-background'),
  )
  if (room instanceof Sprite) {
    room.anchor.set(0.5, 0)
    room.position.set(W / 2, 0)
    room.width = W
    room.height = H
  }
  root.addChild(room)

  const portrait = await loadSprite('sprites/scene-portrait.png', () =>
    drawPlaceholder('scene-portrait'),
  )
  portrait.position.set(W / 2, 205)
  if (portrait instanceof Sprite) portrait.scale.set(170 / portrait.height)
  root.addChild(portrait)

  // Generator props sit between wall and podium.
  const props = new Container()
  root.addChild(props)
  const propsByGenerator = new Map<string, Container[]>()
  for (const g of content.generators) {
    const slots = SLOTS[g.id] ?? [[W / 2 + (Math.random() - 0.5) * 300, 300]]
    const sprite = g.sprite ?? `gen-${g.id}`
    const list: Container[] = []
    for (const [x, y] of slots) {
      const prop = await loadSprite(`sprites/${sprite}.png`, () => drawPlaceholder(sprite))
      if (prop instanceof Sprite) prop.scale.set(80 / prop.height)
      prop.position.set(x, y)
      prop.visible = false
      prop.label = sprite
      props.addChild(prop)
      list.push(prop)
    }
    propsByGenerator.set(g.id, list)
  }

  const podium = await loadSprite('sprites/scene-podium.png', () => drawPlaceholder('scene-podium'))
  podium.position.set(W / 2, 480)
  if (podium instanceof Sprite) podium.scale.set(170 / podium.height)
  root.addChild(podium)

  // --- Layout ------------------------------------------------------------
  const sky = new Graphics()
  background.addChild(sky)
  function layout(): void {
    const { width, height } = app.screen
    const scale = Math.min(width / W, height / H)
    root.scale.set(scale)
    root.position.set((width - W * scale) / 2, height - H * scale)
    // Extend wall and floor beyond the design area on wide/tall screens.
    const floorY = root.position.y + 330 * scale
    sky
      .clear()
      .rect(0, 0, width, floorY)
      .fill(0x3d2f78)
      .rect(0, floorY, width, height - floorY)
      .fill(0x5a3a1f)
  }
  layout()
  app.renderer.on('resize', layout)

  // --- Animation ------------------------------------------------------------
  let elapsed = 0
  let shakeTime = 0
  const floaters: Array<{ node: Container; vx: number; vy: number; life: number; spin: number }> =
    []

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000
    elapsed += dt
    tweens.update()
    if (!reducedMotion) {
      let i = 0
      for (const list of propsByGenerator.values()) {
        for (const p of list) {
          if (!p.visible) continue
          p.scale.y = (p instanceof Sprite ? p.scale.x : 1) * (1 + Math.sin(elapsed * 3 + i) * 0.03)
          i++
        }
      }
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i]!
      f.life -= dt
      f.node.x += f.vx * dt
      f.node.y += f.vy * dt
      f.vy += 220 * dt * (f.spin ? 1 : 0.2)
      f.node.rotation += f.spin * dt
      f.node.alpha = Math.max(0, Math.min(1, f.life * 2))
      if (f.life <= 0) {
        f.node.destroy()
        floaters.splice(i, 1)
      }
    }
    if (shakeTime > 0) {
      shakeTime -= dt
      const k = Math.max(0, shakeTime) * 30
      root.pivot.set((Math.random() - 0.5) * k, (Math.random() - 0.5) * k)
      if (shakeTime <= 0) root.pivot.set(0, 0)
    }
  })

  function toLocal(clientX: number, clientY: number): { x: number; y: number } {
    const rect = app.canvas.getBoundingClientRect()
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  return {
    tap(clientX, clientY, label) {
      const { x, y } = toLocal(clientX, clientY)
      const text = new Text({
        text: label,
        style: {
          fontFamily: 'system-ui, sans-serif',
          fontSize: 26,
          fontWeight: '900',
          fill: 0xffd84d,
          stroke: { color: 0x1d1440, width: 5 },
        },
      })
      text.anchor.set(0.5)
      text.position.set(x, y - 20)
      fx.addChild(text)
      floaters.push({ node: text, vx: (Math.random() - 0.5) * 60, vy: -140, life: 0.9, spin: 0 })
      if (!reducedMotion) {
        for (let i = 0; i < 5; i++) {
          const star = new Graphics().star(0, 0, 5, 7, 3).fill(0xfff1a8)
          star.position.set(x, y)
          fx.addChild(star)
          const a = Math.random() * Math.PI * 2
          floaters.push({
            node: star,
            vx: Math.cos(a) * 160,
            vy: Math.sin(a) * 160 - 80,
            life: 0.5,
            spin: 6,
          })
        }
        // Squash & stretch on the podium.
        const base = podium instanceof Sprite ? 170 / podium.height : 1
        new Tween({ sx: base * 1.12, sy: base * 0.88 }, tweens)
          .to({ sx: base, sy: base }, 260)
          .easing(Easing.Elastic.Out)
          .onUpdate(({ sx, sy }) => podium.scale.set(sx, sy))
          .start()
      }
    },
    update(state) {
      for (const [id, list] of propsByGenerator) {
        const count = state.generators[id] ?? 0
        // 1 prop from the first unit, more at 10 and 25 units.
        const visible = count === 0 ? 0 : count < 10 ? 1 : count < 25 ? 2 : 3
        list.forEach((p, i) => {
          const show = i < visible
          if (show && !p.visible && !reducedMotion) {
            const target = p.scale.x
            new Tween({ s: 0 }, tweens)
              .to({ s: target }, 450)
              .easing(Easing.Back.Out)
              .onUpdate(({ s }) => p.scale.set(s))
              .start()
          }
          p.visible = show
        })
      }
    },
    shake() {
      if (!reducedMotion) shakeTime = 0.4
    },
    confetti() {
      const count = reducedMotion ? 0 : 60
      const colors = [0xffd84d, 0xff5c8a, 0x5ce1e6, 0x8e7cc3, 0x7ed957]
      for (let i = 0; i < count; i++) {
        const piece = new Graphics().rect(-4, -2, 8, 4).fill(colors[i % colors.length]!)
        piece.position.set(Math.random() * app.screen.width, -10)
        fx.addChild(piece)
        floaters.push({
          node: piece,
          vx: (Math.random() - 0.5) * 80,
          vy: 60 + Math.random() * 120,
          life: 2.5,
          spin: (Math.random() - 0.5) * 12,
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
