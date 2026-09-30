import type { GameState } from '@spin-doctor/shared'
import { useEffect, useState } from 'preact/hooks'
import { hasAsset } from '../assets'
import { getState, subscribe } from '../store'

/** Re-renders on every store notification (max ~10 Hz plus immediate on actions). */
export function useGame(): GameState {
  const [, force] = useState(0)
  useEffect(() => subscribe(() => force((n) => n + 1)), [])
  return getState()
}

/** Whether the optional asset file exists in this build. */
export function useAsset(path: string): boolean {
  return hasAsset(path)
}
