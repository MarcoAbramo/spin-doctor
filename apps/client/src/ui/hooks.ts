import type { GameState } from '@spin-doctor/shared'
import { useEffect, useState } from 'preact/hooks'
import { assetExists } from '../assets'
import { getState, subscribe } from '../store'

/** Re-renders on every store notification (max ~10 Hz plus immediate on actions). */
export function useGame(): GameState {
  const [, force] = useState(0)
  useEffect(() => subscribe(() => force((n) => n + 1)), [])
  return getState()
}

/** Resolves to true once the optional asset file exists. */
export function useAsset(path: string): boolean {
  const [exists, setExists] = useState(false)
  useEffect(() => {
    let alive = true
    void assetExists(path).then((ok) => alive && setExists(ok))
    return () => {
      alive = false
    }
  }, [path])
  return exists
}
