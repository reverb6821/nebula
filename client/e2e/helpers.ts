import type { Page } from '@playwright/test'

export async function resetBrowserState(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}
