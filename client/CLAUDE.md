# Nebula Dock — Client (Next.js)

## Stack
- Next.js 16, React 19, TypeScript 5
- Tailwind CSS 4 + tw-animate-css
- shadcn/ui + Base UI (@base-ui/react)
- clsx + tailwind-merge + class-variance-authority (class management)
- Lucide React (icons)
- Motion (animations)
- Zustand 5 (global state)
- next-intl (i18n)

## Testing
- Jest 30 + jest-environment-jsdom
- @testing-library/react
- Playwright (e2e)

## Linting
- ESLint 9 with eslint-config-next
- eslint-plugin-import + eslint-import-resolver-typescript
- eslint-plugin-better-tailwindcss

## Structure
- `app/` — App Router, one folder per feature
- `components/` — reusable components
- `hooks/` — custom hooks (useDaemons, useDocker, useOllama)
- `lib/` — pure logic (daemon.ts, docker.ts, ollama.ts)
- `i18n/` — next-intl configuration
- `messages/` — JSON translation files
- `e2e/` — Playwright tests

## System communication
- OS commands: `Neutralino.os.execCommand()`
- Only available at desktop runtime, never in SSR — always use `'use client'`
- Always check `typeof window !== 'undefined' && window.Neutralino` before use

## External APIs
- Docker: REST at `http://localhost:2375`
- Ollama: REST at `http://localhost:11434`
- Daemons: `systemctl` via execCommand

## Conventions
- Each feature has a folder in `app/` and a dedicated hook in `hooks/`
- No system logic inside components — keep it in `lib/`
- Use `pkexec` for sudo operations
- CSS classes: always use clsx + tailwind-merge via `cn()` helper