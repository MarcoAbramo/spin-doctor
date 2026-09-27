import {
  activeTraits,
  formatDuration,
  formatNumber,
  getLocation,
  isLocationUnlocked,
  locationRate,
  tillCap,
} from '@spin-doctor/shared'
import { content } from '../../content'
import { t } from '../../i18n'
import type { Building } from '../../scene/map'
import { useGame } from '../hooks'
import { locationName } from '../SceneView'

/** Info card for a building on the map: till, rate, news situation, "go there". */
export function LocationCard({
  building,
  onClose,
  onGo,
}: {
  building: Building
  onClose: () => void
  onGo: () => void
}) {
  const state = useGame()
  const id = building.location
  const exists = content.locations.some((l) => l.id === id)
  const unlocked = exists && isLocationUnlocked(state, content, id)
  const here = state.location === id
  const loc = exists ? getLocation(content, id) : null
  const ls = state.locations[id]
  const till = ls?.till[content.currency] ?? 0
  const cap = exists ? tillCap(state, content, id) : 0
  const since = ls?.producedSinceVisit[content.currency] ?? 0
  const away = ls ? Math.max(0, (state.now - ls.lastVisitAt) / 1000) : 0
  const mods = state.modifiers.filter(
    (m) => m.until > state.now && m.effects.some((e) => e.target === `location:${id}`),
  )
  const traits = exists ? activeTraits(state, content, id) : []

  return (
    <div class="modal-backdrop modal-backdrop-light" onClick={onClose}>
      <div
        class="modal location-card"
        role="dialog"
        aria-modal="true"
        aria-label={locationName(id)}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-title">
          {loc?.emoji ?? '🏛️'} {locationName(id)}
        </div>
        {!exists && <p class="card-flavor">🚧 {t('ui.map.comingSoon')}</p>}
        {exists && !unlocked && <p class="card-flavor">🔒 {t('ui.map.unlockHint')}</p>}
        {unlocked && (
          <div class="location-stats">
            <div>
              {t('ui.map.rate', {
                value: formatNumber(locationRate(state, content, id, content.currency) * 60),
              })}
            </div>
            {here ? (
              <div>
                📍 {t('ui.map.here')} · {t('ui.map.sinceHere', { value: formatNumber(since) })}
              </div>
            ) : (
              <>
                <div>
                  💰 {t('ui.map.till')}:{' '}
                  {t('ui.map.tillOf', { value: formatNumber(till), cap: formatNumber(cap) })}
                </div>
                <progress max={Math.max(cap, 1)} value={till} />
                <div class="card-meta">
                  {t('ui.map.since', { time: formatDuration(away), value: formatNumber(since) })}
                </div>
              </>
            )}
            {(mods.length > 0 || traits.length > 0) && (
              <div class="location-mods">
                <b>{t('ui.map.modifiers')}:</b>
                {mods.map((m) => (
                  <span class="chip" key={m.id}>
                    {t(m.labelKey)} · {formatDuration((m.until - state.now) / 1000)}
                  </span>
                ))}
                {traits.map((tr) => (
                  <span class="chip" key={tr.id}>
                    {t(tr.labelKey)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        <div class="row">
          <button type="button" class="btn btn-ghost" onClick={onClose}>
            ✕
          </button>
          {unlocked && (
            <button type="button" class="btn" onClick={onGo}>
              🚶 {here ? t('ui.map.enter') : t('ui.map.go')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
