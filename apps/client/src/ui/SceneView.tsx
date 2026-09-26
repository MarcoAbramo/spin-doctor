import { formatNumber, tap } from '@spin-doctor/shared'
import { useEffect, useRef } from 'preact/hooks'
import { content } from '../content'
import { t } from '../i18n'
import { play, vibrate } from '../juice/audio'
import type { Scene } from '../scene/scene'
import { dispatch, getState, subscribe } from '../store'

/** Shared handle so game events (shake, confetti) can reach the lazily loaded scene. */
export const scene: { current: Scene | null } = { current: null }

export function SceneView() {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let unsub: (() => void) | undefined
    let alive = true
    // PixiJS is loaded on demand to keep the initial bundle small.
    void import('../scene/scene').then(async ({ createScene }) => {
      if (!host.current || !alive) return
      const s = await createScene(host.current, getState().location)
      scene.current = s
      s.setReducedMotion(
        getState().settings.reducedMotion ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      )
      s.update(getState())
      unsub = subscribe(() => s.update(getState()))
      document.addEventListener('visibilitychange', () => s.setPaused(document.hidden))
    })
    return () => {
      alive = false
      unsub?.()
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

  return (
    <div class="scene" ref={host}>
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
    </div>
  )
}
