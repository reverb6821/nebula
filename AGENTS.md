<!-- AGENTS.md — ROOT -->
# Nebula Dock — Agent Rules

These rules are always active for every session in this repository.

## Before writing any code

1. Read `CLAUDE.md` for project overview and monorepo structure.
2. If working in `client/`, read `client/CLAUDE.md`.
3. If writing UI, activate the design skill: read `client/DESIGN.md` in full.

## Neutralino rules (mandatory)

### Runtime availability
- `window.Neutralino` is ONLY available at desktop runtime — never in SSR.
- Every file that uses Neutralino APIs must be `'use client'`.
- Always guard with:
```ts
  if (typeof window === 'undefined' || !window.Neutralino) return
```
- Never call Neutralino APIs in `useEffect` without this guard.

### System commands
- All OS commands go through `Neutralino.os.execCommand()`.
- Never use Node.js `child_process` — Neutralino is not Node.
- Commands that require elevated privileges use `pkexec`:
```ts
  await Neutralino.os.execCommand(`pkexec systemctl ${action} ${name}`)
```
- Always handle `stdErr` — do not assume commands succeed silently.

### File system
- Use `Neutralino.filesystem.*` for file operations, not Node `fs`.
- Paths must be absolute. Use `Neutralino.os.getPath('home')` as base.

### Extensions
- Extensions are separate processes communicating via WebSocket.
- Never put extension logic inside `client/` — it lives in `extensions/`.
- Extension communication goes through `Neutralino.extensions.dispatch()`.

### Config
- `neutralino.config.json` controls which APIs are exposed via `nativeAllowList`.
- Before using a new Neutralino API, verify it is listed in `nativeAllowList`.
- Never expose APIs that are not strictly needed.

## Monorepo rules (mandatory)

- Root dependencies (husky, commitlint, release-it, concurrently): `pnpm add -D -w <pkg>`
- Client dependencies: `pnpm --filter client add <pkg>`
- Never install Neutralino-only tooling as a pnpm dependency — use the `neu` CLI directly.
- Never run `pnpm install` inside `client/` — always from root.

## Commit rules (mandatory)

- Conventional Commits enforced by commitlint.
- Format: `type(scope): message`
- Scopes: `client`, `neutralino`, `extensions`, `config`, `deps`, `release`
- Examples:
  - `feat(client): add container stats panel`
  - `fix(neutralino): guard execCommand with pkexec for sudo ops`
  - `chore(deps): move husky to root`

## Output rules (mandatory)

- Ship complete files. No placeholder comments, no "// TODO: implement".
- No truncated output. If a file is long, write it in full.
- Never describe what code should do instead of writing it.