import { expect, test } from '@playwright/test'
import { resetBrowserState } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetBrowserState(page)
  await page.goto('/#/daemons')
})

test('shows the empty daemon state and search threshold hint', async ({ page }) => {
  await expect(page.locator('header').getByText('Daemons', { exact: true })).toBeVisible()
  await expect(page.getByText('No daemons found.')).toBeVisible()

  const search = page.getByRole('textbox', { name: 'Cerca' })
  await search.fill('ab')
  await expect(page.getByText(/Type 1 more character/)).toBeVisible()
})

test('opens daemon filters and resets them', async ({ page }) => {
  await page.getByRole('button', { name: 'Filtri avanzati' }).click()
  await expect(page.getByText('Status', { exact: true })).toBeVisible()
  await expect(page.getByText('Boot', { exact: true })).toBeVisible()

  await page.getByText('Active', { exact: true }).click()
  await expect(page.getByRole('button', { name: 'Rimuovi filtro Active' })).toBeVisible()

  await page.getByRole('button', { name: 'Azzera filtri' }).click()
  await expect(page.getByRole('button', { name: 'Rimuovi filtro Active' })).toHaveCount(0)
})

test('switches daemon list and grid views', async ({ page }) => {
  const listButton = page.getByRole('button', { name: 'List view' })
  const gridButton = page.getByRole('button', { name: 'Grid view' })

  await expect(listButton).toHaveAttribute('aria-pressed', 'true')
  await gridButton.click()
  await expect(gridButton).toHaveAttribute('aria-pressed', 'true')
  await expect(listButton).toHaveAttribute('aria-pressed', 'false')
})
