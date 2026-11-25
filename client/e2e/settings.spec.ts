import { expect, test } from '@playwright/test'
import { resetBrowserState } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetBrowserState(page)
  await page.goto('/#/preferences')
})

test('renders the preference groups', async ({ page }) => {
  for (const group of ['Language', 'Appearance', 'Font', 'Accessibility', 'About']) {
    await expect(page.getByRole('heading', { name: group, exact: true })).toBeVisible()
  }
  await expect(page.getByRole('combobox', { name: 'Interface language' })).toBeVisible()
})

test('changes the application language', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Interface language' }).click()
  await page.getByRole('option', { name: /Italiano/ }).click()

  await expect(page.getByRole('heading', { name: 'Aspetto' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'it-IT')
})

test('applies the accent color to the document', async ({ page }) => {
  await page.getByRole('radio', { name: 'Orange' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'orange')

  await page.getByRole('radio', { name: 'Blue' }).click()
  await expect(page.locator('html')).not.toHaveAttribute('data-accent', /.+/)
})

test('changes appearance preferences and resets them after confirmation', async ({ page }) => {
  const largeText = page.getByRole('radio', { name: 'Large', exact: true })
  await largeText.click()
  await expect(largeText).toHaveAttribute('aria-checked', 'true')

  const reducedMotion = page.getByRole('switch', { name: 'Reduce motion' })
  await reducedMotion.click()
  await expect(reducedMotion).toHaveAttribute('aria-checked', 'true')

  await page.getByRole('button', { name: 'Reset to defaults' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reset to defaults' }).click()

  await expect(largeText).toHaveAttribute('aria-checked', 'false')
  await expect(reducedMotion).toHaveAttribute('aria-checked', 'false')
})
