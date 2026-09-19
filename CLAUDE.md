# CLAUDE.md - Assistant Guidelines for Nebula Dock (root)

This document defines the guidelines and workflows for AI assistants working on this repository at the **root/monorepo level**. Frontend-specific conventions (Vue 3, components, stores, IPC) live in `client/CLAUDE.md` — read that file too when working inside `client/`.

---

## Project Overview

**Nebula Dock** is a desktop client for PC resource management and system diagnostics, and for Docker container/image management.

Main areas of the app:
- **Resources monitoring**: daemons/services, running processes, and a dashboard with live system statistics.
- **Docker management**: containers and images (start/stop, inspect, logs, etc.).

### Monorepo structure
This is a Bun workspaces monorepo:
- `client/` — Vue 3 frontend (Composition API, Pinia, TailwindCSS, shadcn-vue). See `client/CLAUDE.md` for detailed frontend conventions.
- root — Neutralinojs shell, tooling, and release/build configuration that wraps the built client into the desktop app.

- **Package Manager**: bun (`packageManager: bun@1.4.0`)
- **Desktop Runtime**: Neutralinojs
- **Git Hooks**: Husky + lint-staged
- **Commit Convention**: Conventional Commits, enforced via commitlint
- **Releases**: release-it

---

## Commands & Workflows (root)

```bash
# Install deps (run from repo root, installs all workspaces)
bun install

# Run lint-staged manually (normally triggered by Husky pre-commit hook)
bun run lint-staged

# Cut a new release (versioning, changelog, tag) via release-it
bun run release

# Production build: builds the Neutralino client bundle, then packages
# the Neutralino app embedding the built resources
bun run build:prod
```

For frontend-only commands (dev server, unit/E2E tests, type-check, lint), see `client/CLAUDE.md`.

---

## Architecture & Code Conventions

### 1. Workspaces
- `client` is declared under `"workspaces"` in the root `package.json`. Do not duplicate root-level tooling (husky, commitlint, release-it) inside `client/` — it belongs at the repo root and applies to the whole monorepo.

### 2. Neutralino Shell
- `build:prod` first builds the client (`neu run build` from within `client/`), then builds the Neutralino app from the root with `neu build --embeded-resources`, embedding the client's build output into the native app.
- Native/OS-level integration code (IPC, process execution, cross-platform logic) lives in the client under `@/composables/useNeutralinoCmd` and module-level composables — see `client/CLAUDE.md`.

### 3. Commits & Releases
- Commits must follow Conventional Commits (enforced by commitlint via Husky's commit-msg hook).
- Husky's pre-commit hook runs `lint-staged` to lint/format staged files before committing.
- Releases (version bump, changelog, git tag) are cut with `release-it` — do not manually edit version numbers or changelogs.

---

## Critical Rules

1. **No Emojis**: Do not use emojis in code, comments, commit messages, or documentation.
2. **Neutralino Execution Guard**: Always wrap native calls so non-desktop environments do not crash.
3. **No Console Logs**: Use `console.debug` only for development mocks.
4. **Immutability**: Maintain clean Vue reactivity; do not mutate nested reactive state directly.
5. **Conventional Commits**: All commits must pass commitlint; do not bypass Husky hooks.
6. **Frontend rules live in `client/CLAUDE.md`**: keep Vue/component/store-specific conventions there, not duplicated here.