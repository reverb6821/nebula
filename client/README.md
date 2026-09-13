# Nebula Dock Client

The `client/` package is the Vue 3 frontend for Nebula Dock. It uses the
Composition API with TypeScript, Vite, Pinia, Pinia Colada, Tailwind CSS,
shadcn-vue/Reka UI components, vue-i18n, and the Neutralino client library.
Vitest provides unit tests and Playwright provides end-to-end tests.

## Commands

Run commands from the repository root with `bun --cwd client run <script>`, or
change into `client/` and use `bun run <script>`:

```bash
bun run dev
bun run build
bun run type-check
bun run lint
bun run test:unit
bun run test:e2e
bun run preview
```

The `build` script runs type checking and the Vite production build. The
frontend development server is useful for browser work; use `neu run` from the
repository root when testing native Neutralino behavior.

## Source structure

| Path | Responsibility |
| --- | --- |
| `src/components/` | Shared layout, reusable components, and UI primitives |
| `src/composables/` | Shared stateful logic and Neutralino command helpers |
| `src/modules/` | Feature-specific views, components, stores, and composables |
| `src/stores/` | Application-wide Pinia stores |
| `src/i18n/` | Localized messages and i18n setup |
| `src/router/` | Vue Router configuration |
| `src/types/` | Shared TypeScript types |

Keep system-specific logic inside the relevant module composables. Reuse
existing shared components and primitives instead of introducing duplicate UI
patterns.

## Neutralino safety

Files that use Neutralino APIs must be client-only. Guard native access when
the application runs in a browser or another non-desktop environment:

```ts
if (typeof window === 'undefined' || !window.Neutralino) return
```

Execute operating-system commands through the existing
`useNeutralinoCmd` composable. Use Neutralino filesystem APIs for file
operations; do not use Node.js `child_process` or filesystem APIs in client
code. Check command stderr and surface failures instead of treating an empty
result as success.

## Design guidelines

Read [`DESIGN.md`](DESIGN.md) before changing the user interface. It defines
the visual language, typography, layout, color, and component conventions for
the client.
