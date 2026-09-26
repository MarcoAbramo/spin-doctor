import { baseTexts, content } from './content'

const texts: Record<string, string> = { ...baseTexts, ...content.i18n.de }

/** Translates `key`, replacing `{name}` placeholders. Missing keys render as the key itself. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const text = texts[key] ?? key
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
}

export function has(key: string): boolean {
  return key in texts
}
