export interface Toast {
  id: number
  text: string
  tone: 'info' | 'good' | 'bad'
  action?: { label: string; run: () => void }
  /** Important news (e.g. a damaged save): not pushed out by later toasts, shown longer. */
  sticky?: boolean
}

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

export function pushToast(
  text: string,
  tone: Toast['tone'] = 'info',
  action?: Toast['action'],
  { sticky = false } = {},
): void {
  const toast: Toast = { id: nextId++, text, tone, sticky, ...(action ? { action } : {}) }
  const pinned = toasts.filter((t) => t.sticky)
  toasts = [...pinned, ...toasts.filter((t) => !t.sticky).slice(-1), toast]
  for (const l of listeners) l()
  setTimeout(() => dismissToast(toast.id), sticky ? 20_000 : action ? 7000 : 2600)
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id)
  for (const l of listeners) l()
}

export function getToasts(): Toast[] {
  return toasts
}

export function subscribeToasts(l: () => void): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}
