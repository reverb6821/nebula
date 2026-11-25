# Playwright E2E Testing Specialist Skill

This skill defines E2E testing workflows, Playwright conventions, mock IPC integrations, and artifact management for the **Vue 3 / Neutralinojs Desktop Client**. Reference this skill when writing, maintaining, or debugging end-to-end user journeys.

---

## When to Use

Reference this skill during:
- Creating or maintaining Playwright E2E test scripts
- Mocking Neutralinojs IPC commands (`window.NL_PORT`, `runCmd`) inside browser test contexts
- Quarantining flaky tests or fixing race conditions in UI interactions
- Managing test artifacts (screenshots, traces, HTML reports)

---

## Architecture & Test Layout

```
client/
├── e2e/
│   ├── fixtures/             # Mock data and custom Playwright fixtures
│   │   ├── neutralino.mock.ts # IPC execution mocks
│   │   └── daemons.data.ts   # Dummy system daemon payloads
│   ├── modules/              # Modular test suites matching app src/modules
│   │   ├── daemons.spec.ts   # System daemons management flow
│   │   ├── process.spec.ts   # Task/Process manager flow
│   │   └── settings.spec.ts  # Application settings flow
│   └── pages/                # Page Object Model (POM) representations
│       ├── DaemonsPage.ts
│       └── Navigation.ts
└── playwright.config.ts      # Playwright runner configuration
```

---

## Code Patterns & Best Practices

### 1. Neutralino IPC Injection Fixture (`fixtures/neutralino.mock.ts`)

Since Playwright runs in a standard browser engine without native Neutralino binary bindings, inject global mock APIs before app load.

```typescript
import { test as base } from '@playwright/test'

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      // Inject fake Neutralino port and mock OS execution
      window.NL_PORT = 12345
      window.NL_OS = 'Linux'
      window.Neutralino = {
        os: {
          execCommand: async (cmd: string) => {
            if (cmd.includes('systemctl list-units')) {
              return {
                stdOut: JSON.stringify([
                  { unit: 'docker.service', load: 'loaded', active: 'active', sub: 'running' },
                  { unit: 'bluetooth.service', load: 'loaded', active: 'inactive', sub: 'dead' }
                ]),
                exitCode: 0
              }
            }
            return { stdOut: '', exitCode: 0 }
          }
        }
      }
    })
    await use(page)
  }
})

export { expect } from '@playwright/test'
```

### 2. Page Object Model (POM) Pattern (`pages/DaemonsPage.ts`)

```typescript
import { Page, Locator } from '@playwright/test'

export class DaemonsPage {
  readonly page: Page
  readonly searchInput: Locator
  readonly daemonRows: Locator
  readonly startButton: Locator

  constructor(page: Page) {
    this.page = page
    this.searchInput = page.locator('input[placeholder*="Search"]')
    this.daemonRows = page.locator('[data-testid="daemon-row"]')
    this.startButton = page.locator('[data-testid="start-daemon-btn"]')
  }

  async goto() {
    await this.page.goto('/#/daemons')
    await this.page.waitForLoadState('domcontentloaded')
  }

  async searchDaemon(name: string) {
    await this.searchInput.fill(name)
  }
}
```

### 3. Module E2E Test Suite (`modules/daemons.spec.ts`)

```typescript
import { test, expect } from '../fixtures/neutralino.mock'
import { DaemonsPage } from '../pages/DaemonsPage'

test.describe('Daemons Management Module', () => {
  let daemonsPage: DaemonsPage

  test.beforeEach(async ({ page }) => {
    daemonsPage = new DaemonsPage(page)
    await daemonsPage.goto()
  })

  test('filters daemon list by search term', async ({ page }) => {
    await daemonsPage.searchDaemon('docker')
    await expect(daemonsPage.daemonRows).toHaveCount(1)
    await expect(daemonsPage.daemonRows.first()).toContainText('docker.service')
  })

  test('handles execution error gracefully', async ({ page }) => {
    // Override window.Neutralino to simulate failure
    await page.evaluate(() => {
      window.Neutralino.os.execCommand = async () => {
        throw new Error('Permission denied')
      }
    })

    await daemonsPage.searchDaemon('docker')
    await expect(page.locator('[data-testid="shared-alert"]')).toBeVisible()
  })
})
```

---

## Playwright Configuration (`playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'playwright-results.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

---

## Critical Rules

1. **No Real System Commands**: Never allow E2E tests to execute destructive system operations (`rm -rf`, `systemctl stop`) on the host machine; always mock Neutralino IPC handlers.
2. **Deterministic Selectors**: Prefer `data-testid` attributes over volatile CSS classes or Tailwind utility chains.
3. **Flaky Test Handling**: Quarantined tests must be marked with `test.fixme()` and accompanied by a tracked issue ID.
4. **No Emojis**: Keep test titles, logs, and report outputs completely emoji-free.