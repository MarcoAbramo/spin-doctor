import {
  buyGenerator,
  formatNumber,
  generatorCost,
  generatorRate,
  isGeneratorVisible,
  multiplier,
  statProductionMultiplier,
} from '@spin-doctor/shared'
import { content } from '../../content'
import { t } from '../../i18n'
import { play, vibrate } from '../../juice/audio'
import { dispatch } from '../../store'
import { AssetIcon } from '../AssetIcon'
import { useGame } from '../hooks'

export function GeneratorsTab() {
  const state = useGame()
  const spin = state.stats[content.currency] ?? 0
  const global = multiplier(state, content, 'production') * statProductionMultiplier(state, content)
  const visible = content.generators.filter((g) => isGeneratorVisible(state, content, g))
  const teaser = content.generators.find((g) => !isGeneratorVisible(state, content, g))
  return (
    <ul class="list">
      {visible.map((g) => {
        const owned = state.generators[g.id] ?? 0
        const cost = generatorCost(g, owned)
        const next = g.milestones.find((m) => m > owned)
        const perUnit = owned
          ? (generatorRate(state, content, g) / owned) * global
          : g.rate * global
        return (
          <li class="card" key={g.id}>
            <AssetIcon path={`icons/generator-${g.id}.png`} emoji={g.emoji ?? '⭐'} />
            <div class="card-body">
              <div class="card-title">
                {t(`generator.${g.id}.name`)}{' '}
                <span class="badge">{t('ui.owned', { count: owned })}</span>
              </div>
              <div class="card-flavor">{t(`generator.${g.id}.flavor`)}</div>
              <div class="card-meta">
                {t('ui.rate', { value: formatNumber(perUnit) })}
                {next !== undefined && ` · ${t('ui.nextMilestone', { count: next })}`}
              </div>
            </div>
            <button
              type="button"
              class="btn btn-buy"
              disabled={spin < cost}
              onClick={() => {
                dispatch((s) => buyGenerator(s, content, g.id))
                play('buy')
                vibrate(12)
              }}
            >
              <span class="btn-sub">{t('ui.buy')}</span>
              {formatNumber(cost)}
            </button>
          </li>
        )
      })}
      {teaser && (
        <li class="card card-locked">
          <div class="card-icon" aria-hidden="true">
            🔒
          </div>
          <div class="card-body card-flavor">{t('ui.locked')}</div>
        </li>
      )}
    </ul>
  )
}
