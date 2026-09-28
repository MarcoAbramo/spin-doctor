import { currentStep } from '@spin-doctor/shared'
import { content } from '../content'
import { t } from '../i18n'
import { useGame } from './hooks'

/** Shows the current objective of the first active story/side quest. */
export function ObjectiveBar() {
  const state = useGame()
  for (const active of state.quests.active) {
    const step = currentStep(content, active)
    if (step?.type === 'objective') {
      return (
        <div class="objective" role="status">
          <span class="objective-text">
            <span class="objective-tag">{t('ui.hud.objective')}</span> {t(step.textKey)}
          </span>
        </div>
      )
    }
  }
  if (state.counters.statements === undefined)
    return (
      <div class="objective objective-hint" role="status">
        <span class="objective-text">{t('ui.tapHint')}</span>
      </div>
    )
  return null
}
