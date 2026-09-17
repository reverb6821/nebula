import { expect, test } from '@playwright/test'
import { resetBrowserState } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetBrowserState(page)
})

test('reaches every primary route from the sidebar', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page).toHaveURL(/\/#\/settings$/)
  await expect(page.getByRole('heading', { name: 'Language' })).toBeVisible()

  await page.getByRole('button', { name: 'System', exact: true }).click()
  await page.getByRole('link', { name: 'Daemons' }).click()
  await expect(page).toHaveURL(/\/#\/daemons$/)
  await expect(page.locator('header').getByText('Daemons', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Process' }).click()
  await expect(page).toHaveURL(/\/#\/process$/)
  await expect(page.locator('header').getByText('Processes', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Docker' }).click()
  await expect(page).toHaveURL(/\/#\/docker$/)
  await expect(page.locator('header').getByText('Docker', { exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(page).toHaveURL(/\/#\/$/)
  await expect(page.getByText('Memory & swap')).toBeVisible()
})
