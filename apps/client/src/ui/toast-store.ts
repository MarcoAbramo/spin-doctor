export interface Toast {
  id: number
  text: string
  tone: 'info' | 'good' | 'bad'
  action?: { label: string; run: () => void }
}

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

export function pushToast(
  text: string,
  tone: Toast['tone'] = 'info',
  action?: Toast['action'],
): void {
  const toast: Toast = { id: nextId++, text, tone, ...(action ? { action } : {}) }
  toasts = [...toasts.slice(-1), toast]
  for (const l of listeners) l()
  if (!action) setTimeout(() => dismissToast(toast.id), 2600)
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
