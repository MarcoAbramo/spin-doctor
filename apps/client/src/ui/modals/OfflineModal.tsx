import { formatDuration, formatNumber, type OfflineReport } from '@spin-doctor/shared'
import { useEffect, useState } from 'preact/hooks'
import { t } from '../../i18n'
import { play } from '../../juice/audio'
import { takeOfflineReport } from '../../store'
import { useGame } from '../hooks'

export function OfflineModal() {
  useGame()
  const [report, setReport] = useState<OfflineReport | null>(null)
  // The store keeps the report until someone takes it; check after every render.
  useEffect(() => {
    const fresh = takeOfflineReport()
    if (fresh) setReport(fresh)
  })
  if (!report) return null
  return (
    <div class="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-label={t('ui.offline.title')}>
        <div class="modal-title">📰 {t('ui.offline.title')}</div>
        <p>
          {t('ui.offline.body', {
            time: formatDuration(report.seconds),
            posts: report.posts,
            spin: formatNumber(report.gained),
          })}
        </p>
        {report.capped && <p class="card-meta">{t('ui.offline.capped')}</p>}
        <button
          type="button"
          class="btn btn-primary btn-big"
          onClick={() => {
            play('milestone')
            setReport(null)
          }}
        >
          {t('ui.offline.ok')}
        </button>
      </div>
    </div>
  )
}
