import { readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test as base } from '@playwright/test'

const DIST = fileURLToPath(new URL('../dist', import.meta.url))
const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
}

function file(path: string): string {
  const candidate = join(DIST, decodeURIComponent(path))
  try {
    if (statSync(candidate).isFile()) return candidate
  } catch {
    // SPA fallback below
  }
  return join(DIST, 'index.html')
}

/**
 * With E2E_SERVE_DIST=1 the build is served straight from disk through Playwright's
 * router instead of `vite preview` — for machines whose flaky network connection makes
 * Chrome abort localhost requests. CI uses the real preview server.
 */
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    if (process.env.E2E_SERVE_DIST)
      await context.route(`${baseURL}/**`, (route) => {
        const path = file(new URL(route.request().url()).pathname)
        return route.fulfill({
          body: readFileSync(path),
          contentType: TYPES[extname(path)] ?? 'application/octet-stream',
        })
      })
    await use(context)
  },
})

export { expect } from '@playwright/test'
