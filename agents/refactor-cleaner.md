# Refactor & Dead Code Cleaner Skill

This skill defines standards, procedures, and safety checklists for identifying and removing dead code, unused dependencies, duplicate UI components, and obsolete exports within the **Vue 3 / Neutralinojs Desktop Client**.

---

## When to Use

Reference this skill during:
- Periodic code refactoring and technical debt reduction
- Pre-release codebase audits
- Dead export detection (`knip`, `ts-prune`, `depcheck`)
- Component consolidation and style cleanup (TailwindCSS / `shadcn-vue`)

---

## Detection Workflows & Tools

### Recommended Commands
```bash
# Detect unused exports, files, and dependencies
npx knip

# Check for unused dependencies in package.json
npx depcheck

# Find unused TypeScript exports
npx ts-prune

# Audit unused ESLint rules or directive suppressions
npx eslint . --report-unused-disable-directives
```

---

## Refactoring Procedure

```
┌──────────────────────────────┐
│  1. Automated Detection      │ ──► Run knip, depcheck, ts-prune
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  2. Cross-Reference Audit    │ ──► Grep search, dynamic imports, & Neutralino IPC check
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  3. Incremental Batch Delete │ ──► Remove in isolated commits (deps -> exports -> files)
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  4. Verification & Logging   │ ──► Run Vitest & Playwright, document in DELETION_LOG.md
└──────────────────────────────┘
```

---

## Deletion Log Format

Document all deletions in `docs/DELETION_LOG.md` adhering to this template:

```markdown
# Code Deletion Log

## [YYYY-MM-DD] Refactor Session

### Unused Dependencies Removed
- `package-name@version`: Never used, size savings ~XX KB.

### Unused Files & Modules Deleted
- `src/modules/old-feature/`: Replaced by `src/modules/new-feature/`.

### Duplicate UI Components Consolidated
- `src/components/ui/LegacyButton.vue` -> Consolidated into `src/components/shared/SharedButton.vue`.

### Unused IPC Functions & Stores Removed
- `src/modules/daemons/composables/useLegacyCmd.ts`: Function `execOldCommand()`.

### Verification Metrics
- Unit Tests (Vitest): Passing
- E2E Tests (Playwright): Passing
- Build Check (`npm run type-check`): Clean
```

---

## Protected Codebase Areas (NEVER REMOVE)

Do NOT delete the following critical system-level components without explicit review:

1. **IPC Exec Base (`src/composables/useNeutralinoCmd.ts`)**: Fundamental bridge for running system subshells.
2. **Neutralino Guard Blocks (`window.NL_PORT`)**: Critical checks preventing dev server crashes in pure browser contexts.
3. **Cross-Platform Conditionals (`window.NL_OS`)**: Command switches for Windows (PowerShell) and Linux (`systemctl`).
4. **App Layout Wrappers**: Main navigation drawers, application frame, and theme providers.

---

## Critical Rules

1. **No Emojis**: Do not use emojis in commit messages, pull request summaries, or `DELETION_LOG.md`.
2. **Fail-Safe Testing**: Always run unit (`npm run test:unit`) and end-to-end (`npm run test:e2e`) suites after each deletion batch.
3. **Atomic Commits**: Group deletions by type (e.g., `refactor(cleanup): remove unused npm packages`, `refactor(cleanup): remove deprecated composables`).