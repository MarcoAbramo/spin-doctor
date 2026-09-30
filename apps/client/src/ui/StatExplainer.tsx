import { focusedQuest, markExplained, nextStatToExplain } from '@spin-doctor/shared'
import { useEffect, useState } from 'preact/hooks'
import { content } from '../content'
import { t } from '../i18n'
import { dispatch } from '../store'
import { AssetIcon } from './AssetIcon'
import { useGame } from './hooks'

let opened: string | null = null
const listeners = new Set<() => void>()

/** Shows the explanation of one HUD value (tapping a value in the HUD). */
export function explainStat(id: string | null): void {
  opened = id
  for (const l of listeners) l()
}

/**
 * „Kurz erklärt“: a small card below the HUD. It introduces every HUD value once,
 * when it first appears and no dialog is open, and on demand when a value is tapped.
 * It does not block the scene, so you can keep tapping.
 */
export function StatExplainer() {
  const state = useGame()
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => listeners.delete(l)
  }, [])
  const auto = focusedQuest(state, content) ? null : nextStatToExplain(state, content)
  const id = opened ?? auto
  const stat = content.stats.find((s) => s.id === id)
  if (!stat) return null
  const close = () => {
    if (opened) explainStat(null)
    dispatch((s) => markExplained(s, stat.id))
  }
  return (
    <div class="explain" role="dialog" aria-label={t('ui.explain.title')}>
      <div class="explain-title">
        <AssetIcon class="chip-icon" path={`icons/stat-${stat.id}.png`} emoji={stat.emoji ?? ''} />
        {t('ui.explain.title')}: {t(`stat.${stat.id}.name`)}
      </div>
      <p class="explain-body">{t(`stat.${stat.id}.desc`)}</p>
      {!opened && stat.role === 'currency' && <p class="card-meta">{t('ui.explain.hint')}</p>}
      <button type="button" class="btn btn-small" onClick={close}>
        {t('ui.explain.ok')}
      </button>
    </div>
  )
}
