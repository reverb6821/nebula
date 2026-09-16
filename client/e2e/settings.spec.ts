import { expect, test } from '@playwright/test'
import { resetBrowserState } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetBrowserState(page)
  await page.goto('/#/settings')
})

test('renders language and appearance settings', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Language' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Language' })).toBeVisible()
})

test('changes the application language', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Language' }).click()
  await page.getByRole('option', { name: /Italiano/ }).click()

  await expect(page.getByText('Impostazioni')).toBeVisible()
  await expect(page.getByText('Aspetto')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'it-IT')
})

test('changes appearance preferences and resets them after confirmation', async ({ page }) => {
  const largeFont = page.getByRole('radio', { name: 'Large', exact: true })
  await largeFont.click()
  await expect(largeFont).toHaveAttribute('aria-checked', 'true')

  const reducedMotion = page.getByRole('switch', { name: 'Reduce motion' })
  await reducedMotion.click()
  await expect(reducedMotion).toHaveAttribute('aria-checked', 'true')

  await page.getByRole('button', { name: 'Reset to defaults' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reset to defaults' }).click()

  await expect(largeFont).toHaveAttribute('aria-checked', 'false')
  await expect(reducedMotion).toHaveAttribute('aria-checked', 'false')
})
