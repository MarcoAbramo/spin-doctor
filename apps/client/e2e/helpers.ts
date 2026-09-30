import type { Page } from '@playwright/test'
import { createInitialState, serialize } from '@spin-doctor/shared'
import { loadContentFromDisk } from '../../../packages/shared/scripts/load-content'

export const content = loadContentFromDisk()

/**
 * A mid-game save at `location`: every story quest done (no dialogs), the map open,
 * every HUD value explained and plenty of each generator, so the rooms are full.
 */
export function midGameSave(
  location: string,
  { spin = 1e6, generators = 40, tapHint = false } = {},
): string {
  const now = Date.now()
  const s = createInitialState(content, now, 1234)
  s.location = location
  for (const g of content.generators) s.generators[g.id] = Math.min(generators, g.maxCount ?? 1e9)
  s.stats[content.currency] = spin
  s.flags.push('debug-map', ...content.stats.map((x) => `explained-${x.id}`))
  s.quests.completed = content.quests.filter((q) => q.trigger.type === 'auto').map((q) => q.id)
  s.quests.active = []
  for (const q of content.quests)
    if (q.trigger.type === 'random') s.quests.schedule[q.id] = now + 1e9
  // Without statements the objective bar shows the tap hint.
  if (!tapHint) s.counters.statements = 5
  s.counters['map-opened'] = 1
  return serialize(s)
}

/** Loads the game with this save (and menu state) instead of a fresh one. */
export async function openWithSave(page: Page, save: string, { menuOpen = true } = {}) {
  await page.addInitScript(
    ([save, open]) => {
      if (sessionStorage.getItem('e2e-seeded')) return
      localStorage.setItem('spin-doctor.save', save)
      localStorage.setItem('spin-doctor.panel-open', open ? '1' : '0')
      sessionStorage.setItem('e2e-seeded', '1')
    },
    [save, menuOpen] as const,
  )
  await page.goto('/')
}

/** Waits until the location scene is completely built. */
export async function sceneReady(page: Page, location: string) {
  await page.locator(`.scene-host[data-ready="${location}"]`).waitFor({ state: 'attached' })
}

export async function sceneLayout(page: Page): Promise<string> {
  return (await page.locator('.scene-host[data-layout]').getAttribute('data-layout')) ?? ''
}

/** Clicks through story dialogs (continue / first choice) until none is open. */
export async function dismissDialogs(page: Page) {
  const modal = page.locator('[role="dialog"][aria-modal="true"]:visible')
  for (let i = 0; i < 60 && (await modal.count()) > 0; i++) {
    const choice = modal.locator('.dialog-actions .btn-choice').first()
    const next = modal.locator('.dialog-actions .btn-primary').first()
    if (await choice.isVisible()) await choice.click()
    else if (await next.isVisible()) await next.click()
    else await page.waitForTimeout(250)
  }
  // „Kurz erklärt“ cards (one per HUD value) do not block; close them anyway.
  const explain = page.locator('.explain .btn:visible')
  for (let i = 0; i < 10 && (await explain.count()) > 0; i++) await explain.first().click()
}

/** The spin counter as a number (German thousands separators). */
export async function spin(page: Page): Promise<number> {
  const text = (await page.locator('.hud-spin strong').textContent()) ?? '0'
  return Number(text.replace(/\./g, '').replace(',', '.'))
}
