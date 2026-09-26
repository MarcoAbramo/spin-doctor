import { useAsset } from './hooks'

/** Shows `assets/<path>` once the file exists, otherwise the emoji fallback. */
export function AssetIcon({
  path,
  emoji,
  class: cls = 'card-icon',
}: {
  path: string
  emoji: string
  class?: string
}) {
  const exists = useAsset(path)
  return (
    <div class={cls} aria-hidden="true">
      {exists ? <img src={`assets/${path}`} alt="" /> : emoji}
    </div>
  )
}
