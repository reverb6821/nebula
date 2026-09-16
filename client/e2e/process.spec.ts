import { expect, test } from '@playwright/test'
import { resetBrowserState } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetBrowserState(page)
  await page.goto('/#/process')
})

test('renders the process page with its toolbar and empty table state', async ({ page }) => {
  await expect(page.locator('header').getByText('Processes', { exact: true })).toBeVisible()
  await expect(page.getByRole('switch', { name: 'Aggiornamento automatico' })).toBeVisible()
  await expect(page.getByText('Nessun processo corrisponde alla ricerca.')).toBeVisible()
})

test('toggles automatic refresh and filters by process search', async ({ page }) => {
  const refresh = page.getByRole('switch', { name: 'Aggiornamento automatico' })
  await expect(refresh).toHaveAttribute('aria-checked', 'true')
  await refresh.click()
  await expect(refresh).toHaveAttribute('aria-checked', 'false')

  await page.getByRole('textbox', { name: 'Cerca' }).fill('bash')
  await expect(page.getByRole('textbox', { name: 'Cerca' })).toHaveValue('bash')
})
