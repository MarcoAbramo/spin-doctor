import { encodeSave } from '@spin-doctor/shared'
import { Component, type ComponentChildren } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { offerTextFile, saveFileName } from '../files'
import { t } from '../i18n'
import { crash, onCrash, storedSave } from '../store'

/** Turns render errors into a crash (instead of a blank page). */
export class ErrorBoundary extends Component<{ children: ComponentChildren }, { failed: boolean }> {
  override state = { failed: false }
  override componentDidCatch(error: unknown): void {
    crash(error)
    this.setState({ failed: true })
  }
  override render() {
    return this.state.failed ? null : this.props.children
  }
}

/** The game stopped: offer a reload and the save from before the error as a file. */
export function CrashScreen() {
  const [error, setError] = useState<unknown>(null)
  useEffect(() => onCrash(setError), [])
  if (!error) return null
  const save = storedSave()
  const message = error instanceof Error ? error.message : String(error)
  return (
    <div class="crash" role="alertdialog" aria-modal="true" aria-labelledby="crash-title">
      <div class="modal">
        <div class="modal-title" id="crash-title">
          {t('ui.crash.title')}
        </div>
        <p class="crash-text">{t('ui.crash.text')}</p>
        <code class="crash-error">{message}</code>
        <div class="row wrap">
          <button type="button" class="btn btn-primary" onClick={() => location.reload()}>
            {t('ui.crash.reload')}
          </button>
          {save && (
            <button
              type="button"
              class="btn"
              onClick={() => void offerTextFile(saveFileName(), encodeSave(save))}
            >
              {t('ui.crash.saveFile')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
