import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // Scaffold di default usava "npm run preview": con Bun come package
    // manager va sostituito, altrimenti Playwright lancia npm anche se
    // il progetto non lo usa più (npm potrebbe non risolvere le
    // dipendenze installate da bun in .bun/, causando un preview che non
    // parte o parte con moduli diversi da quelli testati altrove).
    command: 'bun run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
})