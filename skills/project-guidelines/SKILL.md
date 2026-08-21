# Vue 3 / Neutralinojs Project Guidelines Skill

This is the official project-specific skill for the **Desktop PC Management Client**. Reference this skill for architecture design, module organization, Neutralino IPC calls, state management, and component standards.

---

## When to Use

Reference this skill when building or maintaining features for this desktop application. Project skills contain:
- Architecture & Neutralino IPC patterns
- Modular file & folder structure
- Code standards (Vue 3, Pinia, Pinia Colada, shadcn-vue)
- Testing & validation workflows

---

## Architecture Overview

**Tech Stack:**
- **Core Frontend**: Vue 3 (Composition API `<script setup lang="ts">`), TypeScript, Vite
- **Desktop Runtime**: Neutralinojs (`@neutralinojs/lib`) with native OS command execution
- **State Management**: Pinia (Global/Module Stores) & Pinia Colada (Query/Mutation Caching)
- **UI & Styling**: TailwindCSS, shadcn-vue, Lucide Vue Icons
- **Localization**: vue-i18n
- **Testing**: Vitest, Playwright (E2E)

**Architecture Diagram:**
```
┌─────────────────────────────────────────────────────────────┐
│                      Vue 3 Desktop Client                   │
│   Components (shadcn-vue) ──► Pinia / Pinia Colada          │
│                              │                              │
│                              ▼                              │
│                     useNeutralinoCmd                        │
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
│   ├── assets/              # Static assets and global styles
│   ├── components/          # Global reusable UI elements
│   │   ├── layout/          # Layout wrappers & headers
│   │   ├── shared/          # Project-wide shared controls (SharedFilter, etc.)
│   │   └── ui/              # Primitive UI components (shadcn-vue)
│   ├── composables/         # Cross-cutting composables (e.g., useNeutralinoCmd)
│   ├── modules/             # Feature-based modular structure
│   │   ├── daemons/         # Daemons management module
│   │   │   ├── components/  # Module-specific Vue components
│   │   │   ├── composables/ # Action handlers & IPC execution
│   │   │   ├── views/       # Top-level view routes
│   │   │   └── store.ts     # Pinia module store
│   │   ├── dashboard/       # Dashboard module
│   │   ├── docker/          # Docker monitoring module
│   │   ├── process/         # Task & Process manager module
│   │   └── settings/        # App configuration module
│   ├── router/              # Vue Router configuration
│   ├── stores/              # App-wide stores (layout, navigation)
│   ├── types/               # TypeScript domain interfaces
│   ├── App.vue              # Main App entry
│   └── main.ts              # Vue app initializer
├── e2e/                     # Playwright tests
└── neutralino-init.js       # Neutralino client runner
```

---

## Code Patterns

### 1. IPC Execution Abstraction (`useNeutralinoCmd.ts`)

All OS integrations must execute through `runCmd` or `spawnStream`.

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

### 4. Vue Component Pattern (`<script setup lang="ts">`)

Strictly use Composition API with `lang="ts"`. Access store refs via `storeToRefs` to preserve reactivity.

```vue
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useDaemonsStore } from '../store'
import { SharedAlert } from '@/components/shared'
import { ScrollArea } from '@/components/ui/scroll-area'

const { t } = useI18n()
const store = useDaemonsStore()
const { loading, error, daemons } = storeToRefs(store)

onMounted(() => {
  store.fetch()
})
</script>

<template>
  <div class="flex flex-col gap-5 px-2 py-3">
    <SharedAlert v-if="error" variant="destructive" title="Error" :description="error" />
    <ScrollArea class="min-h-0 flex-1">
      <div v-if="loading" class="space-y-1">
        <div v-for="i in 5" :key="i" class="h-14 animate-pulse rounded-xl bg-white/[0.03]" />
      </div>
      <div v-else class="pr-3">
        <!-- Content -->
      </div>
    </ScrollArea>
  </div>
</template>
```

---

## Testing Requirements

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

### Playwright E2E Testing

```bash
# Run end-to-end testing
npm run test:e2e
```

---

## Critical Rules

1. **No Emojis** in code comments, commit messages, or inline documentation.
2. **Neutralino Safety Check**: Always wrap or handle `window.NL_PORT` inside `useNeutralinoCmd` to avoid browser dev crashes.
3. **Cross-Platform Readiness**: Ensure system commands handle both Windows (PowerShell JSON outputs) and Linux (`systemctl`, `pkexec`).
4. **Immutability & Vue Reactivity**: Mutate reactive references cleanly using `.value` or shallow copies; do not break object tracking.
5. **UI Consistency**: Rely on `shadcn-vue` primitives (`Card`, `Item`, `Badge`, `ScrollArea`) and custom shared components (`SharedFilter`, `SharedButton`, `SharedAlert`).
6. **Modular Scope**: Keep components, stores, and composables scoped within their respective directory under `src/modules/<feature_name>/`.
7. **No Console Logs**: Use `console.debug` only inside development mocks; strip debug logs prior to production builds.
