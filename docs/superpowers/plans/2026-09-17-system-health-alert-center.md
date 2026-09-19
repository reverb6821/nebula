# System Health Alert Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Alert Center that evaluates fixed system-health presets, tracks alert lifecycles, notifies the user, and exports session events while Nebula Dock is open.

**Architecture:** Reuse the existing dashboard, process, daemon, filesystem, sensor, and network collectors through a monitoring coordinator. Keep rule evaluation pure and framework-independent, keep lifecycle state in a Pinia store, and isolate Neutralino notifications/export from collection and evaluation.

**Tech Stack:** Vue 3 Composition API, TypeScript, Pinia, VueUse, NeutralinoJS, vue-i18n, Vitest, Vue Test Utils, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-17-system-health-alert-center-design.md`

## Global Constraints

- Monitor only while Nebula Dock is open; do not add a native background service.
- Do not add Ollama monitoring or model-management behavior.
- Use fixed, safe presets; do not add an editable rule builder.
- Do not persist continuous raw metrics or introduce a database.
- Reuse existing collectors and `useNeutralinoCmd`; do not create a second OS-command layer.
- Guard every Neutralino-only operation so browser previews and tests remain safe.
- Treat unavailable sources as degraded/stale, never as healthy fallback values.
- Use `<script setup lang="ts">`, Pinia setup stores, existing shared UI primitives, and `vue-i18n`.
- Preserve the repository rule of no emojis in code, comments, commit messages, or documentation.
- Keep unrelated existing worktree changes untouched.

## File Map

### New files

- `client/src/types/alert.ts` — normalized snapshots, preset, lifecycle, source-health, and export types.
- `client/src/modules/alerts/utils/alertPresets.ts` — fixed presets for resources, storage, processes, services, temperatures, and network.
- `client/src/modules/alerts/utils/evaluateAlert.ts` — pure threshold, duration, deduplication, resolution, and cooldown evaluator.
- `client/src/modules/alerts/utils/serializeAlertLog.ts` — deterministic export serialization.
- `client/src/modules/alerts/store.ts` — Pinia state for events, source degradation, filters, and monitoring status.
- `client/src/modules/alerts/composables/useAlertMonitor.ts` — polling coordinator and source normalization.
- `client/src/modules/alerts/composables/useAlertNotifications.ts` — guarded Neutralino desktop notification adapter.
- `client/src/modules/alerts/composables/useAlertExport.ts` — export adapter using the existing filesystem/runtime conventions.
- `client/src/modules/alerts/components/AlertSummary.vue` — counts and monitoring/degraded-source summary.
- `client/src/modules/alerts/components/AlertFilters.vue` — lifecycle, category, and severity filters.
- `client/src/modules/alerts/components/AlertList.vue` — filtered alert list.
- `client/src/modules/alerts/components/AlertDetail.vue` — selected alert timeline and actions.
- `client/src/modules/alerts/views/AlertsView.vue` — route-level Alert Center composition.
- `client/src/modules/alerts/__tests__/utils/evaluateAlert.spec.ts` — evaluator tests.
- `client/src/modules/alerts/__tests__/utils/serializeAlertLog.spec.ts` — export serialization tests.
- `client/src/modules/alerts/__tests__/store.spec.ts` — Pinia lifecycle/filter tests.
- `client/src/modules/alerts/__tests__/composables/useAlertMonitor.spec.ts` — coordinator tests.
- `client/src/modules/alerts/__tests__/composables/useAlertNotifications.spec.ts` — Neutralino guard/notification tests.
- `client/src/modules/alerts/__tests__/components/AlertComponents.spec.ts` — focused component tests.
- `client/e2e/alerts.spec.ts` — end-to-end alert lifecycle/export flow.

### Modified files

- `client/src/router/index.ts` — add `/alerts` route.
- `client/src/components/layout/AppSidebar.vue` — add Alert Center navigation item and icon.
- `client/src/i18n/it-IT.ts` — add Italian Alert Center copy.
- `client/src/i18n/en-GB.ts` — add English Alert Center copy.
- `client/src/modules/dashboard/views/DashboardView.vue` — mount monitor lifecycle and render compact alert summary.
- `client/src/modules/dashboard/store.ts` — expose the existing snapshots/collector state required by the coordinator without duplicating polling.
- `neutralino.config.json` — verify/add only the native permissions required by desktop notifications and file export.

## Task 1: Define alert domain types and fixed presets

**Files:**
- Create: `client/src/types/alert.ts`
- Create: `client/src/modules/alerts/utils/alertPresets.ts`
- Test: `client/src/modules/alerts/__tests__/utils/alertPresets.spec.ts`

**Interfaces:**

- `AlertCategory = 'resources' | 'storage' | 'processes' | 'services' | 'temperatures' | 'network'`
- `AlertSeverity = 'info' | 'warning' | 'critical'`
- `AlertLifecycle = 'pending' | 'triggered' | 'acknowledged' | 'resolved'`
- `SourceStatus = 'healthy' | 'degraded' | 'stale'`
- `AlertPreset` contains `key`, `category`, `metric`, `severity`, `comparison`, `threshold`, `minimumDurationMs`, `cooldownMs`, and `message`.
- `AlertEvent` contains stable `id`, `presetKey`, `category`, `resourceKey`, `severity`, `state`, observed/threshold values, timestamps, and ordered `transitions`.
- `SourceHealth` contains `source`, `category`, `status`, `message`, and `updatedAt`.
- `NormalizedSnapshot` contains timestamp plus category-specific records for resources, filesystems, processes, daemons, sensors, and network.

- [ ] **Step 1: Write failing type/preset tests**

```ts
import { describe, expect, it } from 'vitest'
import { ALERT_PRESETS } from '@/modules/alerts/utils/alertPresets'

describe('alert presets', () => {
  it('covers every required category', () => {
    expect(new Set(ALERT_PRESETS.map((preset) => preset.category))).toEqual(
      new Set(['resources', 'storage', 'processes', 'services', 'temperatures', 'network']),
    )
  })

  it('has stable keys and positive timing values', () => {
    expect(ALERT_PRESETS.every((preset) =>
      preset.key.length > 0 &&
      preset.minimumDurationMs > 0 &&
      preset.cooldownMs >= 0,
    )).toBe(true)
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm --dir client vitest run src/modules/alerts/__tests__/utils/alertPresets.spec.ts`

Expected: FAIL because the alert domain and preset module do not exist.

- [ ] **Step 3: Add the domain types and six-category presets**

Define the types in `alert.ts`. Add at least one fixed preset per category, with explicit thresholds and timing values. Use stable resource identities such as `cpu`, filesystem mount path, process PID, daemon name, sensor name, or network interface name.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `pnpm --dir client vitest run src/modules/alerts/__tests__/utils/alertPresets.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit the domain foundation**

```bash
git add client/src/types/alert.ts client/src/modules/alerts/utils/alertPresets.ts client/src/modules/alerts/__tests__/utils/alertPresets.spec.ts
git commit -m "feat(client): define alert domain presets"
```

## Task 2: Implement the pure alert evaluator

**Files:**
- Create: `client/src/modules/alerts/utils/evaluateAlert.ts`
- Test: `client/src/modules/alerts/__tests__/utils/evaluateAlert.spec.ts`

**Interfaces:**

- `EvaluationState` stores `conditionSince`, `lastTriggeredAt`, `lastObservedValue`, and the current lifecycle state.
- `evaluateAlert(preset: AlertPreset, resourceKey: string, observedValue: number | null, now: number, previous?: EvaluationState): AlertEvaluation`
- `AlertEvaluation` returns `identity`, `condition`, `state`, `transition`, `observedValue`, `threshold`, and the next `evaluationState`.

- [ ] **Step 1: Write failing evaluator tests**

```ts
it('does not trigger before minimum duration', () => {
  const first = evaluateAlert(preset, 'cpu', 95, 1_000)
  const second = evaluateAlert(preset, 'cpu', 95, 2_000, first.nextState)

  expect(first.state).toBe('pending')
  expect(second.transition).toBe('triggered')
})

it('resolves and suppresses a retrigger during cooldown', () => {
  const triggered = evaluateAlert(preset, 'cpu', 95, 10_000)
  const resolved = evaluateAlert(preset, 'cpu', 20, 20_000, triggered.nextState)
  const suppressed = evaluateAlert(preset, 'cpu', 95, 21_000, resolved.nextState)

  expect(resolved.transition).toBe('resolved')
  expect(suppressed.transition).toBe('cooldown')
})
```

- [ ] **Step 2: Run the evaluator tests and verify failure**

Run: `pnpm --dir client vitest run src/modules/alerts/__tests__/utils/evaluateAlert.spec.ts`

Expected: FAIL because `evaluateAlert` is not implemented.

- [ ] **Step 3: Implement deterministic evaluation**

Use the preset comparison to determine whether the condition is true. Start `conditionSince` on the first true sample, return `pending` until `now - conditionSince >= minimumDurationMs`, emit `triggered` once, emit `resolved` on the first safe sample, and emit `cooldown` while `now - lastTriggeredAt < cooldownMs`. Return a stable identity `${preset.key}:${resourceKey}`.

- [ ] **Step 4: Add edge-case tests and run them**

Cover safe values, null values, equal-to-threshold comparisons, independent resource identities, repeated triggered samples, and cooldown expiry.

Run: `pnpm --dir client vitest run src/modules/alerts/__tests__/utils/evaluateAlert.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit the evaluator**

```bash
git add client/src/modules/alerts/utils/evaluateAlert.ts client/src/modules/alerts/__tests__/utils/evaluateAlert.spec.ts
git commit -m "feat(client): evaluate alert lifecycles"
```

## Task 3: Add the Alert Center store and log serialization

**Files:**
- Create: `client/src/modules/alerts/store.ts`
- Create: `client/src/modules/alerts/utils/serializeAlertLog.ts`
- Test: `client/src/modules/alerts/__tests__/store.spec.ts`
- Test: `client/src/modules/alerts/__tests__/utils/serializeAlertLog.spec.ts`

**Interfaces:**

- `useAlertsStore()` exposes `events`, `activeEvents`, `acknowledgedEvents`, `resolvedEvents`, `sourceHealth`, `monitoringStatus`, `filters`, `applyEvaluation`, `acknowledge(id)`, `recordSourceHealth(sourceHealth)`, `setFilters(filters)`, and `serializeLog()`.
- `serializeAlertLog(events: AlertEvent[], sourceHealth: SourceHealth[], sessionId: string, exportedAt: number): string`.

- [ ] **Step 1: Write failing store and serialization tests**

```ts
it('updates one event for repeated evaluations', () => {
  store.applyEvaluation(triggeredEvaluation)
  store.applyEvaluation({ ...triggeredEvaluation, transition: null, observedValue: 96 })

  expect(store.events).toHaveLength(1)
  expect(store.events[0].observedValue).toBe(96)
})

it('acknowledges without resolving the event', () => {
  store.applyEvaluation(triggeredEvaluation)
  store.acknowledge(triggeredEvaluation.identity)

  expect(store.acknowledgedEvents).toHaveLength(1)
  expect(store.activeEvents).toHaveLength(0)
})
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm --dir client vitest run src/modules/alerts/__tests__/store.spec.ts src/modules/alerts/__tests__/utils/serializeAlertLog.spec.ts`

Expected: FAIL because the store and serializer do not exist.

- [ ] **Step 3: Implement the store**

Maintain events by stable identity. Create an event only for a `triggered` transition, append lifecycle transitions, update observed values/timestamps on repeated evaluations, set resolved timestamps on `resolved`, ignore `cooldown` as a new event, and preserve resolved events for the current session. Keep source errors separate from health events.

- [ ] **Step 4: Implement deterministic serialization**

Serialize a versioned JSON document with `exportedAt`, `sessionId`, `events`, and `sourceHealth`. Sort events by first detection and transitions by timestamp so the same state produces stable output.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm --dir client vitest run src/modules/alerts/__tests__/store.spec.ts src/modules/alerts/__tests__/utils/serializeAlertLog.spec.ts`

Expected: PASS.

```bash
git add client/src/modules/alerts/store.ts client/src/modules/alerts/utils/serializeAlertLog.ts client/src/modules/alerts/__tests__/store.spec.ts client/src/modules/alerts/__tests__/utils/serializeAlertLog.spec.ts
git commit -m "feat(client): store alert events and logs"
```

## Task 4: Build normalized collectors and the monitoring coordinator

**Files:**
- Create: `client/src/modules/alerts/composables/useAlertMonitor.ts`
- Modify: `client/src/modules/dashboard/store.ts`
- Modify: `client/src/modules/process/store.ts`
- Modify: `client/src/modules/daemons/store.ts`
- Test: `client/src/modules/alerts/__tests__/composables/useAlertMonitor.spec.ts`

**Interfaces:**

- `useAlertMonitor()` exposes `start()`, `stop()`, `isRunning`, and `pollNow()`.
- Internal `collectSnapshot(): Promise<NormalizedSnapshot>` uses the existing resource, sensor, filesystem, process, and daemon collectors.
- Each category collection is isolated so one rejected source records `SourceHealth` while other categories still evaluate.

- [ ] **Step 1: Write failing coordinator tests**

```ts
it('continues evaluating other categories when one collector fails', async () => {
  mockSensorsToReject(new Error('sensor unavailable'))
  await monitor.pollNow()

  expect(alertsStore.sourceHealth).toContainEqual(
    expect.objectContaining({ source: 'sensors', status: 'degraded' }),
  )
  expect(alertsStore.events).toEqual(expect.any(Array))
})
```

- [ ] **Step 2: Run the coordinator test and verify failure**

Run: `pnpm --dir client vitest run src/modules/alerts/__tests__/composables/useAlertMonitor.spec.ts`

Expected: FAIL because the coordinator does not exist.

- [ ] **Step 3: Expose non-duplicated collector access**

Adjust the existing dashboard/process/daemon stores only where necessary to expose current snapshots or one-shot collection methods. Do not start a second dashboard/process polling loop. Reuse existing composables and preserve their current UI behavior.

- [ ] **Step 4: Implement isolated polling**

Use one interval for alert monitoring. Collect categories independently, normalize values to preset resource keys, evaluate all available presets, call `applyEvaluation`, and record source health. Ensure `stop()` clears the interval and no poll updates state after stopping.

- [ ] **Step 5: Add lifecycle and duplicate-poll tests**

Verify `start()` is idempotent, `stop()` prevents future updates, repeated samples update one event, and a failed source does not block successful categories.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm --dir client vitest run src/modules/alerts/__tests__/composables/useAlertMonitor.spec.ts src/modules/dashboard/__tests__/store.spec.ts src/modules/process/__tests__/store.spec.ts src/modules/daemons/__tests__/store.spec.ts`

Expected: PASS.

```bash
git add client/src/modules/alerts/composables/useAlertMonitor.ts client/src/modules/alerts/__tests__/composables/useAlertMonitor.spec.ts client/src/modules/dashboard/store.ts client/src/modules/process/store.ts client/src/modules/daemons/store.ts
git commit -m "feat(client): coordinate system health monitoring"
```

## Task 5: Add guarded notifications and export adapters

**Files:**
- Create: `client/src/modules/alerts/composables/useAlertNotifications.ts`
- Create: `client/src/modules/alerts/composables/useAlertExport.ts`
- Modify: `neutralino.config.json`
- Test: `client/src/modules/alerts/__tests__/composables/useAlertNotifications.spec.ts`

**Interfaces:**

- `notifyTriggeredAlert(event: AlertEvent): Promise<void>`.
- `exportAlertLog(events: AlertEvent[], sourceHealth: SourceHealth[]): Promise<void>`.

- [ ] **Step 1: Write failing adapter tests**

```ts
it('does not call Neutralino in browser tests', async () => {
  await notifyTriggeredAlert(event)
  expect(neutralinoShowNotification).not.toHaveBeenCalled()
})

it('surfaces notification failures', async () => {
  neutralinoShowNotification.mockRejectedValue(new Error('permission denied'))
  await expect(notifyTriggeredAlert(event)).rejects.toThrow('permission denied')
})
```

- [ ] **Step 2: Run adapter tests and verify failure**

Run: `pnpm --dir client vitest run src/modules/alerts/__tests__/composables/useAlertNotifications.spec.ts`

Expected: FAIL because the adapters do not exist.

- [ ] **Step 3: Implement the guarded desktop notification adapter**

Check `typeof window === 'undefined'` and the Neutralino runtime availability before calling `Neutralino.os.showNotification`. Do not swallow failures; return/rethrow them so the coordinator can record the adapter error.

- [ ] **Step 4: Implement export using the existing runtime conventions**

Serialize the log, choose a `.json` export filename, and write it through the repository’s approved Neutralino filesystem flow. In browser/test mode return a deterministic mock result without invoking Neutralino.

- [ ] **Step 5: Verify native permissions**

Inspect `neutralino.config.json` and add only the notification/filesystem permissions required by the adapter. Do not broaden `nativeAllowList` beyond those APIs.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm --dir client vitest run src/modules/alerts/__tests__/composables/useAlertNotifications.spec.ts`

Expected: PASS.

```bash
git add client/src/modules/alerts/composables/useAlertNotifications.ts client/src/modules/alerts/composables/useAlertExport.ts client/src/modules/alerts/__tests__/composables/useAlertNotifications.spec.ts neutralino.config.json
git commit -m "feat(client): add alert notification and export adapters"
```

## Task 6: Build Alert Center components and route

**Files:**
- Create: `client/src/modules/alerts/components/AlertSummary.vue`
- Create: `client/src/modules/alerts/components/AlertFilters.vue`
- Create: `client/src/modules/alerts/components/AlertList.vue`
- Create: `client/src/modules/alerts/components/AlertDetail.vue`
- Create: `client/src/modules/alerts/views/AlertsView.vue`
- Modify: `client/src/router/index.ts`
- Modify: `client/src/components/layout/AppSidebar.vue`
- Modify: `client/src/i18n/it-IT.ts`
- Modify: `client/src/i18n/en-GB.ts`
- Test: `client/src/modules/alerts/__tests__/components/AlertComponents.spec.ts`

**Interfaces:**

- `AlertsView` starts/stops `useAlertMonitor` and owns selected event state.
- `AlertSummary` receives store-derived counts/status and emits no side effects.
- `AlertFilters` receives current filters and emits `update:filters`.
- `AlertList` receives filtered events and emits `select`.
- `AlertDetail` receives one event and emits `acknowledge` and `export`.

- [ ] **Step 1: Write failing component tests**

```ts
it('renders degraded monitoring without claiming the system is healthy', () => {
  const wrapper = mount(AlertSummary, {
    props: { monitoringStatus: 'degraded', degradedSources: ['sensors'] },
  })

  expect(wrapper.text()).toContain('sensors')
  expect(wrapper.text()).not.toContain('healthy')
})
```

- [ ] **Step 2: Run focused component tests and verify failure**

Run: `pnpm --dir client vitest run src/modules/alerts/__tests__/components/AlertComponents.spec.ts`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement summary, filters, list, and detail**

Use existing shared panel, alert, status badge, filter, button, and empty-state components. Render loading, empty, error, and degraded-source states explicitly. Keep labels and action text in both locale files.

- [ ] **Step 4: Add the view and route**

Register `/alerts` before the catch-all-free route list, mount the coordinator once in the view lifecycle, and stop it on scope disposal. Selecting an event should populate the detail panel without mutating the event.

- [ ] **Step 5: Add navigation and active count**

Add an `ALERTS` item using an existing Lucide icon and expose the active/unacknowledged count in the navigation without hardcoding route activity.

- [ ] **Step 6: Run component and type checks**

Run: `pnpm --dir client vitest run src/modules/alerts/__tests__/components/AlertComponents.spec.ts && pnpm --dir client type-check`

Expected: PASS with no TypeScript errors.

- [ ] **Step 7: Commit the Alert Center UI**

```bash
git add client/src/modules/alerts/components client/src/modules/alerts/views/AlertsView.vue client/src/modules/alerts/__tests__/components/AlertComponents.spec.ts client/src/router/index.ts client/src/components/layout/AppSidebar.vue client/src/i18n/it-IT.ts client/src/i18n/en-GB.ts
git commit -m "feat(client): add alert center view"
```

## Task 7: Integrate the dashboard summary and notification transitions

**Files:**
- Modify: `client/src/modules/dashboard/views/DashboardView.vue`
- Modify: `client/src/modules/alerts/composables/useAlertMonitor.ts`
- Modify: `client/src/modules/alerts/store.ts`
- Test: `client/src/modules/alerts/__tests__/composables/useAlertMonitor.spec.ts`

- [ ] **Step 1: Write failing integration tests**

```ts
it('notifies once when an event becomes triggered', async () => {
  await monitor.pollNow()
  await monitor.pollNow()

  expect(notifyTriggeredAlert).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run the integration test and verify failure**

Run: `pnpm --dir client vitest run src/modules/alerts/__tests__/composables/useAlertMonitor.spec.ts`

Expected: FAIL until transition-driven notification and dashboard summary wiring are present.

- [ ] **Step 3: Notify only on `triggered` transitions**

Call the notification adapter only when the evaluator emits a new `triggered` transition. Do not notify for pending, repeated triggered samples, acknowledgement, resolution, or cooldown.

- [ ] **Step 4: Add the compact dashboard summary**

Render active alert count, highest severity, and degraded-source count using the existing dashboard card patterns. Link the summary to `/alerts`; do not duplicate the complete list.

- [ ] **Step 5: Run targeted dashboard tests**

Run: `pnpm --dir client vitest run src/modules/dashboard/__tests__ src/modules/alerts/__tests__/composables/useAlertMonitor.spec.ts`

Expected: PASS.

- [ ] **Step 6: Commit integration**

```bash
git add client/src/modules/dashboard/views/DashboardView.vue client/src/modules/alerts/composables/useAlertMonitor.ts client/src/modules/alerts/store.ts client/src/modules/alerts/__tests__/composables/useAlertMonitor.spec.ts
git commit -m "feat(client): surface alert transitions on dashboard"
```

## Task 8: Add the end-to-end lifecycle test and finish validation

**Files:**
- Create: `client/e2e/alerts.spec.ts`
- Modify: `client/src/modules/alerts/__tests__/components/AlertComponents.spec.ts` if gaps are found.

- [ ] **Step 1: Add deterministic E2E fixtures**

Provide mocked collector responses for one triggered resource alert, then a healthy response. Keep the fixture data local to the test and do not depend on the host machine’s real CPU, sensors, network, or services.

- [ ] **Step 2: Write the lifecycle test**

```ts
test('acknowledges, resolves, and exports an alert', async ({ page }) => {
  await page.goto('/#/alerts')
  await expect(page.getByText('High CPU usage')).toBeVisible()
  await page.getByRole('button', { name: /acknowledge/i }).click()
  await expect(page.getByText(/acknowledged/i)).toBeVisible()
  await applyHealthyFixture()
  await expect(page.getByText(/resolved/i)).toBeVisible()
  await page.getByRole('button', { name: /export/i }).click()
})
```

- [ ] **Step 3: Run the E2E test**

Run: `pnpm --dir client test:e2e -- e2e/alerts.spec.ts`

Expected: PASS with no dependency on live host metrics.

- [ ] **Step 4: Run the full relevant validation**

Run:

```bash
pnpm --dir client vitest run
pnpm --dir client type-check
pnpm --dir client lint
pnpm --dir client test:e2e -- e2e/alerts.spec.ts
```

Expected: all commands pass. If lint modifies unrelated existing files, inspect the diff and preserve unrelated user work.

- [ ] **Step 5: Verify acceptance criteria**

Check that all six categories have a preset or explicit degraded-source behavior, duration/cooldown/deduplication work, acknowledgement does not disable monitoring, resolved events export, Neutralino calls are guarded, and the dashboard/navigation integration is present.

- [ ] **Step 6: Commit the completed validation/test coverage**

```bash
git add client/e2e/alerts.spec.ts client/src/modules/alerts
git commit -m "test(client): cover alert center lifecycle"
```
