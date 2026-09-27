import { acknowledgeEnding, type Step } from '@spin-doctor/shared'
import { content } from '../../content'
import { t } from '../../i18n'
import { dispatch } from '../../store'
import type { StepViewProps } from './types'

type EndingStep = Extract<Step, { type: 'ending' }>

/** An ending screen (election night & co.). */
export function EndingView({ quest, step }: StepViewProps<EndingStep>) {
  return (
    <div class="modal-backdrop">
      <div class="modal ending" role="dialog" aria-modal="true" aria-label={t(step.titleKey)}>
        <div class="ending-title">{t(step.titleKey)}</div>
        {step.lines.map((l) => (
          <p key={l}>{t(l)}</p>
        ))}
        <button
          type="button"
          class="btn btn-primary btn-big"
          onClick={() => dispatch((s) => acknowledgeEnding(s, content, quest.id))}
        >
          {t('ui.dialog.continue')}
        </button>
      </div>
    </div>
  )
}
