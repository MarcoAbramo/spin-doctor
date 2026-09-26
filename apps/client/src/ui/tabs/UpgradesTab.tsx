import { buyUpgrade, check, formatNumber } from '@spin-doctor/shared'
import { content } from '../../content'
import { t } from '../../i18n'
import { play, vibrate } from '../../juice/audio'
import { dispatch } from '../../store'
import { describeEffects } from '../describe'
import { useGame } from '../hooks'

export function UpgradesTab() {
  const state = useGame()
  const spin = state.stats[content.currency] ?? 0
  const available = content.upgrades.filter(
    (u) => !state.upgrades.includes(u.id) && check(state, content, u.unlock),
  )
  const bought = content.upgrades.filter((u) => state.upgrades.includes(u.id))
  return (
    <div>
      {available.length === 0 && <p class="empty">{t('ui.upgrade.empty')}</p>}
      <ul class="list">
        {available.map((u) => (
          <li class={`card ${u.dark ? 'card-dark' : ''}`} key={u.id}>
            <div class="card-icon" aria-hidden="true">
              {u.emoji ?? '⬆️'}
            </div>
            <div class="card-body">
              <div class="card-title">{t(`upgrade.${u.id}.name`)}</div>
              <div class="card-flavor">{t(`upgrade.${u.id}.desc`)}</div>
              <ul class="effects">
                {describeEffects(u.effects).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              class="btn btn-buy"
              disabled={spin < u.cost}
              onClick={() => {
                dispatch((s) => buyUpgrade(s, content, u.id))
                play('upgrade')
                vibrate(15)
              }}
            >
              <span class="btn-sub">{t('ui.buy')}</span>
              {formatNumber(u.cost)}
            </button>
          </li>
        ))}
      </ul>
      {bought.length > 0 && (
        <details class="bought">
          <summary>
            {t('ui.upgrade.bought')} ({bought.length})
          </summary>
          <ul>
            {bought.map((u) => (
              <li key={u.id}>
                {u.emoji} {t(`upgrade.${u.id}.name`)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
