import { expect, test } from '@playwright/test'
import { resetBrowserState } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetBrowserState(page)
  await page.goto('/#/overview')
})

test('renders the resource overview', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()
  await expect(page.getByText('Processor', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Processor history' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Memory & swap' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Disk activity' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Top processes' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Needs attention' })).toBeVisible()
})

test('shows the empty states when native data is unavailable', async ({ page }) => {
  await expect(page.getByText('No file systems found.')).toBeVisible()
  await expect(page.getByText('Docker is not reachable')).toBeVisible()
})
