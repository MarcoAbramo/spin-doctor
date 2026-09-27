import {
  assetUrl,
  formatNumber,
  type GameState,
  isLocationUnlocked,
  locationRate,
  multiplier,
  tillCap,
} from '@spin-doctor/shared'
import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
  TextureSource,
} from 'pixi.js'
import { content } from '../content'
import { has, t } from '../i18n'
import { drawPlaceholder } from './placeholders'
import { type Art, loadArt } from './sprites'

/**
 * The walkable city map (Tiled JSON in `public/assets/maps/superbia.json`).
 * Tap to walk (A* on the collision layer), tap a building to walk to its door
 * and enter. Live signs above buildings show each location's till.
 */
const TILE = 16
/** Roughly this many art pixels are visible horizontally. */
const VIEW_W = 320
const WALK_SPEED = 72 // art px per second

interface TiledLayer {
  name: string
  type: 'tilelayer' | 'objectgroup'
  data?: number[]
  objects?: TiledObject[]
}
interface TiledObject {
  name: string
  type?: string
  x: number
  y: number
  width: number
  height: number
  properties?: Array<{ name: string; value: string | number | boolean }>
}
interface TiledMap {
  width: number
  height: number
  tilewidth: number
  tilesets: Array<{ firstgid: number; image: string; columns: number; tilecount: number }>
  layers: TiledLayer[]
}

export interface Building {
  id: string
  /** Location id in the content (may not exist yet → "coming soon"). */
  location: string
  x: number
  y: number
  w: number
  h: number
  door: [number, number]
  art: Art
}

export interface MapCallbacks {
  /** The player reached a building's door. */
  onArrive(building: Building): void
  /** The player tapped a sign (show the info card). */
  onInfo(building: Building): void
}

export interface MapScene {
  buildings: Building[]
  update(state: GameState): void
  setActive(active: boolean): void
  walkToBuilding(id: string): void
  placeAtDoor(id: string): void
  /** Stepped pixel zoom onto a building's door (transition helper). */
  zoomTo(id: string, ms: number): Promise<void>
  resetZoom(): void
  setReducedMotion(on: boolean): void
  /** Height (CSS px) covered by the open menu drawer at the bottom. */
  setInset(px: number): void
}

const prop = (o: TiledObject, name: string) => o.properties?.find((p) => p.name === name)?.value

/** Plain A* on a 4-connected grid. Returns tiles from start (exclusive) to goal. */
function findPath(
  blocked: Uint8Array,
  w: number,
  h: number,
  from: [number, number],
  to: [number, number],
): Array<[number, number]> | null {
  const idx = (x: number, y: number) => y * w + x
  const goal = idx(to[0], to[1])
  if (blocked[goal]) return null
  const start = idx(from[0], from[1])
  const g = new Float64Array(w * h).fill(Number.POSITIVE_INFINITY)
  const came = new Int32Array(w * h).fill(-1)
  const open = new Set<number>([start])
  const f = new Float64Array(w * h).fill(Number.POSITIVE_INFINITY)
  const heur = (i: number) => Math.abs((i % w) - to[0]) + Math.abs(Math.floor(i / w) - to[1])
  g[start] = 0
  f[start] = heur(start)
  while (open.size) {
    let current = -1
    for (const i of open) if (current < 0 || f[i]! < f[current]!) current = i
    if (current === goal) break
    open.delete(current)
    const cx = current % w
    const cy = Math.floor(current / w)
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = cx + dx
      const ny = cy + dy
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
      const n = idx(nx, ny)
      if (blocked[n]) continue
      const score = g[current]! + 1
      if (score < g[n]!) {
        came[n] = current
        g[n] = score
        f[n] = score + heur(n)
        open.add(n)
      }
    }
  }
  if (came[goal] === -1 && goal !== start) return null
  const path: Array<[number, number]> = []
  for (let i = goal; i !== start; i = came[i]!) path.unshift([i % w, Math.floor(i / w)])
  return path
}

export async function createMap(host: HTMLElement, callbacks: MapCallbacks): Promise<MapScene> {
  TextureSource.defaultOptions.scaleMode = 'nearest'
  const app = new Application()
  await app.init({
    resizeTo: host,
    background: 0x63c74d,
    antialias: false,
    roundPixels: true,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    preference: 'webgl',
  })
  app.canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(app.canvas)
  const signLayer = document.createElement('div')
  signLayer.className = 'map-signs'
  host.appendChild(signLayer)

  const map = (await (await fetch(assetUrl('maps/superbia.json'))).json()) as TiledMap
  const W = map.width
  const H = map.height
  const tileset = map.tilesets[0]!
  const sheet = await Assets.load<Texture>(assetUrl(`maps/${tileset.image}`))
  sheet.source.scaleMode = 'nearest'
  const tiles: Texture[] = []
  for (let i = 0; i < tileset.tilecount; i++)
    tiles.push(
      new Texture({
        source: sheet.source,
        frame: new Rectangle(
          (i % tileset.columns) * TILE,
          Math.floor(i / tileset.columns) * TILE,
          TILE,
          TILE,
        ),
      }),
    )

  const world = new Container()
  const ground = new Container()
  const actors = new Container()
  actors.sortableChildren = true
  const fx = new Container()
  const tint = new Graphics()
  app.stage.addChild(world, tint)
  world.addChild(ground, actors, fx)

  const blocked = new Uint8Array(W * H)
  for (const layer of map.layers) {
    if (layer.type !== 'tilelayer' || !layer.data) continue
    if (layer.name === 'collision') {
      layer.data.forEach((gid, i) => {
        if (gid) blocked[i] = 1
      })
      continue
    }
    layer.data.forEach((gid, i) => {
      const tex = gid ? tiles[gid - tileset.firstgid] : undefined
      if (!tex) return
      const s = new Sprite(tex)
      s.position.set((i % W) * TILE, Math.floor(i / W) * TILE)
      ground.addChild(s)
    })
  }
  // Static tiles are rendered once into a texture.
  ground.cacheAsTexture(true)

  // Lamps glow at night.
  const lamps: Array<[number, number]> = []
  const deco = map.layers.find((l) => l.name === 'deco')?.data ?? []
  deco.forEach((gid, i) => {
    if (gid === 20) lamps.push([(i % W) * TILE + 8, Math.floor(i / W) * TILE + 2])
  })
  const glow = new Graphics()
  fx.addChild(glow)

  // --- Buildings & signs -------------------------------------------------------
  const buildings: Building[] = []
  const signs = new Map<string, HTMLButtonElement>()
  const objects = map.layers.find((l) => l.name === 'buildings')?.objects ?? []
  for (const o of objects) {
    const sprite = String(prop(o, 'sprite') ?? `map-${o.name}`)
    const art = await loadArt(sprite, () => drawPlaceholder(sprite, o.width, o.height))
    art.view.position.set(o.x + o.width / 2, o.y + o.height)
    art.view.zIndex = o.y + o.height
    actors.addChild(art.view)
    const b: Building = {
      id: o.name,
      location: String(prop(o, 'location') ?? o.name),
      x: o.x,
      y: o.y,
      w: o.width,
      h: o.height,
      door: [Number(prop(o, 'doorX')), Number(prop(o, 'doorY'))],
      art,
    }
    buildings.push(b)
    const sign = document.createElement('button')
    sign.type = 'button'
    sign.className = 'map-sign'
    sign.addEventListener('click', (e) => {
      e.stopPropagation()
      callbacks.onInfo(b)
    })
    signLayer.appendChild(sign)
    signs.set(b.id, sign)
  }

  // --- Building projects from content (e.g. the reflecting pool), staged by count ---
  const projects: Array<{ id: string; max: number; art: Art }> = []
  for (const g of content.generators) {
    if (!g.mapSprite) continue
    const art = await loadArt(g.mapSprite.sprite, () =>
      drawPlaceholder(g.mapSprite!.sprite, 32, 16),
    )
    art.view.position.set(g.mapSprite.x, g.mapSprite.y)
    art.view.zIndex = g.mapSprite.y - 1000 // lies on the ground
    actors.addChild(art.view)
    projects.push({ id: g.id, max: g.maxCount ?? 10, art })
  }
  let lastStages = ''
  function updateProjects(state: GameState): void {
    const key = projects.map((p) => state.generators[p.id] ?? 0).join(',')
    if (key === lastStages) return
    lastStages = key
    for (const p of projects) {
      const count = state.generators[p.id] ?? 0
      p.art.showFrame(Math.round((count / p.max) * (p.art.frames - 1)))
    }
  }

  // --- Player ---------------------------------------------------------------------
  const player = await loadArt('player-walk', () => drawPlaceholder('player-walk', 12, 22))
  const spawn = map.layers.find((l) => l.name === 'spawn')?.objects?.[0]
  const pos = { x: (spawn?.x ?? 0) + TILE / 2, y: (spawn?.y ?? 0) + TILE - 1 }
  let facing = 'down'
  player.play('idle-down')
  actors.addChild(player.view)
  const tileOf = (x: number, y: number): [number, number] => [
    Math.floor(x / TILE),
    Math.floor((y - 1) / TILE),
  ]

  let path: Array<[number, number]> = []
  let target: Building | null = null
  const pathDots = new Graphics()
  fx.addChild(pathDots)
  const marker = new Graphics()
  fx.addChild(marker)

  function drawPath(): void {
    pathDots.clear()
    for (const [x, y] of path) pathDots.rect(x * TILE + 7, y * TILE + 7, 2, 2).fill(0xfee761)
    const last = path[path.length - 1]
    marker.clear()
    if (last)
      marker
        .rect(last[0] * TILE + 4, last[1] * TILE + 4, 8, 8)
        .stroke({ width: 1, color: 0xfee761 })
  }

  function walkTo(tile: [number, number], building: Building | null): void {
    const found = findPath(blocked, W, H, tileOf(pos.x, pos.y), tile)
    if (!found) return
    path = found
    target = building
    drawPath()
    if (path.length === 0 && building) callbacks.onArrive(building)
  }

  function walkToBuilding(id: string): void {
    const b = buildings.find((x) => x.id === id)
    if (b) walkTo(b.door, b)
  }

  // --- Camera ---------------------------------------------------------------------
  let scale = 1
  let zoom = 1
  let focus: { x: number; y: number } | null = null
  let inset = 0
  function layout(): void {
    const { width } = app.screen
    const res = app.renderer.resolution
    const fit = width / VIEW_W
    const snapped = Math.max(1, Math.floor(fit * res)) / res
    scale = snapped / fit > 0.8 ? snapped : fit
  }
  layout()
  app.renderer.on('resize', layout)
  // Pixi's resizeTo only listens to window resizes; the host also changes when shown.
  const observer = new ResizeObserver(() => {
    app.resize()
    layout()
  })
  observer.observe(host)

  function camera(): void {
    const s = scale * zoom
    world.scale.set(s)
    const { width, height } = app.screen
    const cx = focus?.x ?? pos.x
    const cy = focus?.y ?? pos.y - 12
    // Centre in the part of the canvas that the menu drawer leaves visible.
    const visible = Math.max(height / 3, height - inset)
    const maxX = W * TILE - width / s
    const maxY = H * TILE - visible / s
    const left = Math.min(Math.max(cx - width / s / 2, 0), Math.max(0, maxX))
    const top = Math.min(Math.max(cy - visible / s / 2, 0), Math.max(0, maxY))
    world.position.set(-Math.round(left * s), -Math.round(top * s))
  }

  // --- Input ------------------------------------------------------------------------
  let down: { x: number; y: number } | null = null
  app.canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY }
  })
  app.canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12) return
    down = null
    const rect = app.canvas.getBoundingClientRect()
    const s = scale * zoom
    const wx = (e.clientX - rect.left - world.position.x) / s
    const wy = (e.clientY - rect.top - world.position.y) / s
    // Buildings (including the part of the sprite above the footprint).
    const hit = buildings.find((b) => {
      const top = b.y + b.h - (b.art.view.height || b.h)
      return wx >= b.x && wx < b.x + b.w && wy >= top && wy < b.y + b.h
    })
    if (hit) {
      walkTo(hit.door, hit)
      return
    }
    const tx = Math.floor(wx / TILE)
    const ty = Math.floor(wy / TILE)
    if (tx < 0 || ty < 0 || tx >= W || ty >= H) return
    if (!blocked[ty * W + tx]) walkTo([tx, ty], null)
  })

  // --- Ambient: clouds, cars, smoke ------------------------------------------------
  let reducedMotion = false
  const clouds = Array.from({ length: 4 }, (_, i) => {
    const g = new Graphics()
    for (const [dx, dy, w, h] of [
      [0, 8, 56, 16],
      [12, 0, 32, 32],
      [36, 4, 28, 20],
    ] as const)
      g.rect(dx, dy, w, h).fill({ color: 0x181425, alpha: 0.1 })
    g.position.set(((i * 211) % (W * TILE)) - 60, (i * 173) % (H * TILE))
    fx.addChild(g)
    return g
  })
  const carColors = [0xe43b44, 0x0099db, 0xfee761, 0xffffff, 0x68386c]
  const cars = [
    { lane: 'h', y: 17 * TILE + 3, x: 20, v: 40 },
    { lane: 'h', y: 18 * TILE + 7, x: 300, v: -34 },
    { lane: 'h', y: 31 * TILE + 3, x: 500, v: 46 },
    { lane: 'h', y: 32 * TILE + 7, x: 100, v: -38 },
    { lane: 'v', x: 10 * TILE + 3, y: 60, v: 36 },
    { lane: 'v', x: 35 * TILE + 5, y: 600, v: -42 },
  ].map((c, i) => {
    const g = new Graphics()
    const [w, h] = c.lane === 'h' ? [12, 7] : [7, 12]
    g.rect(0, 0, w, h).fill(carColors[i % carColors.length]!)
    g.rect(
      c.lane === 'h' ? 3 : 1,
      c.lane === 'h' ? 1 : 3,
      c.lane === 'h' ? 5 : 5,
      c.lane === 'h' ? 5 : 5,
    ).fill(0x2ce8f5)
    g.rect(0, 0, w, h).stroke({ width: 1, color: 0x181425 })
    g.position.set(c.x, c.y)
    actors.addChild(g)
    return { ...c, g }
  })
  const puffs: Array<{ g: Graphics; life: number; vy: number }> = []
  const smokeTimers = new Map<string, number>()
  let lastState: GameState | null = null

  // --- Tick --------------------------------------------------------------------------
  let elapsed = 0
  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS / 1000
    elapsed += dt
    // walking
    const next = path[0]
    if (next) {
      const tx = next[0] * TILE + TILE / 2
      const ty = next[1] * TILE + TILE - 1
      const dx = tx - pos.x
      const dy = ty - pos.y
      const dist = Math.hypot(dx, dy)
      const step = WALK_SPEED * dt
      facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
      player.play(`walk-${facing}`)
      if (dist <= step) {
        pos.x = tx
        pos.y = ty
        path.shift()
        drawPath()
        if (path.length === 0) {
          player.play(target ? 'idle-up' : `idle-${facing}`)
          if (target) {
            const b = target
            target = null
            callbacks.onArrive(b)
          }
        }
      } else {
        pos.x += (dx / dist) * step
        pos.y += (dy / dist) * step
      }
    }
    player.view.position.set(Math.round(pos.x), Math.round(pos.y))
    player.view.zIndex = pos.y
    marker.visible = Math.floor(elapsed * 4) % 2 === 0

    if (!reducedMotion) {
      for (const c of clouds) {
        c.x += 6 * dt
        if (c.x > W * TILE) c.x = -80
      }
      for (const car of cars) {
        if (car.lane === 'h') {
          car.x += car.v * dt
          if (car.x > W * TILE + 20) car.x = -20
          if (car.x < -20) car.x = W * TILE + 20
        } else {
          car.y += car.v * dt
          if (car.y > H * TILE + 20) car.y = -20
          if (car.y < -20) car.y = H * TILE + 20
        }
        car.g.position.set(Math.round(car.x), Math.round(car.y))
        car.g.zIndex = car.y
      }
      // smoke / coin sparkle depends on production & till
      if (lastState) {
        for (const b of buildings) {
          if (!content.locations.some((l) => l.id === b.location)) continue
          if (!isLocationUnlocked(lastState, content, b.location)) continue
          const rate = locationRate(lastState, content, b.location)
          if (rate <= 0) continue
          const every = 2.4 / (1 + Math.log10(1 + rate))
          const timer = (smokeTimers.get(b.id) ?? 0) - dt
          if (timer > 0) {
            smokeTimers.set(b.id, timer)
            continue
          }
          smokeTimers.set(b.id, every)
          const full = lastState.locations[b.location]?.fullNotified
          const g = new Graphics()
            .rect(0, 0, 3, 3)
            .fill(full ? 0xfeae34 : { color: 0xc0cbdc, alpha: 0.8 })
          const top = b.y + b.h - (b.art.view.height || b.h)
          g.position.set(b.x + b.w * (0.3 + Math.random() * 0.4), top + 4)
          fx.addChild(g)
          puffs.push({ g, life: 1.6, vy: full ? -24 : -10 })
        }
      }
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i]!
      p.life -= dt
      p.g.y += p.vy * dt
      p.g.x += Math.sin((p.life + i) * 3) * 0.2
      p.g.visible = p.life > 0.3 || Math.floor(p.life * 20) % 2 === 0
      if (p.life <= 0) {
        p.g.destroy()
        puffs.splice(i, 1)
      }
    }
    camera()
    positionSigns()
  })

  // --- Signs (DOM, crisp text, tappable) -------------------------------------------
  function positionSigns(): void {
    const s = scale * zoom
    for (const b of buildings) {
      const el = signs.get(b.id)
      if (!el) continue
      const top = b.y + b.h - (b.art.view.height || b.h)
      const x = world.position.x + (b.x + b.w / 2) * s
      const y = world.position.y + top * s - 4
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -100%)`
      el.style.visibility = zoom > 1 ? 'hidden' : 'visible'
    }
  }

  function updateSigns(state: GameState): void {
    for (const b of buildings) {
      const el = signs.get(b.id)
      if (!el) continue
      const exists = content.locations.some((l) => l.id === b.location)
      const name = has(`location.${b.location}.name`)
        ? t(`location.${b.location}.name`)
        : t(`map.building.${b.id}`)
      let status = ''
      let cls = 'map-sign'
      if (!exists) {
        status = `🚧 ${t('ui.map.soon')}`
        cls += ' map-sign-soon'
      } else if (!isLocationUnlocked(state, content, b.location)) {
        status = `🔒 ${t('ui.map.locked')}`
        cls += ' map-sign-locked'
      } else if (state.location === b.location) {
        status = `📍 ${t('ui.map.perMinute', { value: formatNumber(locationRate(state, content, b.location) * 60) })}`
        cls += ' map-sign-here'
      } else {
        const till = state.locations[b.location]?.till[content.currency] ?? 0
        const cap = tillCap(state, content, b.location)
        const pct = cap > 0 ? Math.min(100, (till / cap) * 100) : 0
        const mood = multiplier(state, content, `location:${b.location}`)
        const icon = mood > 1.01 ? '🔥 ' : mood < 0.99 ? '🌧 ' : ''
        const full = pct >= 99.9
        status = `${icon}${full ? t('ui.map.full') : `+${formatNumber(till)}`}<span class="map-sign-bar"><span style="width:${pct}%"></span></span>`
        if (full) cls += ' map-sign-full'
        if (mood > 1.01) cls += ' map-sign-hot'
      }
      const html = `<span class="map-sign-name">${name}</span><span class="map-sign-status">${status}</span>`
      if (el.innerHTML !== html) el.innerHTML = html
      if (el.className !== cls) el.className = cls
      el.setAttribute('aria-label', `${name}: ${el.textContent ?? ''}`)
    }
  }

  function updateTint(state: GameState): void {
    const h = state.clock.hour
    const { width, height } = app.screen
    tint.clear()
    glow.clear()
    let color = 0
    let alpha = 0
    if (h >= 21 || h < 6) {
      color = 0x262b44
      alpha = 0.38
    } else if (h >= 18) {
      color = 0xf77622
      alpha = 0.14
    } else if (h < 8) {
      color = 0xfeae34
      alpha = 0.1
    }
    if (alpha > 0) tint.rect(0, 0, width, height).fill({ color, alpha })
    if (h >= 19 || h < 7)
      for (const [x, y] of lamps)
        glow.rect(x - 4, y - 2, 8, 8).fill({ color: 0xfee761, alpha: 0.35 })
  }

  let lastSigns = 0
  return {
    buildings,
    update(state) {
      lastState = state
      const now = performance.now()
      if (now - lastSigns < 100) return
      lastSigns = now
      updateProjects(state)
      updateSigns(state)
      updateTint(state)
    },
    setActive(active) {
      host.style.display = active ? '' : 'none'
      if (active) {
        app.resize()
        layout()
        app.ticker.start()
      } else app.ticker.stop()
    },
    walkToBuilding,
    placeAtDoor(id) {
      const b = buildings.find((x) => x.id === id || x.location === id)
      if (!b) return
      path = []
      target = null
      drawPath()
      pos.x = b.door[0] * TILE + TILE / 2
      pos.y = b.door[1] * TILE + TILE - 1
      facing = 'down'
      player.play('idle-down')
      camera()
    },
    zoomTo(id, ms) {
      const b = buildings.find((x) => x.id === id || x.location === id)
      if (!b) return Promise.resolve()
      focus = { x: b.door[0] * TILE + 8, y: b.door[1] * TILE }
      const steps = [1.5, 2, 3]
      return new Promise((resolve) => {
        steps.forEach((z, i) => {
          setTimeout(
            () => {
              zoom = z
              if (i === steps.length - 1) resolve()
            },
            ((i + 1) * ms) / steps.length,
          )
        })
      })
    },
    resetZoom() {
      zoom = 1
      focus = null
    },
    setReducedMotion(on) {
      reducedMotion = on
      for (const c of clouds) c.visible = !on
    },
    setInset(px) {
      inset = px
      camera()
    },
  }
}
