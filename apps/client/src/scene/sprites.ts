import { assetUrl } from '@spin-doctor/shared'
import { AnimatedSprite, Assets, type Container, Rectangle, Sprite, Texture } from 'pixi.js'
import { assetExists } from '../assets'

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
}

interface AsepriteJson {
  frames: Array<{ frame: { x: number; y: number; w: number; h: number }; duration?: number }>
  meta?: { frameTags?: Array<{ name: string; from: number; to: number }> }
}

async function loadJson(path: string): Promise<AsepriteJson | null> {
  try {
    const res = await fetch(assetUrl(path))
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null
    return (await res.json()) as AsepriteJson
  } catch {
    return null
  }
}

export async function loadArt(name: string, fallback: () => Container): Promise<Art> {
  const png = `sprites/${name}.png`
  if (!(await assetExists(png))) return staticArt(fallback())
  let texture: Texture
  try {
    texture = await Assets.load<Texture>(assetUrl(png))
  } catch {
    return staticArt(fallback())
  }
  texture.source.scaleMode = 'nearest'
  const json = await loadJson(`sprites/${name}.json`)
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
  return { view, play: () => undefined, has: () => false }
}
