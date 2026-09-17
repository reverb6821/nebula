import { expect, test } from '@playwright/test'
import { resetBrowserState } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetBrowserState(page)
})

test('renders the resource overview cards', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/#\/$/)
  await expect(page.getByText('CPU', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Memory & swap')).toBeVisible()
  await expect(page.getByText('Network', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Disk', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Temperature & power')).toBeVisible()
  await expect(page.getByText('File system', { exact: true })).toBeVisible()
})

test('shows the empty filesystem state when native data is unavailable', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('No file systems found.')).toBeVisible()
})
