# Restrained Cyberpunk Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update Nebula Dock's dark-only visual system to a restrained sci-fi cyberpunk style while preserving semantic Tailwind APIs, behavior, accessibility, and dense operational readability.

**Architecture:** Keep the existing Vue 3, Tailwind v4, shadcn-vue, and Pinia structure. Change the global semantic token layer first, then normalize shared primitives and shell components, and finally make targeted class changes in dashboard, process, daemon, Docker, and settings surfaces. Avoid replacing semantic classes with raw colors; add only a small set of reusable cyberpunk utilities.

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS v4, shadcn-vue primitives, class-variance-authority, Vitest, Vue Test Utils, vue-tsc, Vite.

**Spec:** `docs/superpowers/specs/2026-09-15-cyberpunk-visual-redesign-design.md`

## Global Constraints

- Preserve existing Vue, Pinia, Tailwind v4, shadcn-vue, and Neutralino architecture.
- Preserve semantic classes such as `bg-primary`, `text-warning`, and `border-destructive/40`; change their token values before changing call sites.
- Keep dark-only behavior.
- Keep user-configurable font family, font size, line height, reduced-motion, and high-contrast behavior working.
- Do not add broad gradients, persistent animated effects, or decorative elements that reduce information density.
- Do not use emojis in code, comments, or documentation.
- Keep tables, logs, process views, and status labels readable at the current application scale.
- Do not change stores, composables, data models, IPC commands, routing, or component APIs unless a styling inconsistency makes an API change necessary.
- Run commands from the repository root unless the command explicitly starts with `cd client`.

---

## File map

| File or area | Responsibility in this plan |
| --- | --- |
| `client/src/assets/main.css` | Semantic color, radius, typography, focus, panel, glow, reduced-motion, and high-contrast tokens/utilities |
| `client/DESIGN.md` | Human-readable cyberpunk design contract |
| `client/src/components/ui/button/index.ts` and `Button.vue` | Shared button variants and state styling |
| `client/src/components/ui/card/*.vue` | Shared panel/card surface hierarchy |
| `client/src/components/ui/sidebar/*.vue` | Sidebar tokens and navigation state styling |
| `client/src/components/ui/badge/Badge.vue`, `input/Input.vue`, `dialog/*.vue`, `alert/*.vue`, `separator/Separator.vue` | Shared controls that must consume semantic cyberpunk tokens |
| `client/src/components/shared/SharedButton.vue` and `SharedAlert.vue` | Application-specific shared wrappers |
| `client/src/components/layout/AppLayout.vue`, `AppSidebar.vue`, `NavMain.vue`, `Footer.vue` | Global shell, navigation, and framing |
| `client/src/modules/dashboard/components/*` and `views/DashboardView.vue` | First feature surface and chart/telemetry treatment |
| `client/src/modules/process/components/*` | Dense table and status readability |
| `client/src/modules/daemons/components/*` | Service status, filters, and action treatment |
| `client/src/modules/docker/components/*` | Container/image cards, logs, and dialogs |
| `client/src/modules/settings/components/*` and `views/SettingsView.vue` | Appearance settings and final feature-surface normalization |

## Verification commands

```bash
cd client && bun run test:unit -- --run
cd client && bun run type-check
cd client && bun run build
```

The repository's existing scripts use the client package commands above. Do not
add a visual testing dependency for this redesign.

---

### Task 1: Establish cyberpunk semantic tokens and reusable effects

**Files:**
- Modify: `client/src/assets/main.css`
- Modify: `client/DESIGN.md`
- Test: `client/src/assets/main.css` through the existing client type-check/build and manual class inspection; no new test file is required for static CSS tokens.

**Interfaces:**
- Consumes: Existing semantic CSS variables and Tailwind `@theme inline` mappings.
- Produces: Stable semantic tokens plus reusable classes/variables for panel surfaces, active signals, controlled glow, focus states, reduced motion, and high contrast.

- [ ] **Step 1: Record the existing token consumers before editing**

Run:

```bash
rg -n "bg-(background|card|popover|primary|secondary|accent)|text-(foreground|muted-foreground|primary|warning|success|destructive)|border-(border|input|destructive)|ring-(ring|primary)" client/src
```

Use the result to ensure the redesign continues to serve existing semantic class names rather than introducing raw color literals in feature components.

- [ ] **Step 2: Replace the muted palette with the approved restrained cyberpunk palette**

In `client/src/assets/main.css`, update both `:root` and `.dark` with synchronized values for:

```css
--background: #070B12;
--foreground: #D7E2EC;
--card: #0E1622;
--card-foreground: #D7E2EC;
--popover: #121D2B;
--popover-foreground: #D7E2EC;
--primary: #28D7E5;
--primary-foreground: #041117;
--secondary: #5C5BE8;
--secondary-foreground: #F1F3FF;
--muted: #101A27;
--muted-foreground: #8EA4B8;
--accent: #142B3A;
--accent-foreground: #D7E2EC;
--destructive: #F05B78;
--destructive-foreground: #19060D;
--success: #3FE0A0;
--success-foreground: #041A14;
--warning: #F0B35A;
--warning-foreground: #211304;
--border: #203449;
--input: #172638;
--ring: #28D7E5;
--chart-1: #28D7E5;
--chart-2: #8B7CFF;
--chart-3: #3FE0A0;
--chart-4: #F0B35A;
--chart-5: #F05B78;
```

Keep sidebar variables aligned with the same palette: background-like `--sidebar`,
cyan `--sidebar-primary`, low-contrast selected `--sidebar-accent`, and the same
border/ring tokens.

- [ ] **Step 3: Add restrained panel and signal variables to `@theme inline`**

Add only variables needed by shared classes, for example:

```css
--shadow-cyber-panel: 0 0 0 1px color-mix(in srgb, var(--primary) 12%, transparent);
--shadow-cyber-signal: 0 0 18px color-mix(in srgb, var(--primary) 22%, transparent);
```

Expose matching utility names only if Tailwind v4 generates them reliably; otherwise define narrowly scoped CSS classes such as `.cyber-panel` and `.cyber-signal` in `@layer components`.

- [ ] **Step 4: Add accessibility-safe reusable classes**

Define these classes in `@layer components`:

```css
.cyber-panel {
  @apply border border-border/90 bg-card;
}

.cyber-signal {
  @apply border-primary/60 shadow-[0_0_18px_color-mix(in_srgb,var(--primary)_22%,transparent)];
}

.cyber-label {
  @apply font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-muted-foreground;
}
```

Do not apply `.cyber-signal` globally. Ensure `html.reduce-motion` removes any
transition/animation added by these classes, and ensure `html.high-contrast`
continues to override borders and text after the new component layer.

- [ ] **Step 5: Update `client/DESIGN.md`**

Replace the old restrained atmospheric palette and “no saturated or neon colors”
wording with:

- deep blue-black background and elevated technical panels;
- cyan primary signal and muted violet secondary signal;
- magenta/red reserved for destructive/status meaning;
- glow only on focus, active navigation, primary actions, and selected telemetry;
- no persistent animated scanlines, CRT distortion, or global noise;
- contrast, reduced-motion, and high-contrast requirements.

- [ ] **Step 6: Run the static verification for the token layer**

Run:

```bash
cd client && bun run type-check
cd client && bun run build-only
```

Expected: both commands pass without changing runtime behavior.

- [ ] **Step 7: Commit the token and documentation layer**

```bash
git add client/src/assets/main.css client/DESIGN.md
git commit -m "feat(client): add cyberpunk semantic theme" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 2: Normalize shared primitives and wrappers

**Files:**
- Modify: `client/src/components/ui/button/index.ts`
- Modify: `client/src/components/ui/button/Button.vue`
- Modify: `client/src/components/ui/card/Card.vue`, `CardHeader.vue`, `CardContent.vue`, `CardFooter.vue`, `CardTitle.vue`, `CardDescription.vue`, `CardAction.vue`
- Modify: `client/src/components/ui/badge/Badge.vue`
- Modify: `client/src/components/ui/input/Input.vue`
- Modify: `client/src/components/ui/alert/Alert.vue`, `AlertTitle.vue`, `AlertDescription.vue`
- Modify: `client/src/components/ui/dialog/DialogContent.vue`, `DialogOverlay.vue`, `DialogHeader.vue`, `DialogFooter.vue`
- Modify: `client/src/components/ui/separator/Separator.vue`
- Modify: `client/src/components/shared/SharedButton.vue`, `SharedAlert.vue`
- Test: Existing shared component tests if present; otherwise `cd client && bun run test:unit -- --run`

**Interfaces:**
- Consumes: Semantic variables and `.cyber-panel`/`.cyber-signal` utilities from Task 1.
- Produces: Existing component APIs with consistent cyberpunk surfaces, focus rings, disabled states, and status variants.

- [ ] **Step 1: Inspect primitive APIs and preserve their public props**

Run:

```bash
sed -n '1,240p' client/src/components/ui/button/Button.vue
sed -n '1,220p' client/src/components/ui/card/CardHeader.vue
sed -n '1,220p' client/src/components/ui/badge/Badge.vue
```

Do not rename props, slots, emitted events, or variant keys.

- [ ] **Step 2: Update button variants to consume the new semantic states**

Keep the existing `default`, `destructive`, `outline`, `secondary`, `ghost`, and
`link` variant names. Restructure classes so:

```ts
default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-[0_0_14px_color-mix(in_srgb,var(--primary)_18%,transparent)]"
outline: "border border-border bg-transparent hover:border-primary/60 hover:bg-accent hover:text-accent-foreground"
secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/85"
ghost: "hover:border-border/70 hover:bg-accent hover:text-accent-foreground"
```

Retain the existing invalid-state and focus-visible selectors, but ensure the
focus ring uses `ring-ring` and remains visible on primary and destructive
surfaces.

- [ ] **Step 3: Normalize cards and controls**

Use `cyber-panel` or equivalent semantic classes for cards, dialog content,
alerts, inputs, badges, and separators. Keep spacing and slot structure unchanged.
Use `bg-input`, `border-input`, `text-muted-foreground`, and status tokens rather
than raw hex values.

- [ ] **Step 4: Update shared wrappers without changing behavior**

In `SharedButton.vue`, retain loading and icon behavior while removing duplicate
visual classes that conflict with the primitive. In `SharedAlert.vue`, keep the
existing alert type mapping and apply consistent status borders/backgrounds.

- [ ] **Step 5: Run shared component tests and type-check**

Run:

```bash
cd client && bun run test:unit -- --run
cd client && bun run type-check
```

Expected: all existing tests pass and all shared component props remain type-safe.

- [ ] **Step 6: Commit shared primitive changes**

```bash
git add client/src/components/ui client/src/components/shared
git commit -m "feat(client): style shared primitives for cyberpunk theme" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 3: Apply the visual system to the shell and sidebar

**Files:**
- Modify: `client/src/components/layout/AppLayout.vue`
- Modify: `client/src/components/layout/AppSidebar.vue`
- Modify: `client/src/components/layout/NavMain.vue`
- Modify: `client/src/components/layout/Footer.vue`
- Modify: `client/src/components/ui/sidebar/Sidebar.vue`, `SidebarContent.vue`, `SidebarHeader.vue`, `SidebarFooter.vue`, `SidebarMenuButton.vue`, `SidebarSeparator.vue`, `SidebarInset.vue`
- Test: Existing layout tests, if present; otherwise full unit suite

**Interfaces:**
- Consumes: Shared primitive variants and cyberpunk tokens from Tasks 1-2.
- Produces: A consistent technical-console frame while preserving navigation, refresh, sidebar collapse, and footer behavior.

- [ ] **Step 1: Capture current shell behavior before class edits**

Run:

```bash
sed -n '1,260p' client/src/components/layout/AppLayout.vue
sed -n '1,300p' client/src/components/layout/AppSidebar.vue
sed -n '1,220p' client/src/components/layout/NavMain.vue
```

Record existing slots, route bindings, button handlers, and sidebar state props.

- [ ] **Step 2: Style the application frame**

Use `bg-background`, `border-border`, and `cyber-panel` for the header/sidebar
boundaries. Keep content spacing, overflow behavior, refresh action, page title,
and router links unchanged. Use the primary signal only for active/focused
navigation and the main refresh/action affordance.

- [ ] **Step 3: Style sidebar active and inactive states**

Update `SidebarMenuButton` and `NavMain` classes so active items use a subtle
cyan border/inset signal and `bg-sidebar-accent`, while inactive items use muted
foreground and low-contrast hover. Do not add persistent glow to every item.

- [ ] **Step 4: Preserve accessibility and reduced-motion behavior**

Ensure focus-visible styles are present on navigation controls, sidebar trigger,
and refresh controls. Do not add transitions that bypass the existing
`html.reduce-motion` rules.

- [ ] **Step 5: Run targeted validation**

Run:

```bash
cd client && bun run test:unit -- --run
cd client && bun run type-check
```

Expected: navigation-related tests and the complete current unit suite pass.

- [ ] **Step 6: Commit shell changes**

```bash
git add client/src/components/layout client/src/components/ui/sidebar
git commit -m "feat(client): frame app shell as cyberpunk console" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 4: Normalize dashboard telemetry surfaces

**Files:**
- Modify: `client/src/modules/dashboard/components/DashboardCard.vue`
- Modify: `client/src/modules/dashboard/components/KpiCard.vue`
- Modify: `client/src/modules/dashboard/components/SparkLineChart.vue`
- Modify: `client/src/modules/dashboard/views/DashboardView.vue`
- Modify: dashboard chart color references under `client/src/modules/dashboard`
- Test: Existing dashboard component tests and dashboard store/composable tests

**Interfaces:**
- Consumes: Shared card/badge/button primitives and `--chart-*`/semantic tokens.
- Produces: Readable telemetry panels with cyan/violet chart hierarchy and status colors that remain meaningful without color alone.

- [ ] **Step 1: Inventory dashboard visual literals and chart mappings**

Run:

```bash
rg -n "#[0-9A-Fa-f]{6}|rgb\\(|hsl\\(|bg-|text-|border-|shadow-" client/src/modules/dashboard
```

Classify each match as surface, text, status, chart, or layout styling before editing.

- [ ] **Step 2: Update dashboard cards and KPI states**

Apply `cyber-panel` to dashboard cards, retain current grid/spacing, and use:

```text
primary telemetry -> text-primary / border-primary/40
healthy state     -> text-success / border-success/40
warning state     -> text-warning / border-warning/40
critical state    -> text-destructive / border-destructive/40
secondary metadata -> text-muted-foreground
```

Keep metric labels and values accessible and do not replace status labels with
color-only indicators.

- [ ] **Step 3: Centralize chart colors**

Use CSS variables or the existing chart token mechanism for chart series:

```css
var(--chart-1)
var(--chart-2)
var(--chart-3)
var(--chart-4)
var(--chart-5)
```

Do not leave duplicate raw neon values in chart components.

- [ ] **Step 4: Preserve chart behavior and loading/empty states**

Do not change props, reactive data, polling, tooltip content, SVG dimensions, or
empty/loading branches. Only change classes, CSS variables, and visual wrappers.

- [ ] **Step 5: Run dashboard tests and type-check**

Run:

```bash
cd client && bun run test:unit -- --run src/modules/dashboard
cd client && bun run type-check
```

Expected: all dashboard tests pass with unchanged data and rendering contracts.

- [ ] **Step 6: Commit dashboard styling**

```bash
git add client/src/modules/dashboard
git commit -m "feat(client): style dashboard telemetry surfaces" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 5: Normalize process, daemon, and Docker operational surfaces

**Files:**
- Modify: `client/src/modules/process/components/*.vue`
- Modify: `client/src/modules/daemons/components/*.vue`
- Modify: `client/src/modules/docker/components/*.vue`
- Test: Existing process, daemon, and Docker unit tests

**Interfaces:**
- Consumes: Shared primitive variants, status tokens, panel utilities, and chart-independent semantic colors.
- Produces: Consistent high-density operational views with readable state/action hierarchy.

- [ ] **Step 1: Inventory raw visual classes in operational modules**

Run:

```bash
rg -n "#[0-9A-Fa-f]{6}|bg-|text-|border-|shadow-|ring-" client/src/modules/process client/src/modules/daemons client/src/modules/docker
```

Group matches by table, status badge, action control, card, log, and dialog.

- [ ] **Step 2: Update process tables and status controls**

Use semantic table surfaces (`bg-card`, `bg-accent`, `border-border`), mono
typography for process IDs/metrics, and status tokens for running/stopped/error
states. Preserve sorting, pagination, selection, action handlers, and row
highlight behavior.

- [ ] **Step 3: Update daemon cards, filters, and status badges**

Use the shared panel treatment for daemon cards/items, semantic status borders,
and primary signal only for selected/favorite/action states. Preserve static
daemon protection, filtering, pagination, and loading/error UI.

- [ ] **Step 4: Update Docker cards, logs, and dialogs**

Use panel tokens for container/image cards, terminal-like mono styling for logs,
and restrained primary/destructive emphasis for pull, start, stop, remove, and
cancel actions. Preserve log selection, refresh/error behavior, and dialog
semantics.

- [ ] **Step 5: Run focused module tests**

Run:

```bash
cd client && bun run test:unit -- --run src/modules/process src/modules/daemons src/modules/docker
cd client && bun run type-check
```

Expected: process, daemon, and Docker logic tests pass without changes to stores
or composables.

- [ ] **Step 6: Commit operational surface styling**

```bash
git add client/src/modules/process client/src/modules/daemons client/src/modules/docker
git commit -m "feat(client): style operational cyberpunk surfaces" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 6: Normalize settings and verify accessibility overrides

**Files:**
- Modify: `client/src/modules/settings/components/*.vue`
- Modify: `client/src/modules/settings/views/SettingsView.vue`
- Modify: `client/src/assets/main.css` only if override ordering needs a narrowly scoped correction
- Test: Existing settings tests, if present; otherwise full unit suite

**Interfaces:**
- Consumes: Global tokens and shared controls from Tasks 1-2.
- Produces: Settings UI that exposes the new appearance without breaking font, line-height, reduced-motion, or high-contrast controls.

- [ ] **Step 1: Inspect appearance settings and class overrides**

Run:

```bash
rg -n "font|line-height|reduce-motion|high-contrast|appearance|bg-|text-|border-" client/src/modules/settings client/src/assets/main.css
```

Trace each setting from control to store/state mutation to DOM class or CSS variable.

- [ ] **Step 2: Apply semantic cyberpunk styling to settings controls**

Use shared button, input, select, switch, card, and alert variants. Keep labels,
descriptions, keyboard interaction, and current setting values unchanged.

- [ ] **Step 3: Verify override ordering**

Confirm in `main.css` that:

```css
html.reduce-motion * { ... }
html.high-contrast * { ... }
```

still override transitions, animations, borders, and text after the new cyberpunk
component layer. Add only the minimal selector/order change needed if a new
utility wins incorrectly.

- [ ] **Step 4: Run settings tests and type-check**

Run:

```bash
cd client && bun run test:unit -- --run
cd client && bun run type-check
```

Expected: full unit suite and type-check pass, including existing appearance
setting behavior.

- [ ] **Step 5: Commit settings and override verification**

```bash
git add client/src/modules/settings client/src/assets/main.css
git commit -m "feat(client): finish cyberpunk settings surfaces" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

### Task 7: Run final regression checks and review the diff

**Files:**
- Review: all files changed by Tasks 1-6
- Test: full client unit suite, type-check, and production build

**Interfaces:**
- Consumes: Completed visual redesign layers.
- Produces: Verified implementation with no behavior or build regressions.

- [ ] **Step 1: Run the complete unit suite**

Run:

```bash
cd client && bun run test:unit -- --run
```

Expected: all existing test files and tests pass.

- [ ] **Step 2: Run type-check and production build**

Run:

```bash
cd client && bun run type-check
cd client && bun run build
```

Expected: both commands pass without new TypeScript or Vite errors.

- [ ] **Step 3: Review changed classes for prohibited styling**

Run:

```bash
rg -n "scanline|crt|noise|animate-|shadow-\\[|#[0-9A-Fa-f]{6}" client/src client/DESIGN.md
git diff --check
git diff --stat
```

Review every match. Remove any persistent decorative animation, uncentralized
feature color literal, or class that bypasses reduced-motion/high-contrast rules.

- [ ] **Step 4: Review behavior boundaries**

Run:

```bash
git diff -- client/src/modules/*/stores client/src/stores client/src/composables
```

Expected: no store, composable, IPC, routing, or data-flow changes are present.

- [ ] **Step 5: Confirm final worktree scope**

Run:

```bash
git status --short
```

Keep unrelated pre-existing changes untouched, including the existing
`client/src/__tests__/App.spec.ts` modification noted during exploration.

