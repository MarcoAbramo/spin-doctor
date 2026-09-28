import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests on phone-sized screens against the production build (`vite preview`).
 * Run: `pnpm --filter @spin-doctor/client build && pnpm --filter @spin-doctor/client e2e`.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    // The PWA service worker would cache between tests.
    serviceWorkers: 'block',
    // Instant dialog text and transitions keep the runs short (the game honours it).
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
    {
      name: 'small-phone',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 360, height: 640 },
      },
    },
    { name: 'landscape', use: { ...devices['Pixel 7 landscape'] } },
  ],
  webServer: process.env.E2E_SERVE_DIST
    ? undefined
    : {
        command: 'pnpm exec vite preview --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
      },
})
