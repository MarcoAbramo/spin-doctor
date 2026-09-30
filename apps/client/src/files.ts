/**
 * Hands a text file to the player: the share sheet on phones (save to Files, send to
 * yourself …), a normal download elsewhere.
 */
export async function offerTextFile(name: string, text: string): Promise<void> {
  const file = new File([text], name, { type: 'text/plain' })
  const touch = window.matchMedia('(pointer: coarse)').matches
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
      return
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return
      // Sharing failed for another reason: fall back to a download.
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Lets the player pick a text file and returns its content (null if cancelled). */
export function pickTextFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,text/plain'
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (file) void file.text().then(resolve, () => resolve(null))
      else resolve(null)
    })
    input.addEventListener('cancel', () => resolve(null))
    input.click()
  })
}

/** `spin-doctor-2026-09-28.txt` */
export function saveFileName(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `spin-doctor-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.txt`
}
