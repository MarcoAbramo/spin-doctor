import { useEffect, useState } from 'preact/hooks'
import { dismissToast, getToasts, subscribeToasts } from './toast-store'

export function Toasts() {
  const [, force] = useState(0)
  useEffect(() => subscribeToasts(() => force((n) => n + 1)), [])
  return (
    <div class="toasts" aria-live="polite">
      {getToasts().map((toast) => (
        <div key={toast.id} class={`toast toast-${toast.tone}`}>
          <span>{toast.text}</span>
          {toast.action && (
            <button type="button" class="btn btn-small" onClick={toast.action.run}>
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            class="toast-close"
            aria-label="×"
            onClick={() => dismissToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
