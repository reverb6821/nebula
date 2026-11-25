import { expect, test } from '@playwright/test'
import { resetBrowserState } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetBrowserState(page)
  await page.goto('/#/alerts')
})

test('opens the alerts page with summary, filters and empty states', async ({ page }) => {
  await expect(page).toHaveURL(/\/#\/alerts$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Alerts' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Alert summary' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Filter alerts' })).toBeVisible()
  await expect(page.getByText('Select an alert')).toBeVisible()
})

test('keeps the sidebar badge and Active card on the same count', async ({ page }) => {
  const active = page.getByRole('region', { name: 'Alert summary' }).getByText('Active', { exact: true }).locator('..')
  await expect(active).toContainText('0')
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Alerts' })).not.toContainText(/\d/)
})
