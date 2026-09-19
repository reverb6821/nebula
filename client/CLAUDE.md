# CLAUDE.md - Assistant Guidelines for the Vue 3 Client

This document defines the guidelines and workflows for AI assistants working on `client/` (the Nebula Dock frontend). For root-level/monorepo concerns (workspaces, Neutralino build, releases, commit conventions) see the root `CLAUDE.md`.

---

## Project Overview

Vue 3 desktop client for PC resource management and system diagnostics, and Docker container/image management. Runs inside Neutralinojs.

- **Frontend Framework**: Vue 3 (Composition API, strictly `<script setup lang="ts">`)
- **Template Engine**: Pug (`<template lang="pug">`) — do not write plain HTML templates
- **Desktop Runtime**: Neutralinojs (`@neutralinojs/lib`), accessed only through `useNeutralinoCmd`
- **State Management**: Pinia & Pinia Colada
- **Routing**: Vue Router
- **UI Components**: shadcn-vue (`@/components/ui`), TailwindCSS, Lucide Vue Icons
- **i18n**: vue-i18n
- **Testing**: Vitest (unit), Playwright (E2E)

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

## Project Structure

```
src/
  __tests__/       # cross-cutting/global tests
  assets/
  components/       # global, generic, reusable components (shared UI, not tied to one flow)
  composables/       # global, generic composables (e.g. useNeutralinoCmd, usePageHeader)
  i18n/
  lib/
  modules/           # one folder per business flow ("flusso")
    alerts/
      __tests__/
      components/    # components specific to this flow
      composables/    # composables specific to this flow
      utils/
      views/          # routed views for this flow
      store.ts        # Pinia store for this flow
    daemons/
    dashboard/
    docker/
    process/
    settings/
  router/
  stores/            # global Pinia stores (not tied to a single flow)
  types/
  App.vue
  main.ts
```

**Rule of thumb**: if a component/composable/store is generic and reusable across flows, it goes in the top-level `src/components`, `src/composables`, or `src/stores`. If it belongs to one specific flow (e.g. `alerts`, `docker`, `dashboard`), it goes inside `modules/<flow>/` alongside that flow's own `components/`, `composables/`, `utils/`, `views/`, `store.ts`, and `__tests__/`.

---

## Architecture & Code Conventions

### 1. IPC Execution (`useNeutralinoCmd`)
- All communication with Neutralino goes through the global composable `@/composables/useNeutralinoCmd` — execute OS commands via `runCmd` (one-shot) or `spawnStream` (long-running/streaming process).
- Never call `Neutralino.os.*` directly from a component, store, or module composable — always go through `useNeutralinoCmd`.
- Always check for `window.NL_PORT` before touching native APIs, so calls fall back to a mock (`console.debug` only, no throw) in pure browser environments (dev server, unit tests).
- Prefer `spawnStream` over polling (`setInterval` + repeated `runCmd`) for long-running/live data: it keeps a single native process alive and pushes updates via the `spawnedProcess` event instead of re-spawning commands on an interval.

### 2. Cross-Platform OS Logic
- Isolate system-level actions (e.g. Windows PowerShell vs. Linux `systemctl`) inside the relevant flow's `modules/<feature>/composables/`, built on top of `useNeutralinoCmd`. Do not branch on OS inside components or views.

### 3. Page Header & Search Filters (`usePageHeader`)
- `usePageHeader` is a global Pinia store composable that drives the app's top header (title, subtitle, refresh button, and a `toolsComponent` slot for flow-specific tools).
- Each flow's **view** (in `modules/<flow>/views/`) is responsible for calling `setHeader(...)` on mount (and updating it via `watch` when relevant state changes) and `clearHeader()` on unmount.
- If a flow has a search/filter control, render it in the header rather than inline in the view body: pass the filter component via `toolsComponent` and its props/handlers via `toolsProps`. Event handlers can be passed as `onUpdate:xxx` keys inside `toolsProps`, since the header renders tools with `v-bind="toolsProps"`.
- Components rendered via `toolsComponent` should stay dumb/presentational and driven entirely by `toolsProps` — do not have them read the module store directly, so the same filter component keeps working both inline (props/emits) and in the header.

### 4. Store Pattern (Pinia)
- Use Setup Store syntax (`defineStore('name', () => { ... })`).
- Flow-specific state goes in `modules/<flow>/store.ts`; only truly cross-flow/global state goes in `src/stores`.
- Use `storeToRefs` when destructuring state/getters from any Pinia store to preserve reactivity.
- Use `refDebounced` from `@vueuse/core` for search inputs to avoid rapid refetches.
- Maintain clean Vue reactivity: do not mutate nested reactive state directly; go through store actions.

### 5. Vue Components
- Use strictly `<script setup lang="ts">` with `<template lang="pug">`.
- Build UI from primitive components in `@/components/ui` (shadcn-vue) and shared, generic controls in `@/components/shared`; only build a flow-specific component in `modules/<flow>/components` when it isn't reusable elsewhere.
- Keep flow-specific components dumb where possible (props in, events out) so they can be reused in different contexts (e.g. inline vs. in the page header).

### 6. Testing (Vitest + Playwright)
- Do not test simple wrappers/presentational components that just pass props/emit events with no real logic.
- Write **unit tests (Vitest)** for flows and components that contain actual logic worth verifying: store actions/getters with non-trivial logic, composables with branching/OS-specific behavior, filtering/formatting utilities, etc. Place them in the relevant `__tests__/` folder (global in `src/__tests__`, flow-specific in `modules/<flow>/__tests__`).
- Write **E2E tests (Playwright)** for critical user flows end-to-end (e.g. acknowledging an alert, starting/stopping a Docker container), not for every screen.
- When in doubt, ask "is there real logic here to break?" — if not, skip the test.

---

## Critical Rules

1. **No Emojis**: Do not use emojis in code, comments, commit messages, or documentation.
2. **Neutralino Execution Guard**: Always wrap native calls through `useNeutralinoCmd`, guarded by `window.NL_PORT`, so non-desktop environments do not crash.
3. **No Console Logs**: Use `console.debug` only for development mocks (e.g. inside `useNeutralinoCmd` fallbacks).
4. **Immutability**: Maintain clean Vue reactivity; do not mutate nested reactive state directly.
5. **Pug Templates Only**: All `<template>` blocks use `lang="pug"`.
6. **Respect the module boundary**: generic/reusable code in `src/{components,composables,stores}`; flow-specific code stays inside `modules/<flow>/`.
7. **Header-driven filters**: a flow's search/filter UI is wired through `usePageHeader`'s `toolsComponent`/`toolsProps`, set from that flow's view.
8. **Test what has logic**: no tests for trivial wrappers; unit tests (Vitest) for real logic, E2E (Playwright) for critical flows only.