import { finishMinigame, type Step } from '@spin-doctor/shared'
import { useEffect, useRef, useState } from 'preact/hooks'
import { content } from '../../content'
import { t } from '../../i18n'
import { play, vibrate } from '../../juice/audio'
import { dispatch } from '../../store'
import type { StepViewProps } from './types'

type MinigameStep = Extract<Step, { type: 'minigame' }>

interface Country {
  key: string
  ally: boolean
  /** Seconds until the highlight ends (0 = not lit). */
  lit: number
  struck: boolean
  shape: number
}

const LIGHT_EVERY = 0.85
const LIGHT_FOR = 1.7
/** Blobby "country" outlines as clip-path polygons (pixel-ish steps). */
const SHAPES = [
  'polygon(8% 20%, 40% 4%, 78% 12%, 96% 40%, 88% 80%, 52% 96%, 14% 86%, 2% 50%)',
  'polygon(14% 6%, 62% 2%, 92% 24%, 84% 58%, 96% 90%, 46% 94%, 10% 76%, 4% 34%)',
  'polygon(4% 14%, 30% 2%, 58% 18%, 94% 8%, 90% 62%, 70% 96%, 26% 88%, 8% 56%)',
  'polygon(20% 4%, 88% 10%, 98% 46%, 76% 70%, 84% 96%, 30% 90%, 2% 62%, 10% 28%)',
]

/** „Zoll-Tafel“: strike lit countries with the record marker, never hit allies. */
export function ZollTafel({ quest, step }: StepViewProps<MinigameStep>) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro')
  const [, force] = useState(0)
  const game = useRef({
    countries: [] as Country[],
    time: step.durationSec,
    next: 0,
    score: 0,
    combo: 0,
  })
  const g = game.current

  useEffect(() => {
    if (phase !== 'play') return
    const pool = content.pools.find((p) => p.id === step.pool)?.entries ?? []
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 12)
    g.countries = shuffled.map((e, i) => ({
      key: e.key,
      ally: e.tag === 'ally',
      lit: 0,
      struck: false,
      shape: i % SHAPES.length,
    }))
    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      g.time -= dt
      g.next -= dt
      for (const c of g.countries) {
        if (c.lit > 0) {
          c.lit -= dt
          if (c.lit <= 0 && !c.ally && !c.struck) g.combo = 0 // missed a target
        }
      }
      if (g.next <= 0 && g.time > 0.5) {
        g.next = LIGHT_EVERY * (0.7 + Math.random() * 0.6)
        const idle = g.countries.filter((c) => c.lit <= 0 && !c.struck)
        const pick = idle[Math.floor(Math.random() * idle.length)]
        if (pick) pick.lit = LIGHT_FOR
        // Struck countries recover slowly so the board never runs out.
        const struck = g.countries.filter((c) => c.struck)
        if (struck.length > 6) struck[0]!.struck = false
      }
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

  const hit = (c: Country) => {
    if (c.lit <= 0 || c.struck) return
    c.lit = 0
    if (c.ally) {
      g.combo = 0
      g.score = Math.max(0, g.score - 2)
      play('fail')
      vibrate(40)
      return
    }
    c.struck = true
    g.combo += 1
    g.score += 1 + Math.floor(g.combo / 4)
    play('success')
    vibrate(8)
  }

  return (
    <div class="modal-backdrop">
      <div class="modal zoll" role="dialog" aria-modal="true" aria-label={t(quest.titleKey)}>
        <div class="modal-title">🖊️ {t(quest.titleKey)}</div>
        {phase === 'intro' && (
          <>
            <p>{t('ui.zoll.help')}</p>
            <button type="button" class="btn btn-primary btn-big" onClick={() => setPhase('play')}>
              {t('ui.swipe.start')}
            </button>
          </>
        )}
        {phase === 'play' && (
          <>
            <div class="swipe-hud">
              <span>{t('ui.swipe.score', { score: g.score })}</span>
              <span class={g.combo >= 4 ? 'combo-hot' : ''}>
                {t('ui.swipe.combo', { combo: g.combo })}
              </span>
              <span>⏱ {Math.ceil(Math.max(0, g.time))} s</span>
            </div>
            <div class="zoll-board">
              <div class="zoll-title">{t('ui.zoll.board')}</div>
              <div class="zoll-grid">
                {g.countries.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    class={`zoll-country ${c.ally ? 'zoll-ally' : ''} ${c.lit > 0 ? 'zoll-lit' : ''} ${c.struck ? 'zoll-struck' : ''}`}
                    onPointerDown={(e) => {
                      e.preventDefault()
                      hit(c)
                    }}
                  >
                    <span class="zoll-shape" style={{ clipPath: SHAPES[c.shape] }} />
                    <span class="zoll-name">{t(c.key)}</span>
                    {c.struck && <span class="zoll-stamp">{t('ui.zoll.hit')}</span>}
                    {c.ally && c.lit > 0 && <span class="zoll-friend">{t('ui.zoll.ally')}</span>}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {phase === 'done' && (
          <>
            <p class="swipe-result">{t('ui.swipe.result', { score: g.score })}</p>
            <button
              type="button"
              class="btn btn-primary btn-big"
              onClick={() => dispatch((s) => finishMinigame(s, content, quest.id, g.score))}
            >
              {t('ui.swipe.finish')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
