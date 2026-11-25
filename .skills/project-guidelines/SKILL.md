# Vue 3 / Neutralinojs Project Guidelines Skill

This is the official project-specific skill for the **Nebula Dock Desktop PC Management Client**. Reference this skill for architecture design, module organization, Neutralino IPC calls, state management, the shared page header/filter pattern, and component standards.

---

## When to Use

Reference this skill when building or maintaining features for this desktop application. Project skills contain:
- Architecture & Neutralino IPC patterns
- Modular file & folder structure
- Code standards (Vue 3, Pug templates, Pinia, Pinia Colada, shadcn-vue)
- The shared page header / search-filter pattern (`usePageHeader`)
- Testing & validation workflows

---

## Architecture Overview

**Tech Stack:**
- **Core Frontend**: Vue 3 (Composition API `<script setup lang="ts">`), TypeScript, Vite
- **Template Engine**: Pug (`<template lang="pug">` everywhere — no plain HTML templates)
- **Desktop Runtime**: Neutralinojs (`@neutralinojs/lib`) with native OS command execution
- **State Management**: Pinia (Global/Module Stores) & Pinia Colada (Query/Mutation Caching)
- **UI & Styling**: TailwindCSS, shadcn-vue, Lucide Vue Icons
- **Localization**: vue-i18n
- **Testing**: Vitest, Playwright (E2E)

**Architecture Diagram:**
```
┌─────────────────────────────────────────────────────────────┐
│                      Vue 3 Desktop Client                   │
│   Components (shadcn-vue, Pug) ──► Pinia / Pinia Colada     │
│         │                          │                        │
│         ▼                          ▼                        │
│   usePageHeader              useNeutralinoCmd                │
│   (title/subtitle/filters)   (runCmd / spawnStream)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Neutralino IPC
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Host Operating System                 │
│         Windows (PowerShell) / Linux (systemctl, bash)      │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
client/
├── src/
│   ├── __tests__/            # Cross-cutting/global tests
│   ├── assets/                # Static assets and global styles
│   ├── components/            # Global reusable UI elements
│   │   ├── layout/            # Layout wrappers & headers
│   │   ├── shared/            # Project-wide shared controls (SharedFilter, SharedButton, SharedAlert, SharedPanel, etc.)
│   │   └── ui/                # Primitive UI components (shadcn-vue)
│   ├── composables/           # Cross-cutting composables (useNeutralinoCmd, usePageHeader)
│   ├── i18n/                  # vue-i18n setup & locale files
│   ├── lib/                   # Generic utilities (e.g. cn())
│   ├── modules/                # Feature-based modular structure
│   │   ├── alerts/             # Alerts monitoring module
│   │   │   ├── __tests__/      # Module-specific unit tests
│   │   │   ├── components/     # Module-specific Vue components
│   │   │   ├── composables/    # Action handlers & IPC execution
│   │   │   ├── utils/          # Module-specific pure helpers (formatting, presets, etc.)
│   │   │   ├── views/          # Top-level view routes
│   │   │   └── store.ts        # Pinia module store
│   │   ├── daemons/             # Daemons management module
│   │   ├── dashboard/           # Dashboard module
│   │   ├── docker/              # Docker container/image module
│   │   ├── process/             # Task & Process manager module
│   │   └── settings/            # App configuration module
│   ├── router/                 # Vue Router configuration
│   ├── stores/                 # App-wide stores (layout, navigation — not tied to a single module)
│   ├── types/                  # TypeScript domain interfaces
│   ├── App.vue                 # Main App entry
│   └── main.ts                 # Vue app initializer
├── e2e/                        # Playwright tests
└── neutralino-init.js           # Neutralino client runner
```

Every module (`modules/<feature>/`) follows the `alerts` layout above: its own `components/`, `composables/`, `utils/`, `views/`, `store.ts`, and `__tests__/`. Anything generic enough to be reused across modules goes up into `src/components`, `src/composables`, `src/lib`, or `src/stores` instead of being duplicated per module.

---

## Code Patterns

### 1. IPC Execution Abstraction (`useNeutralinoCmd.ts`)

All OS integrations must execute through `runCmd` (one-shot) or `spawnStream` (long-running/streaming process) — never call `Neutralino.os.*` directly elsewhere in the codebase.

```typescript
import * as Neutralino from '@neutralinojs/lib'

export interface CmdResult {
  stdout: string
  stderr: string
  exitCode: number
}

export async function runCmd(cmd: string): Promise<CmdResult> {
  if (typeof window.NL_PORT === 'undefined') {
    console.debug('[neu mock] runCmd:', cmd)
    return { stdout: '', stderr: '', exitCode: 0 }
  }
  const result = await Neutralino.os.execCommand(cmd)
  return {
    stdout: result.stdOut ?? '',
    stderr: result.stdErr ?? '',
    exitCode: result.exitCode ?? 0,
  }
}
```

Use `spawnStream` instead of `runCmd` + polling for live/continuous data — it keeps a single native process alive and pushes updates via the `spawnedProcess` event rather than re-spawning a command on a `setInterval`. Both functions must short-circuit on a missing `window.NL_PORT` so the app keeps working (mocked) in a plain browser/dev environment.

### 2. Cross-Platform Module Action Handlers (`composables/useDaemonAction.ts`)

Separate raw OS commands into dedicated composables per module with multi-platform support (Linux & Windows).

```typescript
import { runCmd } from '@/composables/useNeutralinoCmd'
import type { Daemon } from '@/types/daemon'

function isWindows(): boolean {
  return window.NL_OS === 'Windows'
}

export async function startDaemon(name: string): Promise<void> {
  if (isWindows()) {
    await runCmd(`powershell -NoProfile -Command "Start-Service -Name '${name}'"`)
    return
  }
  await runCmd(`pkexec systemctl start ${name}.service`)
}
```

### 3. Pinia Store Pattern (`store.ts`)

Use Setup Store syntax. Leverage `refDebounced` from `@vueuse/core` for filter queries and maintain isolated reactivities.

```typescript
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { refDebounced } from '@vueuse/core'

export const useDaemonsStore = defineStore('daemons', () => {
  const daemons = ref<Daemon[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')

  const searchDebounced = refDebounced(search, 300)

  async function fetch() {
    loading.value = true
    error.value = null
    try {
      daemons.value = await listDaemons()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load daemons'
    } finally {
      loading.value = false
    }
  }

  return { daemons, loading, error, search, fetch }
})
```

### 4. Vue Component Pattern (`<script setup lang="ts">` + Pug)

Strictly use Composition API with `lang="ts"` and Pug templates (`lang="pug"`). Access store refs via `storeToRefs` to preserve reactivity. Use shadcn-vue's `Skeleton` for loading placeholders (not raw `animate-pulse` divs) and `ScrollArea` for any scrollable list/panel content.

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useDaemonsStore } from '../store'
import { SharedAlert } from '@/components/shared'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

const { t } = useI18n()
const store = useDaemonsStore()
const { loading, error, daemons } = storeToRefs(store)

onMounted(() => {
  store.fetch()
})
</script>

<template lang="pug">
div(class="flex flex-col gap-5 px-2 py-3")
  SharedAlert(v-if="error" variant="destructive" :title="t('common.error')" :description="error")
  ScrollArea(class="min-h-0 flex-1")
    div(v-if="loading" class="space-y-2 pr-3")
      Skeleton(v-for="i in 5" :key="i" class="h-14 w-full rounded-xl")
    div(v-else class="pr-3")
      //- Content
</template>
```

### 5. Search Filters in the Page Header (`usePageHeader`)

When a module has a search/filter control, render it inside the shared app header instead of inline in the view body. The routed **view** owns the header: it calls `setHeader`/`clearHeader` and keeps it in sync via `watch`. The filter component itself stays a plain props-in/events-out component so it can be reused inline elsewhere too.

```typescript
import { storeToRefs } from 'pinia'
import { usePageHeader } from '@/composables/usePageHeader'
import { useDaemonsStore } from '../store'
import DaemonsFilters from '../components/DaemonsFilters.vue'

const store = useDaemonsStore()
const { search } = storeToRefs(store)
const { setHeader, clearHeader } = usePageHeader()

function syncHeader() {
  setHeader({
    title: t('daemons.title'),
    toolsComponent: DaemonsFilters,
    toolsProps: {
      search: search.value,
      'onUpdate:search': (value: string) => { search.value = value },
    },
  })
}

onMounted(syncHeader)
onUnmounted(clearHeader)
watch(search, syncHeader)
```

The header renders tools with `v-bind="toolsProps"`, so `onUpdate:xxx` keys inside `toolsProps` work as real Vue event listeners — no need to make the filter component reach into the store directly.

---

## Testing Requirements

Do not test everything by default — only write tests where there is real logic to break. Skip tests for simple wrappers/presentational components that just pass props through or emit events with no branching or computation.

- **Unit test (Vitest)**: store actions/getters with non-trivial logic, module composables (especially cross-platform IPC branching), formatting/filtering utilities.
- **E2E test (Playwright)**: critical end-to-end flows only (e.g. starting/stopping a daemon, acknowledging an alert, stopping a Docker container) — not every screen or dialog.

### Vitest Unit & Integration Testing

```bash
# Run unit tests
npm run test:unit

# Coverage report
npm run test:unit -- --coverage
```

**Example Store/Composable Test:**
```typescript
import { describe, it, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDaemonsStore } from '../store'

describe('Daemons Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with empty state', () => {
    const store = useDaemonsStore()
    expect(store.daemons).toEqual([])
    expect(store.loading).toBe(false)
  })
})
```

Place module-specific tests in `modules/<feature>/__tests__/`; cross-cutting tests (shared components, global composables) go in `src/__tests__/`.

### Playwright E2E Testing

```bash
# Run end-to-end testing
npm run test:e2e
```

**Example E2E Test (critical flow):**
```typescript
import { test, expect } from '@playwright/test'

test('acknowledges a triggered alert', async ({ page }) => {
  await page.goto('/alerts')
  await page.getByRole('button', { name: 'Acknowledge' }).first().click()
  await expect(page.getByText('Acknowledged')).toBeVisible()
})
```

---

## Critical Rules

1. **No Emojis** in code comments, commit messages, or inline documentation.
2. **Pug Templates Only**: every `<template>` block uses `lang="pug"` — no plain HTML templates.
3. **Neutralino Safety Check**: Always wrap or handle `window.NL_PORT` inside `useNeutralinoCmd` to avoid browser dev crashes.
4. **Cross-Platform Readiness**: Ensure system commands handle both Windows (PowerShell JSON outputs) and Linux (`systemctl`, `pkexec`).
5. **Immutability & Vue Reactivity**: Mutate reactive references cleanly using `.value` or shallow copies; do not break object tracking.
6. **UI Consistency**: Rely on `shadcn-vue` primitives (`Card`, `Item`, `Badge`, `ScrollArea`, `Skeleton`) and custom shared components (`SharedFilter`, `SharedButton`, `SharedAlert`).
7. **Modular Scope**: Keep components, composables, utils, views, and the store scoped within their respective directory under `src/modules/<feature_name>/`; only promote something to `src/` once it's genuinely reused by more than one module.
8. **Header-Driven Filters**: a module's search/filter control is wired through `usePageHeader`'s `toolsComponent`/`toolsProps`, set from that module's view — not rendered inline in the view body.
9. **No Console Logs**: Use `console.debug` only inside development mocks; strip debug logs prior to production builds.
10. **Test What Has Logic**: no tests for trivial wrapper components; unit tests (Vitest) for real logic, E2E (Playwright) for critical flows only.