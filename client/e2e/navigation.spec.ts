import { expect, test } from '@playwright/test'
import { resetBrowserState } from './helpers'

test.beforeEach(async ({ page }) => {
  await resetBrowserState(page)
})

test('reaches every primary route from the sidebar', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/#\/overview$/)

  const sidebar = page.getByRole('navigation', { name: 'Main' })
  const routes = [
    { link: 'Processes', url: /\/#\/processes$/, title: 'Processes' },
    { link: 'Services', url: /\/#\/services$/, title: 'Services' },
    { link: 'Alerts', url: /\/#\/alerts$/, title: 'Alerts' },
    { link: 'Preferences', url: /\/#\/preferences$/, title: 'Preferences' },
    { link: 'Overview', url: /\/#\/overview$/, title: 'Overview' },
  ]

  for (const route of routes) {
    const link = sidebar.getByRole('link', { name: route.link })
    await link.click()
    await expect(page).toHaveURL(route.url)
    await expect(link).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { level: 1, name: route.title })).toBeVisible()
  }

  // Docker mostra le tab Containers / Images al posto del titolo.
  const dockerLink = sidebar.getByRole('link', { name: 'Docker' })
  await dockerLink.click()
  await expect(page).toHaveURL(/\/#\/docker$/)
  await expect(dockerLink).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('tab', { name: 'Containers' })).toBeVisible()
})

test('redirects the legacy routes to the renamed pages', async ({ page }) => {
  for (const [legacy, current] of [
    ['/#/daemons', /\/#\/services$/],
    ['/#/process', /\/#\/processes$/],
    ['/#/settings', /\/#\/preferences$/],
  ] as const) {
    await page.goto(legacy)
    await expect(page).toHaveURL(current)
  }
})
