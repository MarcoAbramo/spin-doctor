import {
  addStat,
  debugStartQuest,
  draft,
  exportSave,
  importSave,
  updateSettings,
} from '@spin-doctor/shared'
import { useState } from 'preact/hooks'
import { content } from '../../content'
import { t } from '../../i18n'
import { dispatch, replaceState, resetGame } from '../../store'
import { useGame } from '../hooks'
import { pushToast } from '../toast-store'

const DEBUG = new URLSearchParams(location.search).has('debug') || import.meta.env.DEV

export function SettingsTab() {
  const state = useGame()
  const [code, setCode] = useState('')

  const toggle = (key: 'sound' | 'vibration' | 'reducedMotion') => (
    <label class="toggle">
      <input
        type="checkbox"
        checked={state.settings[key]}
        onChange={(e) =>
          dispatch((s) => updateSettings(s, { [key]: (e.target as HTMLInputElement).checked }))
        }
      />
      <span>{t(`ui.settings.${key}`)}</span>
    </label>
  )

  return (
    <div class="settings">
      <label class="field">
        <span>{t('ui.settings.name')}</span>
        <input
          type="text"
          maxLength={40}
          value={state.playerName}
          placeholder={t('ui.settings.namePlaceholder')}
          onChange={(e) =>
            dispatch((s) => updateSettings(s, { playerName: (e.target as HTMLInputElement).value }))
          }
        />
      </label>
      {toggle('sound')}
      {toggle('vibration')}
      {toggle('reducedMotion')}

      <h2>{t('ui.settings.save')}</h2>
      <div class="row">
        <button
          type="button"
          class="btn"
          onClick={() => {
            const saveCode = exportSave(state)
            setCode(saveCode)
            void navigator.clipboard?.writeText(saveCode).then(
              () => pushToast(t('ui.settings.copied'), 'good'),
              () => undefined,
            )
          }}
        >
          {t('ui.settings.export')}
        </button>
        <button
          type="button"
          class="btn"
          disabled={!code.trim()}
          onClick={() => {
            try {
              replaceState(importSave(code, content))
              pushToast(t('ui.settings.importOk'), 'good')
            } catch (err) {
              pushToast(t('ui.settings.importError', { error: (err as Error).message }), 'bad')
            }
          }}
        >
          {t('ui.settings.import')}
        </button>
      </div>
      <textarea
        class="code"
        rows={3}
        value={code}
        placeholder={t('ui.settings.importPlaceholder')}
        onInput={(e) => setCode((e.target as HTMLTextAreaElement).value)}
      />
      <button
        type="button"
        class="btn btn-danger"
        onClick={() => {
          if (confirm(t('ui.settings.resetConfirm'))) resetGame()
        }}
      >
        {t('ui.settings.reset')}
      </button>

      {DEBUG && (
        <>
          <h2>{t('ui.settings.debug')}</h2>
          <div class="row wrap">
            <button
              type="button"
              class="btn btn-small"
              onClick={() =>
                dispatch((s) => {
                  const d = draft(s)
                  addStat(d, content, content.currency, 1_000_000)
                  return d
                })
              }
            >
              +1 Mio. Spin
            </button>
            {content.quests.map((q) => (
              <button
                key={q.id}
                type="button"
                class="btn btn-small"
                onClick={() => dispatch((s) => debugStartQuest(s, content, q.id))}
              >
                ▶ {q.id}
              </button>
            ))}
            <button
              type="button"
              class="btn btn-small"
              onClick={() => replaceState({ ...state, now: state.now - 3 * 3600_000 })}
            >
              −3 h (Offline-Test, dann Tab wechseln)
            </button>
          </div>
        </>
      )}

      <p class="about">{t('ui.settings.about')}</p>
      <p class="about">
        <a
          href="https://github.com/MarcoAbramo/spin-doctor"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('ui.settings.source')}
        </a>
      </p>
    </div>
  )
}
