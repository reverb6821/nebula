# Nebula Dock

Desktop app for managing system daemons, Docker containers, and Ollama models.
Stack: Neutralino (desktop wrapper) + Next.js (frontend) — pnpm monorepo

## Structure
- `client/` — Next.js frontend (see client/CLAUDE.md)
- `resources/` — Neutralino entry point (index.html, neutralino.js)
- `extensions/` — native C++ extensions (future)

## Root commands
- `pnpm dev` — starts Next.js + Neutralino in parallel
- `pnpm build` — builds Next.js + Neutralino package
- `pnpm add -D -w <pkg>` — add root dependency
- `pnpm --filter client add <pkg>` — add client dependency

## Tooling (root only)
- Husky + Commitlint: Conventional Commits enforcement
- lint-staged: runs ESLint on staged files before commit
- Release-it: versioning and changelog generation
- Neutralino CLI: `neu run` / `neu build`