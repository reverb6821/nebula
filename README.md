# Nebula Dock

Nebula Dock is a desktop control center for managing system daemons, Docker
containers, processes, and desktop resources such as Ollama models. It combines
a Vue 3 and Vite frontend with a Neutralinojs desktop runtime.

The repository is a Bun-managed monorepo. The frontend lives in `client/`;
Neutralino packages the built frontend as a desktop application.

## Repository layout

| Path | Purpose |
| --- | --- |
| `client/` | Vue 3 and Vite frontend |
| `resources/` | Neutralino entry resources |
| `extensions/` | Workspace for future native extensions |
| `neutralino.config.json` | Neutralino desktop runtime configuration |
| `CONTRIBUTING.md` | Contributor workflow and development standards |
| `client/DESIGN.md` | Frontend visual design guidelines |

## Prerequisites

- Git
- Bun 1.4.0 or a compatible Bun release
- Node.js `^22.18.0 || >=24.12.0` for the client toolchain
- The Neutralino CLI (`neu`)
- [git-flow-next](https://github.com/gittower/git-flow-next), installed as
  the external `git flow` command

Install dependencies from the repository root:

```bash
bun install
```

After installing git-flow-next, activate the repository's shared branch
configuration:

```bash
git flow config sync
```

## Development

Run the Vite client in a browser:

```bash
bun --cwd client run dev
```

Run the desktop application with Neutralino:

```bash
neu run
```

Use `neu run` when working on behavior that depends on native Neutralino APIs.

## Commands

Run these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `bun run prepare` | Initialize repository hooks through Husky |
| `bun run release` | Start the existing Release-it release workflow |
| `bun --cwd client run build` | Type-check and build the client |
| `bun --cwd client run type-check` | Run Vue/TypeScript type checking |
| `bun --cwd client run lint` | Run the client lint tasks |
| `bun --cwd client run test:unit` | Run Vitest unit tests |
| `bun --cwd client run test:e2e` | Run Playwright end-to-end tests |
| `bun --cwd client run preview` | Preview the built Vite client |

The root package currently does not expose `dev` or `build` scripts. Use the
client commands above for frontend work and `neu run` for the desktop runtime.

## Git workflow

Use `develop` as the integration branch and `main` as the production branch.
Create `feature/*`, `release/*`, and `hotfix/*` branches with git-flow-next.
Open a Pull Request for every integration change; local branch commands do not
replace review.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete contributor workflow
and [client/README.md](client/README.md) for frontend-specific guidance.

## License

Nebula Dock is distributed under the terms in [LICENSE](LICENSE).
