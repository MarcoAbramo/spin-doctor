import { assetUrl } from '@spin-doctor/shared'
import { AnimatedSprite, Assets, type Container, Rectangle, Sprite, Texture } from 'pixi.js'
import { hasAsset } from '../assets'

/**
 * Loads `sprites/<name>.png` and — if present — `sprites/<name>.json` in Aseprite's
 * "Array" export format (frames + meta.frameTags). Tags become named animations.
 * Without JSON the PNG is a single static frame. Anchor is always bottom-centre.
 */
export interface Art {
  view: Container
  /** Plays a tagged animation; `once` returns to `idle` afterwards. */
  play(tag: string, once?: boolean): void
  has(tag: string): boolean
  /** Number of frames in the sheet (1 for static sprites). */
  frames: number
  /** Stops on one frame (e.g. a building project's construction stage). */
  showFrame(index: number): void
}

interface AsepriteJson {
  frames: Array<{ frame: { x: number; y: number; w: number; h: number }; duration?: number }>
  meta?: { frameTags?: Array<{ name: string; from: number; to: number }> }
}

interface Sheet {
  texture: Texture
  json: AsepriteJson | null
}

async function loadJson(path: string): Promise<AsepriteJson | null> {
  if (!hasAsset(path)) return null
  try {
    const res = await fetch(assetUrl(path))
    return res.ok ? ((await res.json()) as AsepriteJson) : null
  } catch {
    return null
  }
}

// One download per sprite name, however many copies stand in the room.
const sheets = new Map<string, Promise<Sheet | null>>()

function loadSheet(name: string): Promise<Sheet | null> {
  let hit = sheets.get(name)
  if (!hit) {
    const png = `sprites/${name}.png`
    hit = hasAsset(png)
      ? Promise.all([Assets.load<Texture>(assetUrl(png)), loadJson(`sprites/${name}.json`)])
          .then(([texture, json]) => {
            texture.source.scaleMode = 'nearest'
            return { texture, json }
          })
          .catch(() => null)
      : Promise.resolve(null)
    sheets.set(name, hit)
  }
  return hit
}

/** Starts downloading sprites early so building a scene doesn't wait on each in turn. */
export function preloadArt(names: Iterable<string>): Promise<unknown> {
  return Promise.all([...new Set(names)].map(loadSheet))
}

export async function loadArt(name: string, fallback: () => Container): Promise<Art> {
  const sheet = await loadSheet(name)
  if (!sheet) return staticArt(fallback())
  const { texture, json } = sheet
  if (!json?.frames?.length) {
    const sprite = new Sprite(texture)
    sprite.anchor.set(0.5, 1)
    return staticArt(sprite)
  }

  const frames = json.frames.map(({ frame, duration }) => ({
    texture: new Texture({
      source: texture.source,
      frame: new Rectangle(frame.x, frame.y, frame.w, frame.h),
    }),
    time: duration ?? 100,
  }))
  const tags = new Map<string, typeof frames>()
  for (const tag of json.meta?.frameTags ?? [])
    tags.set(tag.name, frames.slice(tag.from, tag.to + 1))
  if (!tags.has('idle')) tags.set('idle', tags.values().next().value ?? frames)

  const sprite = new AnimatedSprite(tags.get('idle')!)
  sprite.anchor.set(0.5, 1)
  sprite.play()
  let current = 'idle'
  return {
    view: sprite,
    has: (tag) => tags.has(tag),
    frames: frames.length,
    showFrame(index) {
      sprite.textures = frames
      current = ''
      sprite.gotoAndStop(Math.max(0, Math.min(frames.length - 1, index)))
    },
    play(tag, once = false) {
      const next = tags.get(tag)
      if (!next) return
      if (current !== tag || once) {
        sprite.textures = next
        current = tag
      }
      sprite.loop = !once
      sprite.onComplete = once
        ? () => {
            sprite.textures = tags.get('idle')!
            current = 'idle'
            sprite.loop = true
            sprite.play()
          }
        : undefined
      sprite.gotoAndPlay(0)
    },
  }
}

function staticArt(view: Container): Art {
  return { view, play: () => undefined, has: () => false, frames: 1, showFrame: () => undefined }
}
