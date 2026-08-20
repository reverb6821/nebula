# CLAUDE.md - Assistant Guidelines for Vue 3 + Neutralinojs Client

This document defines the guidelines and workflows for AI assistants working on this codebase.

---

## Project Overview

Desktop client for PC management and system diagnostics built with Vue 3, Neutralinojs, Pinia, and TailwindCSS.

- **Frontend Framework**: Vue 3 (Composition API `<script setup lang="ts">`)
- **Desktop Runtime**: Neutralinojs (`@neutralinojs/lib`)
- **State Management**: Pinia & Pinia Colada
- **UI Components**: shadcn-vue, TailwindCSS, Lucide Vue Icons
- **i18n**: vue-i18n
- **Testing**: Vitest (Unit), Playwright (E2E)

---

## Commands & Workflows

### Development
```bash
# Start frontend dev server
npm run dev

# Start Neutralino app in dev mode
neu run
```

### Testing & Linting
```bash
# Run unit tests
npm run test:unit

# Run unit tests with coverage
npm run test:unit -- --coverage

# Run E2E tests
npm run test:e2e

# Type check & lint
npm run type-check
npm run lint
```

---

## Architecture & Code Conventions

### 1. IPC Execution (`useNeutralinoCmd`)
- Execute OS commands via `runCmd` or `spawnStream` from `@/composables/useNeutralinoCmd`.
- Always check for `window.NL_PORT` to allow fallback mocking in pure browser environments.

### 2. Cross-Platform OS Logic
- Isolate system-level actions (e.g., Windows PowerShell vs. Linux `systemctl`) inside module composables (e.g., `modules/<feature>/composables/`).

### 3. Store Pattern (Pinia)
- Use Setup Store syntax (`defineStore('name', () => { ... })`).
- Use `refDebounced` from `@vueuse/core` for search inputs to avoid rapid refetches.

### 4. Vue Components
- Use strictly `<script setup lang="ts">`.
- Use `storeToRefs` when destructuring state/getters from Pinia stores to preserve reactivity.
- Leverage primitive UI components from `@/components/ui` (shadcn-vue) and shared UI controls from `@/components/shared`.

---

## Critical Rules

1. **No Emojis**: Do not use emojis in code, comments, commit messages, or documentation.
2. **Neutralino Execution Guard**: Always wrap native calls so non-desktop environments do not crash.
3. **No Console Logs**: Use `console.debug` only for development mocks.
4. **Immutability**: Maintain clean Vue reactivity; do not mutate nested reactive state directly.