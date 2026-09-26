import { resolveTimed, type Step } from '@spin-doctor/shared'
import { content } from '../../content'
import { t } from '../../i18n'
import { play, vibrate } from '../../juice/audio'
import { dispatch, getState } from '../../store'
import { useGame } from '../hooks'
import type { StepViewProps } from './types'

type TimedStep = Extract<Step, { type: 'timed' }>

/** "Der Präsident hat gepostet": a phone slides in; tap "Einordnen" within the time limit. */
export function PresidentPost({ quest, active, step }: StepViewProps<TimedStep>) {
  const state = useGame()
  const total = step.timeoutSec * 1000
  const remaining = Math.max(0, total - (state.now - active.stepStartedAt))
  const resolve = (success: boolean) => {
    const before = getState().counters.scandals ?? 0
    dispatch((s) => resolveTimed(s, content, quest.id, success))
    if (success && (getState().counters.scandals ?? 0) === before) {
      play('success')
      vibrate(10)
    } else play('fail')
  }
  return (
    <div class="modal-backdrop modal-backdrop-light">
      <div class="phone" role="alertdialog" aria-modal="true" aria-label={t('ui.post.header')}>
        <div class="phone-notch" />
        <div class="phone-header">🔔 {t('ui.post.header')}</div>
        <div class="post">
          <div class="post-author">
            <span class="post-avatar" aria-hidden="true">
              👑
            </span>
            <div>
              <b>{t('speaker.president')}</b>
              <div class="post-handle">@MagnusRekord · jetzt</div>
            </div>
          </div>
          <p class="post-text">{active.entry ? t(active.entry) : ''}</p>
        </div>
        <div class="countdown" aria-hidden="true">
          <div class="countdown-fill" style={{ animationDuration: `${remaining}ms` }} />
        </div>
        <div class="countdown-label">{Math.ceil(remaining / 1000)} s</div>
        <button type="button" class="btn btn-primary btn-big" onClick={() => resolve(true)}>
          {t('ui.post.handle')}
        </button>
        <button type="button" class="btn btn-ghost" onClick={() => resolve(false)}>
          {t('ui.post.ignore')}
        </button>
      </div>
    </div>
  )
}
