import { expect, test } from '@playwright/test'
import { resetBrowserState } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetBrowserState(page)
})

test('opens the alerts center and loads the monitoring view', async ({ page }) => {
  await page.goto('/#/alerts')

  await expect(page).toHaveURL(/\/#\/alerts$/)
  await expect(page.getByText('Monitoring status', { exact: true })).toBeVisible()
  await expect(page.getByText('Alert events', { exact: true })).toBeVisible()
})
