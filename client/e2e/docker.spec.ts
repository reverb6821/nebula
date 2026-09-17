import { expect, test } from '@playwright/test'
import { resetBrowserState } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetBrowserState(page)
  await page.goto('/#/docker')
})

test('shows the Docker unavailable state', async ({ page }) => {
  await expect(page.locator('header').getByText('Docker', { exact: true })).toBeVisible()
  await expect(page.getByText('Docker not reachable')).toBeVisible()
  await expect(page.getByText('No containers found.')).toBeVisible()
})

test('switches between containers and images', async ({ page }) => {
  await page.getByRole('button', { name: 'Images' }).click()
  await expect(page.getByText('No images found.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pull image' })).toBeVisible()

  await page.getByRole('button', { name: 'Containers' }).click()
  await expect(page.getByText('No containers found.')).toBeVisible()
})

test('opens the Docker image pull dialog and validates the empty input state', async ({ page }) => {
  await page.getByRole('button', { name: 'Images' }).click()
  await page.getByRole('button', { name: 'Pull image' }).click()

  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Pull Docker image' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pull' })).toBeDisabled()
})
