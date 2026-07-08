# Nebula Dock — UI (Vue 3)

## Stack
- Vue 3 (Composition API, `<script setup>`) + TypeScript 5
- Vite 6
- Tailwind CSS 4
- shadcn-vue + class-variance-authority (component variants)
- clsx + tailwind-merge (class management via `cn()`)
- Lucide Vue Next (icons)
- Pinia 3 (global state)
- Vue Router 4
- VueUse (composable utilities)
- Chart.js + vue-chartjs (container stats charts)

## Testing
- Vitest + @vue/test-utils (unit)
- Playwright (e2e)

## Linting
- ESLint 9 with eslint-plugin-vue + typescript-eslint
- eslint-plugin-import + eslint-import-resolver-typescript
- eslint-plugin-better-tailwindcss

## Commands
```bash
pnpm dev        # Vite dev server on :5173
pnpm build      # vue-tsc --noEmit + vite build → dist/
pnpm test       # vitest
pnpm lint       # ESLint
pnpm typecheck  # vue-tsc --noEmit
```

## Structure
- `modules/` — one folder per domain (daemons, docker, ollama)
- `components/` — shared/layout components; `components/ui/` for shadcn-vue (do not edit)
- `composables/` — app-wide composables (Neutralino wrapper, sudo helper)
- `stores/` — global Pinia stores (app state, theme)
- `router/` — Vue Router config
- `lib/` — pure logic (daemon.ts, docker.ts, ollama.ts) — no Vue imports here

## Module structure
Each module under `modules/` follows the same shape:
```
<module>/
├── store.ts          # use<Module>Store() — Pinia, one per module
├── composables/      # async logic, all system/fetch calls
├── views/            # routed page components (suffix: View.vue)
└── components/       # presentational components, props-in/emit-out
```

## System communication
- OS commands: `Neutralino.os.execCommand()`
- Only available at desktop runtime — always guard with `window.NL_VERSION` before use
- Never call Neutralino directly from components or stores — use `composables/useNeutralinoCmd.ts`

## External APIs
- Docker: CLI via `execCommand` with `--format json` (future: REST at `http://localhost:2375`)
- Ollama: REST at `http://localhost:11434` — fetch directly, no proxy needed
- Daemons: `systemctl` / `launchctl` via `execCommand`

## Conventions
- Each feature has a folder in `modules/` and a dedicated store + composables
- No system/fetch logic inside components — keep it in `lib/` or module `composables/`
- Use `pkexec` for privilege escalation on Linux, never pass passwords as CLI args
- CSS classes: always use `cn()` (clsx + tailwind-merge) — never raw string concatenation
- Use `storeToRefs()` when destructuring reactive state from Pinia stores
- shadcn-vue components: add via `pnpm dlx shadcn-vue@latest add <component>`, never edit `components/ui/` directly