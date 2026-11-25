import { expect, test } from '@playwright/test'
import { resetBrowserState } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetBrowserState(page)
  await page.goto('/#/processes')
})

test('renders the process page with its toolbar and empty table state', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'Processes' })).toBeVisible()
  await expect(page.getByRole('switch', { name: 'Live updates' })).toBeVisible()
  await expect(page.getByText('No processes match your search.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'End process' })).toBeDisabled()
})

test('toggles live updates and filters by process search', async ({ page }) => {
  const live = page.getByRole('switch', { name: 'Live updates' })
  await expect(live).toHaveAttribute('aria-checked', 'true')
  await live.click()
  await expect(live).toHaveAttribute('aria-checked', 'false')

  const search = page.getByRole('searchbox', { name: 'Search processes' })
  await search.fill('bash')
  await expect(search).toHaveValue('bash')
})
