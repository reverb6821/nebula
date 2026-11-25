import { expect, test } from '@playwright/test'
import { resetBrowserState } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetBrowserState(page)
  await page.goto('/#/services')
})

test('shows the empty service state and the search field', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Services' })).toBeVisible()
  await expect(page.getByText('No daemons found.')).toBeVisible()

  const search = page.getByRole('searchbox', { name: 'Search units' })
  await search.fill('ssh')
  await expect(search).toHaveValue('ssh')
})

test('focuses the search field with Ctrl+F', async ({ page }) => {
  await page.keyboard.press('Control+f')
  await expect(page.getByRole('searchbox', { name: 'Search units' })).toBeFocused()
})

test('selects one filter chip at a time', async ({ page }) => {
  const filters = page.getByRole('group', { name: 'Filter units' })
  const all = filters.getByRole('button', { name: /^All/ })
  const failed = filters.getByRole('button', { name: /^Failed/ })

  await expect(all).toHaveAttribute('aria-pressed', 'true')
  await failed.click()
  await expect(failed).toHaveAttribute('aria-pressed', 'true')
  await expect(all).toHaveAttribute('aria-pressed', 'false')
})
