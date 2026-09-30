import { expect, test } from './fixtures'
import { dismissDialogs, sceneReady, spin } from './helpers'

test('a new player gets through the intro, taps and buys the first generator', async ({ page }) => {
  // Clicking through the whole intro takes a while on CI's software-rendered WebGL.
  test.setTimeout(180_000)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/')
  await sceneReady(page, 'press-house')
  await expect(page.locator('[role="dialog"]')).toBeVisible()
  await dismissDialogs(page)

  // A real tap on the scene makes a statement (spin)…
  const tap = page.locator('.scene-tap')
  // Aim below the „Kurz erklärt“ card at the top; `force`: the scene animates
  // constantly, so it never counts as "stable".
  const box = (await tap.boundingBox())!
  await tap.click({ position: { x: box.width / 2, y: box.height * 0.4 }, force: true })
  await expect.poll(() => spin(page)).toBeGreaterThan(0)

  // …and more of them (dispatched directly: software WebGL makes real clicks slow)
  // until the first generator is affordable.
  const buy = page.locator('.btn-buy').first()
  for (let i = 0; i < 20 && !(await buy.isEnabled()); i++) {
    await tap.evaluate((el) => {
      for (let k = 0; k < 5; k++)
        el.dispatchEvent(
          new PointerEvent('pointerdown', { bubbles: true, clientX: 60, clientY: 200 }),
        )
    })
    await dismissDialogs(page)
  }

  // …and buys it.
  await dismissDialogs(page)
  await buy.click()
  await expect(page.locator('.card .badge').first()).toContainText('1')

  expect(errors).toEqual([])
})
