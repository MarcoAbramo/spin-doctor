import { finishMinigame, type Step } from '@spin-doctor/shared'
import { useEffect, useRef, useState } from 'preact/hooks'
import { content } from '../../content'
import { t } from '../../i18n'
import { play, vibrate } from '../../juice/audio'
import { dispatch } from '../../store'
import type { StepViewProps } from './types'

type MinigameStep = Extract<Step, { type: 'minigame' }>

interface Card {
  id: number
  key: string
  negative: boolean
  y: number
  x: number
  leaving?: 'left' | 'up' | 'miss'
}

const SPAWN_EVERY = 1.1
const FALL_SPEED = 18 // % of play area height per second
const SWIPE_MIN = 40

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** "Schlagzeilen-Swipe": swipe negative headlines left, amplify positive ones upwards. */
export function HeadlineSwipe({ quest, step }: StepViewProps<MinigameStep>) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro')
  const [, force] = useState(0)
  const game = useRef({
    cards: [] as Card[],
    time: step.durationSec,
    spawn: 0,
    score: 0,
    combo: 0,
    next: 0,
    deck: [] as Card[],
  })
  const pointer = useRef<{ x: number; y: number; card: number | null } | null>(null)

  useEffect(() => {
    if (phase !== 'play') return
    const pool = content.pools.find((p) => p.id === step.pool)?.entries ?? []
    const g = game.current
    g.deck = shuffle(pool).map((e, i) => ({
      id: i,
      key: e.key,
      negative: e.tag === 'negative',
      y: -12,
      x: 8 + Math.random() * 30,
    }))
    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      g.time -= dt
      g.spawn -= dt
      if (g.spawn <= 0 && g.time > 1.5) {
        g.spawn = SPAWN_EVERY
        const card = g.deck[g.next % g.deck.length]
        if (card) g.cards.push({ ...card, id: g.next, y: -12 })
        g.next++
      }
      for (const c of g.cards) {
        if (!c.leaving || c.leaving === 'miss') c.y += FALL_SPEED * dt
        if (!c.leaving && c.y > 92) {
          c.leaving = 'miss'
          if (c.negative) {
            g.combo = 0
            play('fail')
          }
        }
      }
      // Missed cards fall out of view; swiped cards are removed after their exit animation.
      g.cards = g.cards.filter((c) => !(c.leaving === 'miss' && c.y > 110))
      if (g.time <= 0) {
        setPhase('done')
        return
      }
      force((n) => n + 1)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  const judge = (cardId: number | null, dir: 'left' | 'up') => {
    const g = game.current
    const target =
      g.cards.find((c) => c.id === cardId && !c.leaving) ??
      [...g.cards].filter((c) => !c.leaving).sort((a, b) => b.y - a.y)[0]
    if (!target) return
    target.leaving = dir
    const correct = (dir === 'left') === target.negative
    if (correct) {
      g.combo += 1
      g.score += 1 + Math.floor(g.combo / 5)
      play('success')
      vibrate(6)
    } else {
      g.combo = 0
      play('fail')
      vibrate(30)
    }
    setTimeout(() => {
      g.cards = g.cards.filter((c) => c !== target)
    }, 250)
  }

  useEffect(() => {
    if (phase !== 'play') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') judge(null, 'left')
      if (e.key === 'ArrowUp') judge(null, 'up')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  const finish = () => dispatch((s) => finishMinigame(s, content, quest.id, game.current.score))
  const g = game.current

  return (
    <div class="modal-backdrop">
      <div class="modal swipe" role="dialog" aria-modal="true" aria-label={t(quest.titleKey)}>
        <div class="modal-title">🗞️ {t(quest.titleKey)}</div>
        {phase === 'intro' && (
          <>
            <p>{t('ui.swipe.help')}</p>
            <button type="button" class="btn btn-primary btn-big" onClick={() => setPhase('play')}>
              {t('ui.swipe.start')}
            </button>
          </>
        )}
        {phase === 'play' && (
          <>
            <div class="swipe-hud">
              <span>{t('ui.swipe.score', { score: g.score })}</span>
              <span class={g.combo >= 5 ? 'combo-hot' : ''}>
                {t('ui.swipe.combo', { combo: g.combo })}
              </span>
              <span>⏱ {Math.ceil(Math.max(0, g.time))} s</span>
            </div>
            <div
              class="swipe-area"
              onPointerDown={(e) => {
                const el = (e.target as HTMLElement).closest<HTMLElement>('[data-card]')
                pointer.current = {
                  x: e.clientX,
                  y: e.clientY,
                  card: el ? Number(el.dataset.card) : null,
                }
              }}
              onPointerUp={(e) => {
                const start = pointer.current
                pointer.current = null
                if (!start) return
                const dx = e.clientX - start.x
                const dy = e.clientY - start.y
                if (dx < -SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) judge(start.card, 'left')
                else if (dy < -SWIPE_MIN && Math.abs(dy) > Math.abs(dx)) judge(start.card, 'up')
              }}
            >
              {g.cards.map((c) => (
                <div
                  key={c.id}
                  data-card={c.id}
                  class={`headline ${c.leaving ? `headline-${c.leaving}` : ''}`}
                  style={{ top: `${c.y}%`, left: `${c.x}%` }}
                >
                  {t(c.key)}
                </div>
              ))}
            </div>
            <div class="row">
              <button type="button" class="btn btn-choice" onClick={() => judge(null, 'left')}>
                {t('ui.swipe.left')}
              </button>
              <button type="button" class="btn btn-choice" onClick={() => judge(null, 'up')}>
                {t('ui.swipe.up')}
              </button>
            </div>
          </>
        )}
        {phase === 'done' && (
          <>
            <p class="swipe-result">{t('ui.swipe.result', { score: g.score })}</p>
            <button type="button" class="btn btn-primary btn-big" onClick={finish}>
              {t('ui.swipe.finish')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
