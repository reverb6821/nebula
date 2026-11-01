# System Health Anomaly Detection

**Status:** Design and written specification approved
**Date:** 2026-11-01  
**Scope:** Local statistical anomaly detection integrated with the System Health Alert Center

## Goal

Extend Nebula Dock's fixed-threshold Alert Center with local, statistical detection of unusual behavior. Anomalies should describe deviations from the machine's observed behavior, not replace or weaken existing thresholds.

The first version will:

- analyze numeric metrics already collected by Nebula Dock;
- compare recent behavior with a time-of-day baseline;
- persist only local aggregate statistics, never continuous raw samples;
- require a mature baseline and repeated confirmation before creating an anomaly event;
- expose baseline learning and degradation in the existing Alert Center;
- reuse the existing alert lifecycle, export, deduplication, acknowledgement, and desktop-notification flows.

The feature remains local and active only while Nebula Dock is open. It adds no cloud processing, machine-learning model, native background service, or custom rule builder.

## Decisions

| Topic | Decision |
| --- | --- |
| Baseline lifetime | Persist local aggregate statistics across app restarts |
| Signals | Numeric metrics from existing resource, storage, process, sensor, and network collectors |
| Detection sensitivity | Conservative |
| Baseline model | Hybrid: recent rolling behavior plus matching time-of-day behavior |
| Learning behavior | Existing fixed-threshold alerts stay active; no statistical events before baseline maturity |
| Event delivery | Confirmed anomalies become distinct Alert Center events and may notify on desktop |
| Persistence | Aggregate-only, 30-day retention, with a user-initiated reset |
| Direction | Metric-specific; high-only for utilization/capacity signals and bidirectional for throughput signals |

## Existing context

The Alert Center already has:

- a coordinator that reuses the dashboard, process, daemon, filesystem, and sensor collectors;
- normalized snapshots, fixed presets, and a pure threshold evaluator;
- a Pinia store for active, acknowledged, and resolved events;
- source-health reporting, export, and a guarded desktop notification adapter;
- a dashboard summary, Alert Center route, filters, and event detail view.

The anomaly detector must extend this flow rather than add duplicate polling or a second event center. Categorical daemon/service states remain under fixed rules; they do not have statistical baselines.

## Architecture

### Collection and evaluation

The existing monitoring coordinator continues to collect at its current interval and produces normalized snapshots. Each valid numeric signal is sent to a new pure anomaly evaluator; threshold evaluation remains independent and continues to run even when the anomaly baseline is learning, degraded, or unavailable.

The evaluator owns no Vue, Pinia, Neutralino, or UI dependencies. It consumes a signal identity, observed value, timestamp, baseline summaries, and prior candidate state. It returns baseline status, anomaly score/direction, and lifecycle transition data. The coordinator forwards baseline updates and event transitions to the existing alert store through explicit store actions.

### Signal identity and scope

Initial signals are:

- host CPU, memory, and swap utilization;
- filesystem utilization and available capacity;
- per-executable grouped CPU and memory use;
- CPU/GPU temperatures when sensors are available;
- network receive/transmit rates;
- disk read/write rates.

Filesystem, CPU, memory, swap, process utilization, and temperature anomalies are evaluated as unusual increases. Network and disk throughput can be anomalous in either direction when the relevant baseline shows meaningful activity. A near-zero baseline is not sufficient to make every zero sample anomalous.

Process baselines use executable name as the stable identity and aggregate values across instances with that name. PID, command-line arguments, and raw process samples are not persisted. This avoids baseline churn from changing PIDs and avoids storing command-line data.

Unavailable or degraded source data is not interpreted as a normal sample. Its baseline update is paused, source health remains visible through the existing degraded-monitoring flow, and unrelated signals continue to be evaluated.

## Baseline and detection model

### Aggregate storage

Samples are accumulated in memory and summarized into five-minute buckets. Persisted bucket summaries contain only aggregate fields required for robust comparison, such as sample count, median, and median absolute deviation (MAD). Individual samples are discarded after aggregation.

The local baseline store is versioned and retains at most 30 days of summaries per signal. It contains no machine/device identifier, PID values, command-line arguments, or raw metric series. Only the data necessary to associate a summary with its metric and stable resource identity is retained.

The evaluator compares a current signal against:

1. A rolling six-hour baseline built from recent bucket summaries.
2. The same 30-minute local-time slot across the preceding 30 days.

For each baseline, the robust z-score is `0.6745 * (value - median) / max(MAD, metricFloor)`. The fixed conservative threshold is 3.5: high-only signals require a score of at least 3.5; bidirectional throughput signals require an absolute score of at least 3.5. The initial metric floors are one percentage point for percentage metrics, one degree Celsius for temperatures, and one kibibyte per second for byte-rate metrics. Low-throughput anomalies are eligible only when the matching baseline median is at least 10 kibibytes per second, so an otherwise idle interface or disk does not appear anomalous. These constants are fixed in code and are not user-configurable.

The same signal must exceed both mature baselines in the same relevant direction for three consecutive healthy collection samples before it becomes a confirmed anomaly.

### Warm-up and baseline updates

A signal is considered ready only after it has at least six hours of usable recent data and at least three separately observed days for its matching time-of-day slot. Until then, its status is `learning`; it cannot generate statistical anomaly events. Existing threshold alerts remain fully active during this time.

Samples are added only when their source is healthy and the signal is not an anomaly candidate or active anomaly. Baseline updates pause while a candidate or event is active so that an ongoing deviation cannot be absorbed into the definition of normal behavior. Once the signal returns to its normal range and the event resolves, aggregation resumes.

The baseline reset action clears stored aggregate statistics and returns affected signals to `learning`. The reset requires confirmation and does not clear alert events or threshold presets.

Only baseline summaries persist across app restarts. Alert event history continues to follow the existing session-only behavior.

### Persistence failures

The baseline store is local and accessed through the existing guarded desktop-storage conventions. If storage is unavailable or the stored data cannot be read safely:

- anomaly detection enters a visible degraded or learning state;
- no statistical event is emitted using a success-shaped empty baseline;
- fixed-threshold monitoring and source collection continue;
- the user can explicitly reset the baseline to restart learning.

Stored data uses a schema version. Unknown or invalid data is reported as a baseline problem rather than silently treated as a valid healthy baseline.

## Alert lifecycle and event data

Anomaly events are distinct from threshold events through an explicit detection origin. They share the existing triggered, acknowledged, and resolved lifecycle, stable event identity, notification deduplication, and cooldown handling.

Each anomaly event includes:

- metric and stable resource identity;
- observed value and relevant direction;
- learned expected range and robust deviation score;
- time period and maturity of the baseline used;
- first detection, confirmation, last update, acknowledgement, and resolution timestamps;
- ordered lifecycle transitions.

Statistical anomalies use warning severity in the initial version; they do not independently create critical-severity events. Existing fixed presets retain their current severities and notification behavior. A confirmed anomaly may use the existing desktop notification adapter; candidates and learning-state changes do not notify.

Exported logs include anomaly event details and the baseline period/expected range used, but not raw samples or continuous metric history.

## User experience

The Alert Center will:

- show each signal's baseline status as learning, active, or degraded;
- distinguish anomaly events from fixed-threshold events in lists and filters;
- show observed value, expected range, deviation direction/magnitude, baseline period, and confirmation timeline in event details;
- expose a confirmed reset action for learned baselines;
- continue to render loading, empty, source-degraded, and persistence-error states explicitly.

The first version does not add a per-metric configuration screen, a custom rule builder, or user-adjustable sensitivity. The dashboard continues to show the existing compact alert summary and links to the Alert Center.

## Testing strategy

### Unit tests

Test pure baseline and evaluator logic for:

- aggregate bucket creation and retention;
- warm-up readiness and matching time-of-day buckets;
- robust deviation scoring and metric-specific direction;
- three-sample confirmation and candidate cancellation;
- frozen baseline updates during anomalies;
- unavailable samples, zero-dispersion floors, and cooldown/deduplication;
- reset and schema-version validation.

### Integration tests

Mock existing collectors and local storage to verify:

- there is no duplicate polling;
- threshold evaluation continues during learning or persistence failure;
- one failed source does not suppress unrelated signals;
- only aggregate summaries reach persistence;
- confirmed anomalies enter the existing store and notify once;
- reset restarts learning without removing alert history.

### End-to-end test

Use deterministic fixtures to verify the baseline learning state, reset flow, and appearance of a confirmed anomaly in the Alert Center. The test must not depend on host metrics, real time-of-day history, or Neutralino desktop services.

## Out of scope

- Cloud or remote anomaly analysis;
- machine-learning models or automatic system remediation;
- monitoring while the app is closed or a native background service;
- persisting raw samples or a general-purpose metrics database;
- statistical analysis of categorical service/daemon state;
- user-defined anomaly rules, sensitivity sliders, or per-signal tuning;
- replacing, disabling, or changing the existing fixed-threshold presets.

## Acceptance criteria

- Existing threshold events and notifications behave unchanged while the anomaly baseline learns or is unavailable.
- No statistical anomaly event is emitted until its baseline meets both maturity requirements.
- A confirmed event requires three consecutive samples to exceed both relevant baselines in the applicable direction.
- A candidate or active anomaly does not update its own baseline.
- Only aggregate statistics are persisted, with a maximum 30-day retention and a user-initiated reset.
- Source failures and baseline-storage failures are visible and never interpreted as normal behavior.
- Anomaly and threshold events are distinguishable but share the existing lifecycle, export, and Alert Center.
- Browser/test contexts remain safe when Neutralino APIs are unavailable.
