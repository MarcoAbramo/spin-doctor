import { assetUrl } from '@spin-doctor/shared'

const cache = new Map<string, Promise<boolean>>()

/**
 * Checks whether an optional asset file exists (see docs/ASSET_GUIDE.md).
 * Missing files fall back to placeholders, so art can be added without code changes.
 */
export function assetExists(path: string): Promise<boolean> {
  let hit = cache.get(path)
  if (!hit) {
    hit = fetch(assetUrl(path), { method: 'HEAD' })
      .then((res) => {
        const type = res.headers.get('content-type') ?? ''
        return res.ok && (type.startsWith('image/') || type.startsWith('audio/'))
      })
      .catch(() => false)
    cache.set(path, hit)
  }
  return hit
}
