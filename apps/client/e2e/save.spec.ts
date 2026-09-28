import { readFileSync } from 'node:fs'
import { expect, test } from './fixtures'
import { midGameSave, sceneReady, spin } from './helpers'

const BROKEN = '{"version":2,"stats":'

async function openWithStorage(
  page: import('@playwright/test').Page,
  entries: Record<string, string>,
) {
  await page.addInitScript((entries) => {
    if (sessionStorage.getItem('e2e-seeded')) return
    for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v)
    sessionStorage.setItem('e2e-seeded', '1')
  }, entries)
  await page.goto('/')
}

test('a broken save falls back to the last good one and is kept', async ({ page }) => {
  await openWithStorage(page, {
    'spin-doctor.save': BROKEN,
    'spin-doctor.save.good': midGameSave('press-house', { spin: 4242 }),
  })
  await sceneReady(page, 'press-house')
  await expect(page.locator('.toast', { hasText: 'Sicherung' })).toBeVisible()
  expect(await spin(page)).toBeGreaterThanOrEqual(4242)
  expect(await page.evaluate(() => localStorage.getItem('spin-doctor.save.unreadable'))).toBe(
    BROKEN,
  )
})

test('a broken save without backup starts fresh but is not overwritten', async ({ page }) => {
  await openWithStorage(page, { 'spin-doctor.save': BROKEN })
  await sceneReady(page, 'press-house')
  await expect(page.locator('.toast', { hasText: 'aufbewahrt' })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('spin-doctor.save.unreadable'))).toBe(
    BROKEN,
  )
})

test('the save can be exported to a file and loaded from it', async ({ page }) => {
  await openWithStorage(page, {
    'spin-doctor.save': midGameSave('press-house', { spin: 777_777 }),
    'spin-doctor.panel-open': '1',
  })
  await sceneReady(page, 'press-house')
  await page.locator('.tab').last().click()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: /Als Datei sichern/ }).click()
  const file = await (await download).path()
  const code = readFileSync(file, 'utf8')
  expect(code).toMatch(/^SPIN/)

  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: /Aus Datei laden/ }).click()
  await (await chooser).setFiles({
    name: 'save.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(code),
  })
  await expect(page.locator('.toast', { hasText: 'Spielstand geladen' })).toBeVisible()
  expect(await spin(page)).toBeGreaterThanOrEqual(777_777)
})
