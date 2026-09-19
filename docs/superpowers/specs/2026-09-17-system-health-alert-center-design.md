# System Health Alert Center

**Status:** Design approved  
**Date:** 2026-09-17  
**Scope:** Local system-health observability while Nebula Dock is open

## Goal

Add a local Alert Center that turns the existing system metrics, process, daemon, filesystem, sensor, and network data into actionable alerts. The first version prioritizes observability over long-term metrics history and does not include Ollama functionality.

The Alert Center will:

- monitor CPU, RAM, swap, storage, processes, services/daemons, temperatures, and network;
- evaluate fixed, safe presets rather than exposing a rule builder;
- require a condition to remain true for a minimum duration before triggering;
- deduplicate repeated events and apply a cooldown after resolution;
- expose active, acknowledged, and resolved alert states;
- show alerts in the app and through Neutralino desktop notifications;
- export a structured, human-readable event log;
- report unavailable monitoring sources explicitly instead of presenting a false healthy state.

The monitor runs while Nebula Dock is open. A background native service and persistent raw metric database are intentionally out of scope for this version.

## Existing context

The client already has separate modules for:

- dashboard resources, sensors, and filesystem data;
- process metrics and system meters;
- daemon/service state and actions;
- shared layout, navigation, status, empty, and alert components;
- Pinia stores and composables for API access;
- Vitest unit tests and Playwright E2E tests.

The feature should extend these boundaries rather than create a second system-monitoring implementation.

## Architecture

### Alert store

Add a Pinia store responsible for alert state and session-local event history. It owns:

- the enabled fixed presets;
- active alert instances;
- acknowledged alert instances;
- resolved alert instances retained for the current app session;
- source degradation records;
- monitoring status;
- actions for acknowledgement, resolution updates, filtering, and log serialization.

The store must not execute operating-system commands directly. It receives normalized evaluations and state transitions from the monitoring coordinator.

### Pure rule evaluator

Create a framework-independent evaluator that accepts:

- a normalized system snapshot;
- a preset definition;
- the previous evaluation state;
- the current timestamp.

It returns a deterministic evaluation containing the rule key, resource key, observed value, threshold, severity, condition state, and any transition. It must handle:

- threshold comparisons;
- minimum-duration tracking;
- transition to `pending`;
- transition to `triggered`;
- resolution;
- cooldown suppression;
- stable identity for repeated samples from the same resource.

The evaluator must not import Vue, Pinia, Neutralino, or UI code.

### Monitoring coordinator

Add a coordinator that periodically calls the existing dashboard, process, and daemon composables, then converts their results into one normalized snapshot. The coordinator:

1. starts and stops with the dashboard/application lifecycle;
2. schedules polling at one shared interval;
3. evaluates each available category;
4. forwards transitions to the alert store;
5. records source-level collection failures;
6. prevents one failed source from suppressing unrelated categories;
7. avoids generating repeated notifications for the same unresolved event.

The coordinator should reuse existing API and command helpers. Native calls must remain guarded for browser and test environments.

### Output adapters

Keep side effects separate from evaluation:

- **In-app adapter:** drives the store and Alert Center UI.
- **Desktop notification adapter:** calls Neutralino notification APIs only when the desktop runtime is available; failures are surfaced as adapter errors.
- **Export adapter:** serializes selected or all session events into a structured text format suitable for saving through the existing Neutralino filesystem flow.

## Presets

The initial presets are fixed in code and are not user-editable. Each preset defines a stable key, category, metric, comparison, threshold, severity, minimum duration, cooldown, and message template.

Required categories:

| Category | Initial coverage |
| --- | --- |
| Resources | CPU, RAM, and swap pressure |
| Storage | Filesystem capacity and low-space conditions |
| Processes | Excessive resource use and relevant process state |
| Services | Stopped, failed, or unexpectedly restarted daemons |
| Temperatures | Available hardware sensor thresholds |
| Network | Interface errors and connectivity conditions |

Presets must tolerate unavailable platform data. A missing temperature sensor, for example, produces a degraded source state rather than an alert claiming that temperature is safe.

## Alert lifecycle

Each alert instance has a stable identity composed from its preset key and resource identity. Repeated samples update one instance.

The lifecycle is:

1. **Below threshold:** no alert exists or an existing alert is resolved.
2. **Pending:** the condition is above threshold but has not lasted the minimum duration.
3. **Triggered:** the condition has remained true long enough to notify.
4. **Acknowledged:** the user has acknowledged the triggered event; the condition remains visible and monitored.
5. **Resolved:** the condition returns to a safe state.
6. **Cooldown:** after resolution, an equivalent event cannot notify again until its cooldown expires.

Acknowledgement silences notification for the current event only. It does not disable the preset and does not hide an ongoing problem.

## User experience

### Navigation

Add an Alert Center entry to the primary navigation. Display a count of currently triggered and unacknowledged alerts. The dashboard keeps a compact summary rather than duplicating the full alert list.

### Alert Center view

The view has three areas:

1. **Summary:** counts by severity and category, latest event, monitoring status, and degraded sources.
2. **Alert list:** filters for active, acknowledged, and resolved events, plus category and severity filters. Each row shows the metric, resource, observed value, threshold, duration, first detection, last update, and available actions.
3. **Event detail:** transition timeline, relevant observed values, source errors, resolution information, acknowledgement action, and export action.

The view must define explicit loading, empty, error, and degraded-source states.

### Notifications

Triggered alerts appear in-app and may create a desktop notification. Notification delivery is deduplicated by alert identity and suppressed during the configured cooldown. Source collection failures are grouped and are not emitted once per polling cycle.

## Error handling and degraded monitoring

Collection errors are distinct from health alerts. Each error records its source, category, timestamp, and message suitable for the UI and exported log.

When a source fails:

- the last known value may remain visible but is marked stale;
- the source is shown as degraded;
- no healthy fallback is generated;
- other sources continue to be evaluated;
- repeated identical errors are deduplicated;
- the failure is available in the event log.

Neutralino-only operations must be guarded so browser previews and unit tests do not crash. Adapter failures must remain observable through the monitoring status and log rather than being silently ignored.

## Export format

Exported logs contain:

- export timestamp;
- monitoring session identifier;
- alert identity and preset key;
- category and resource;
- severity;
- observed and threshold values;
- first detection, last update, acknowledgement, and resolution timestamps;
- lifecycle transitions;
- collection and adapter errors.

The export does not contain continuous raw samples or unrelated system data.

## Testing strategy

### Unit tests

Cover the pure evaluator for:

- threshold comparisons;
- minimum duration;
- pending-to-triggered transitions;
- resolution;
- cooldown;
- deduplication;
- multiple resources sharing one preset;
- unavailable source data.

Cover the Pinia store for:

- alert transitions;
- acknowledgement behavior;
- resolution updates;
- active/category/severity filters;
- source degradation;
- deterministic log serialization.

### Integration tests

Mock the existing resource, filesystem, process, daemon, sensor, and network APIs. Verify that:

- one failed collector does not prevent other categories from evaluating;
- repeated samples update one event;
- desktop notifications are guarded outside Neutralino;
- export errors are represented explicitly.

### End-to-end test

Add one Playwright flow covering:

1. a triggered alert appearing in the Alert Center;
2. acknowledgement without hiding the problem;
3. resolution after the condition becomes healthy;
4. export of the event log.

## Out of scope

- Ollama monitoring or model management changes;
- editable rule conditions or custom actions;
- anomaly detection or learned baselines;
- continuous raw metric persistence;
- monitoring while the application is closed;
- a native background service;
- remote monitoring or multi-machine dashboards.

## Acceptance criteria

- All six required categories have at least one fixed preset or an explicit degraded-source state.
- A condition does not trigger before its minimum duration.
- Repeated polling does not create duplicate alert instances or notifications.
- Acknowledgement silences only the current event and does not disable monitoring.
- Resolved events remain available for the current session and can be exported.
- Collection failures are visible as degraded monitoring, never as healthy fallback values.
- Browser/test environments do not invoke unguarded Neutralino APIs.
- Unit, integration, and E2E tests cover the lifecycle and export path.
