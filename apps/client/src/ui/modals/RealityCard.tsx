import type { RealityCheckDef } from '@spin-doctor/shared'
import { useEffect, useState } from 'preact/hooks'
import { content } from '../../content'
import { t } from '../../i18n'

let openId: string | null = null
const listeners = new Set<() => void>()

/** Opens the „Realitäts-Check“ popup for one card (e.g. from a toast). */
export function openReality(id: string | null): void {
  openId = id
  for (const l of listeners) l()
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

/** Body of a card: episode, neutral summary, sources. Shared by the list and the popup. */
export function RealityBody({ card }: { card: RealityCheckDef }) {
  return (
    <>
      <div class="card-meta">
        🎮 {t('ui.reality.episode')}: {t(`reality.${card.id}.episode`)}
      </div>
      <p class="lexicon-body">{t(`reality.${card.id}.body`)}</p>
      <div class="card-meta">{t('ui.reality.sources')}:</div>
      <ul class="reality-sources">
        {card.sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.outlet}: „{s.title}“
            </a>{' '}
            <span class="card-meta">({formatDate(s.date)})</span>
          </li>
        ))}
      </ul>
      {!card.factChecked && <div class="card-meta">⚠️ {t('ui.reality.unchecked')}</div>}
    </>
  )
}

export function RealityModal() {
  const [, force] = useState(0)
  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    return () => listeners.delete(l)
  }, [])
  const card = content.realityChecks.find((c) => c.id === openId)
  if (!card) return null
  const close = () => openReality(null)
  return (
    <div class="modal-backdrop modal-backdrop-light" onClick={close}>
      <div
        class="modal reality-card"
        role="dialog"
        aria-modal="true"
        aria-label={t(`reality.${card.id}.title`)}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-title">📰 {t(`reality.${card.id}.title`)}</div>
        <RealityBody card={card} />
        <p class="card-flavor">{t('ui.reality.disclaimer')}</p>
        <button type="button" class="btn" onClick={close}>
          ✕
        </button>
      </div>
    </div>
  )
}
