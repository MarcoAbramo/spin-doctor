import { expect, test } from './fixtures'
import { midGameSave, openWithSave, sceneReady } from './helpers'

test('the map opens, its signs stay on screen, and a building can be entered', async ({ page }) => {
  await openWithSave(page, midGameSave('press-house'), { menuOpen: false })
  await sceneReady(page, 'press-house')
  await page.locator('.scene-btn').click()
  await page.locator('.scene-host[data-ready="map"]').waitFor({ state: 'attached' })

  const viewport = page.viewportSize()!
  // Signs of buildings outside the view are hidden; every visible one fits the screen.
  const signs = page.locator('.map-sign:visible')
  await expect(signs.first()).toBeVisible()
  for (const sign of await signs.all()) {
    const box = (await sign.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
  }

  // Walk to the Rosengarten and enter it.
  await page.locator('.map-sign', { hasText: 'Rosengarten' }).click()
  await page.locator('.location-card .btn:not(.btn-ghost)').click()
  await sceneReady(page, 'rosengarten')
})
