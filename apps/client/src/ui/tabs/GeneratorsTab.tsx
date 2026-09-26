import {
  buyGenerator,
  formatNumber,
  generatorCost,
  generatorRate,
  generatorsAt,
  isGeneratorMaxed,
  isGeneratorVisible,
  locationFactor,
} from '@spin-doctor/shared'
import { content } from '../../content'
import { t } from '../../i18n'
import { play, vibrate } from '../../juice/audio'
import { dispatch } from '../../store'
import { AssetIcon } from '../AssetIcon'
import { useGame } from '../hooks'

function statEmoji(id: string): string {
  return content.stats.find((s) => s.id === id)?.emoji ?? id
}

export function GeneratorsTab() {
  const state = useGame()
  // Only the current location's shop; everything scales with the location's factor.
  const here = generatorsAt(content, state.location)
  const factor = locationFactor(state, content, state.location)
  const visible = here.filter((g) => isGeneratorVisible(state, content, g))
  const teaser = here.find((g) => !isGeneratorVisible(state, content, g))
  return (
    <ul class="list">
      {visible.map((g) => {
        const owned = state.generators[g.id] ?? 0
        const cost = generatorCost(g, owned)
        const maxed = isGeneratorMaxed(state, g)
        const affordable = (state.stats[g.costStat] ?? 0) >= cost
        const costIcon = g.costStat === content.currency ? '' : `${statEmoji(g.costStat)} `
        const next = g.milestones.find((m) => m > owned)
        const perUnit = owned
          ? (generatorRate(state, content, g) / owned) * factor
          : g.rate * factor
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
                {g.produces === content.currency ? '' : `${statEmoji(g.produces)} `}
                {t('ui.rate', { value: formatNumber(perUnit) })}
                {next !== undefined && ` · ${t('ui.nextMilestone', { count: next })}`}
              </div>
            </div>
            <button
              type="button"
              class="btn btn-buy"
              disabled={maxed || !affordable}
              onClick={() => {
                dispatch((s) => buyGenerator(s, content, g.id))
                play('buy')
                vibrate(12)
              }}
            >
              {maxed ? (
                t('ui.maxed')
              ) : (
                <>
                  <span class="btn-sub">{t('ui.buy')}</span>
                  {costIcon}
                  {formatNumber(cost)}
                </>
              )}
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
