import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type Content, loadContent, type RawPack } from '../src/content'

export const contentDir = fileURLToPath(new URL('../content', import.meta.url))
export const localesDir = fileURLToPath(new URL('../locales', import.meta.url))

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : name.endsWith('.json') ? [path] : []
  })
}

/** Node-side loader (tests, validation, server). The client uses `import.meta.glob`. */
export function readPacks(dir = contentDir): RawPack[] {
  return walk(dir).map((path) => ({
    source: relative(dir, path),
    data: JSON.parse(readFileSync(path, 'utf8')),
  }))
}

export function loadContentFromDisk(dir = contentDir): Content {
  return loadContent(readPacks(dir))
}

export function readLocale(lang: string): Record<string, string> {
  return JSON.parse(readFileSync(join(localesDir, `${lang}.json`), 'utf8'))
}
