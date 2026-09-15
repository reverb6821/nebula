# Contributing to Nebula Dock

Thank you for contributing to Nebula Dock. This guide describes the local
development setup, validation requirements, Git workflow, and release
handoff.

## Local setup

Install Git, Bun 1.4.0 or a compatible Bun release, Node.js
`^22.18.0 || >=24.12.0`, the Neutralino CLI, and git-flow-next.

Clone the repository and install dependencies from the repository root:

```bash
git clone <repository-url>
cd nebula
bun install
git flow config sync
```

The `git flow config sync` command requires git-flow-next. It copies the
committed `.gitflow` configuration into the local Git configuration so that
branch operations use the repository's shared workflow.

## Development

### Browser development

Start the Vite client from the repository root:

```bash
bun --cwd client run dev
```

This mode is useful for browser-based UI work and client-side development.

### Desktop development

Start the Neutralino desktop runtime from the repository root:

```bash
neu run
```

Use the desktop runtime when testing native APIs, operating-system commands,
filesystem access, or window behavior. Native calls must use the existing
`useNeutralinoCmd` composable and must remain guarded when the application runs
outside Neutralino.

## Validation before a pull request

Run the relevant checks from the repository root:

```bash
bun --cwd client run type-check
bun --cwd client run lint
bun --cwd client run test:unit -- --run
bun --cwd client run test:e2e
bun --cwd client run build
```

Playwright may require browser installation on a new machine. Desktop-only
behavior must be tested with `neu run`; browser-only tests cannot provide
Neutralino runtime coverage.

## Commit messages

Commitlint enforces Conventional Commits. The configured commit types are:

```text
chore, docs, ticket, feat, fix, perf, refactor, revert, style
```

Use one of the repository scopes:

```text
client, neutralino, extensions, config, deps, release
```

Examples:

```text
feat(client): add process filter
fix(neutralino): guard native command execution
docs(release): document release handoff
```

Husky runs lint-staged before commits and Commitlint on commit messages.

## Branch workflow

The repository uses `main` for production and `develop` for integration.
Feature, release, and hotfix branches are managed with git-flow-next. Pull
Requests are the integration mechanism; local `finish` commands must not be
used as a substitute for review.

### Feature branches

Start from the current integration branch:

```bash
git switch develop
git pull --ff-only origin develop
git flow feature start <short-name>
git flow feature publish <short-name>
```

Update a feature branch when needed:

```bash
git flow feature update --rebase
```

Open a Pull Request against `develop`. After the Pull Request has been merged,
the local feature branch can be removed with the appropriate git-flow-next
cleanup command. Do not use local branch finishing to bypass the Pull Request.

### Release branches

Start release preparation from `develop`:

```bash
git flow release start <version>
git flow release publish <version>
```

Open a Pull Request from the release branch into `main`. Release and hotfix
branches do not create tags automatically. Release-it is the single authority
for version updates and tag creation, so run the existing release workflow only
after the reviewed change is ready and do not create a second tag through
git-flow-next.

### Hotfix branches

Start an urgent production fix from `main`:

```bash
git flow hotfix start <name>
git flow hotfix publish <name>
```

Open a Pull Request into `main`. After the fix is merged, use Release-it for
any version update and tag creation, then synchronize the resulting production
change back into `develop`.

## Pull request expectations

Pull Requests should include:

- A focused description of the problem and the change.
- A linked issue when one exists.
- The validation commands that were run and their results.
- Screenshots or recordings when UI behavior changes.
- Any Neutralino runtime, platform, or permission requirements.

Keep unrelated refactors out of feature Pull Requests. Update the relevant
documentation when commands, workflows, or public contributor behavior
changes.

## Troubleshooting

### Shared branch configuration is stale

Synchronize the committed configuration again:

```bash
git flow config sync
git flow config status
```

### Neutralino APIs are unavailable

Run the application with `neu run` instead of only using the Vite browser
server. Confirm that the required API is present in
`neutralino.config.json` and that native calls are guarded outside the desktop
runtime.

### Playwright browsers are missing

Install the browsers required by the local Playwright setup, then rerun:

```bash
bun --cwd client run test:e2e
```

### A native command fails

Inspect the command's stderr and the user-visible error path. Native command
failures must not be treated as successful empty results, and privileged
operations must follow the existing Neutralino command conventions.
