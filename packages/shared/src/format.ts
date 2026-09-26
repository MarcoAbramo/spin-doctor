/**
 * German number formatting for idle-game sized numbers:
 * 999 → "999", 12.345 → "12.345", 1.2e6 → "1,2 Mio.", then Mrd., Bio., Brd.,
 * and beyond that letter suffixes a, b, … z, aa, ab …
 * (Switching to a big-number library is tracked as an issue.)
 */
const NAMED = ['Mio.', 'Mrd.', 'Bio.', 'Brd.'] as const

function letters(index: number): string {
  let n = index
  let out = ''
  do {
    out = String.fromCharCode(97 + (n % 26)) + out
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return out
}

const de = (n: number, digits: number) =>
  n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: digits })

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '∞'
  if (value < 0) return `-${formatNumber(-value)}`
  if (value < 10) return de(Math.floor(value * 10) / 10, 1)
  if (value < 1e6) return de(Math.floor(value), 0)
  const exp = Math.floor(Math.log10(value) / 3) // 2 = millions
  const scaled = value / 10 ** (exp * 3)
  const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0
  const truncated = Math.floor(scaled * 10 ** digits) / 10 ** digits
  const suffix = exp - 2 < NAMED.length ? NAMED[exp - 2] : letters(exp - 2 - NAMED.length)
  return `${de(truncated, digits)} ${suffix}`
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h} h ${m} min`
  if (m > 0) return `${m} min`
  return `${s} s`
}
