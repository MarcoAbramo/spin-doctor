import {
  formatNumber,
  getLocation,
  isLocationUnlocked,
  isMapUnlocked,
  openMap,
  tap,
  travel,
} from '@spin-doctor/shared'
import { useEffect, useRef, useState } from 'preact/hooks'
import { content } from '../content'
import { has, t } from '../i18n'
import { play, prefersReducedMotion, vibrate } from '../juice/audio'
import type { Building, MapScene } from '../scene/map'
import type { Scene } from '../scene/scene'
import { dispatch, getState, subscribe } from '../store'
import { useGame } from './hooks'
import { LocationCard } from './modals/LocationCard'
import { pushToast } from './toast-store'
import { banner, coinStream, cover, flashes, paperGust, reveal } from './transitions'

/** Shared handles so game events (shake, confetti) can reach the lazily loaded scenes. */
export const scene: { current: Scene | null } = { current: null }
export const world: { map: MapScene | null } = { map: null }

type View = 'location' | 'map'
let view: View = 'location'
let busy = false
let sceneLocation = ''
let locHost: HTMLDivElement | null = null
let mapHost: HTMLDivElement | null = null
let setViewUi: (v: View) => void = () => undefined
let openInfo: (b: Building | null) => void = () => undefined

function reducedMotion(): boolean {
  return getState().settings.reducedMotion || prefersReducedMotion()
}

export function locationName(id: string): string {
  return has(`location.${id}.name`) ? t(`location.${id}.name`) : t(`map.building.${id}`)
}

async function showLocation(id: string): Promise<void> {
  if (!locHost) return
  if (scene.current && sceneLocation === id) {
    scene.current.setPaused(false)
    return
  }
  scene.current?.destroy()
  scene.current = null
  // PixiJS is loaded on demand to keep the initial bundle small.
  const { createScene } = await import('../scene/scene')
  const s = await createScene(locHost, id)
  s.setReducedMotion(reducedMotion())
  s.update(getState())
  scene.current = s
  sceneLocation = id
}

async function ensureMap(): Promise<MapScene | null> {
  if (world.map) return world.map
  if (!mapHost) return null
  // The host must be visible (have a size) while Pixi initialises.
  mapHost.style.display = ''
  const { createMap } = await import('../scene/map')
  world.map = await createMap(mapHost, {
    onArrive: (b) => void enterBuilding(b),
    onInfo: (b) => openInfo(b),
  })
  world.map.setReducedMotion(reducedMotion())
  world.map.update(getState())
  return world.map
}

function setView(v: View): void {
  view = v
  setViewUi(v)
}

/** Map → location: zoom, dither, travel (collects the till), banner, entry show, coins. */
export async function enterBuilding(b: Building): Promise<void> {
  const state = getState()
  const exists = content.locations.some((l) => l.id === b.location)
  if (busy || !exists || !isLocationUnlocked(state, content, b.location)) {
    openInfo(b)
    return
  }
  busy = true
  try {
    play('notify')
    vibrate(10)
    if (!reducedMotion()) await world.map?.zoomTo(b.id, 300)
    await cover(300)
    dispatch((s) => travel(s, content, b.location))
    const collected = getState().events.find((e) => e.type === 'till-collected')
    const amount =
      collected?.type === 'till-collected' ? (collected.amounts[content.currency] ?? 0) : 0
    await showLocation(b.location)
    world.map?.setActive(false)
    world.map?.resetZoom()
    setView('location')
    const loc = getLocation(content, b.location)
    banner(locationName(loc.id), loc.emoji ?? '')
    await reveal(300)
    const preset = loc.enter?.preset
    const show = scene.current?.playEnter()
    if (preset === 'doors') await flashes(3)
    if (preset === 'gate') await paperGust()
    await show
    if (amount > 0) {
      play('milestone')
      vibrate([20, 40, 20])
      pushToast(
        t('ui.toast.collected', { name: locationName(loc.id), value: formatNumber(amount) }),
        'good',
      )
      await coinStream(Math.min(20, 6 + Math.round(Math.log10(1 + amount) * 2)))
    }
  } finally {
    busy = false
  }
}

/** Location → map. */
export async function openMapView(): Promise<void> {
  if (busy || !isMapUnlocked(getState(), content)) return
  busy = true
  try {
    play('upgrade')
    await cover(260)
    const map = await ensureMap()
    if (!map) return
    map.placeAtDoor(getState().location)
    map.setActive(true)
    scene.current?.setPaused(true)
    setView('map')
    dispatch((s) => openMap(s, content))
    await reveal(260)
  } finally {
    busy = false
  }
}

export function SceneView() {
  const locRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const state = useGame()
  const [current, setCurrent] = useState<View>(view)
  const [info, setInfo] = useState<Building | null>(null)

  useEffect(() => {
    locHost = locRef.current
    mapHost = mapRef.current
    setViewUi = setCurrent
    openInfo = setInfo
    void showLocation(getState().location)
    const unsub = subscribe(() => {
      const s = getState()
      if (view === 'location') scene.current?.update(s)
      else world.map?.update(s)
    })
    const onVisibility = () => {
      if (view === 'location') scene.current?.setPaused(document.hidden)
      else world.map?.setActive(!document.hidden)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      unsub()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const doTap = (x: number, y: number) => {
    const before = getState().stats[content.currency] ?? 0
    dispatch((s) => tap(s, content))
    const gained = (getState().stats[content.currency] ?? 0) - before
    scene.current?.tap(x, y, `+${formatNumber(gained)}`)
    play('tap')
    vibrate(8)
  }

  const mapOpen = isMapUnlocked(state, content)
  const firstTime = mapOpen && !state.counters['map-opened']

  return (
    <div class="scene">
      <div class="scene-host" ref={locRef} />
      <div class="scene-host" ref={mapRef} style={{ display: 'none' }} />
      {current === 'location' && (
        <button
          type="button"
          class="scene-tap"
          aria-label={t('ui.tapButton')}
          onPointerDown={(e) => {
            e.preventDefault()
            doTap(e.clientX, e.clientY)
          }}
          onClick={(e) => {
            // Keyboard activation (Enter/Space) — pointer taps are handled on pointerdown.
            if (e.detail === 0) {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
              doTap(r.left + r.width / 2, r.top + r.height * 0.75)
            }
          }}
        />
      )}
      {mapOpen && current === 'location' && (
        <button
          type="button"
          class={`btn btn-small scene-btn ${firstTime ? 'scene-btn-pulse' : ''}`}
          onClick={() => void openMapView()}
        >
          🗺 {t('ui.map.open')}
        </button>
      )}
      {current === 'map' && (
        <button
          type="button"
          class="btn btn-small scene-btn"
          onClick={() => {
            const b = world.map?.buildings.find((x) => x.location === getState().location)
            if (b) void enterBuilding(b)
          }}
        >
          ↩ {locationName(state.location)}
        </button>
      )}
      {info && (
        <LocationCard
          building={info}
          onClose={() => setInfo(null)}
          onGo={() => {
            setInfo(null)
            if (info.location === getState().location) void enterBuilding(info)
            else world.map?.walkToBuilding(info.id)
          }}
        />
      )}
    </div>
  )
}
