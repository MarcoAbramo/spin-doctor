import { expect, test } from './fixtures'
import { content, midGameSave, openWithSave, sceneLayout, sceneReady } from './helpers'

for (const location of content.locations) {
  test.describe(`${location.id}`, () => {
    test('the room stays put when the menu folds away', async ({ page }) => {
      await openWithSave(page, midGameSave(location.id))
      await sceneReady(page, location.id)
      const open = await sceneLayout(page)
      expect(open).not.toBe('')

      await page.locator('.panel-handle').click()
      await expect(page.locator('.panel-handle')).toHaveAttribute('aria-expanded', 'false')
      await page.waitForTimeout(400)
      expect(await sceneLayout(page)).toBe(open)

      await page.locator('.tab').first().click()
      await expect(page.locator('.panel-handle')).toHaveAttribute('aria-expanded', 'true')
      await page.waitForTimeout(400)
      expect(await sceneLayout(page)).toBe(open)
    })

    test('with the menu folded, the room fills the stage', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'phones only')
      await openWithSave(page, midGameSave(location.id), { menuOpen: false })
      await sceneReady(page, location.id)
      const [, y, scale] = (await sceneLayout(page)).split(' ').map(Number)
      const stage = await page.locator('.stage').boundingBox()
      const drawerSide = await page
        .locator('.drawer')
        .evaluate((d) => getComputedStyle(d).getPropertyValue('--drawer-side').trim() === '1')
      test.skip(drawerSide, 'landscape: the menu covers the side, not the bottom')
      // Everything under the drawer is art, not empty floor (small rest allowed on tall phones).
      const roomBottom = y! + location.scene.height * scale!
      expect(roomBottom).toBeGreaterThanOrEqual(stage!.height * 0.9)
    })
  })
}

test('the HUD keeps its height while numbers grow', async ({ context, page }) => {
  await openWithSave(page, midGameSave('press-house', { spin: 12 }))
  await sceneReady(page, 'press-house')
  const small = (await page.locator('.hud').boundingBox())!.height
  const layout = await sceneLayout(page)
  await page.close()

  // A second tab in the same context, seeded with a 15-digit spin count.
  const big = await context.newPage()
  await openWithSave(big, midGameSave('press-house', { spin: 123_456_789_012_345 }))
  await sceneReady(big, 'press-house')
  expect((await big.locator('.hud').boundingBox())!.height).toBe(small)
  expect(await sceneLayout(big)).toBe(layout)
})

test('an objective in the menu does not move the room', async ({ context, page }) => {
  await openWithSave(page, midGameSave('press-house'))
  await sceneReady(page, 'press-house')
  await expect(page.locator('.objective')).toHaveCount(0)
  const layout = await sceneLayout(page)
  await page.close()

  const hint = await context.newPage()
  await openWithSave(hint, midGameSave('press-house', { tapHint: true }))
  await sceneReady(hint, 'press-house')
  await expect(hint.locator('.objective')).toBeVisible()
  expect(await sceneLayout(hint)).toBe(layout)
})
