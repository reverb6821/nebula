import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { AlertEvaluation } from '@/modules/alerts/utils/evaluateAlert'
import { useAlertsStore } from '@/modules/alerts/store'

const triggeredEvaluation: AlertEvaluation = {
  identity: 'resources.cpu-high:cpu',
  observedAt: 2_000,
  condition: true,
  state: 'triggered',
  transition: 'triggered',
  observedValue: 95,
  threshold: 90,
  nextState: {
    conditionSince: null,
    lastTriggeredAt: 2_000,
    lastObservedValue: 95,
    state: 'triggered',
  },
}

describe('alerts store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })


  it('updates one event for repeated evaluations', () => {
    const store = useAlertsStore()
    store.applyEvaluation(triggeredEvaluation)
    store.applyEvaluation({ ...triggeredEvaluation, observedAt: 2_500, transition: null, observedValue: 96 })

    expect(store.events).toHaveLength(1)
    expect(store.events[0]?.observedValue).toBe(96)
    expect(store.events[0]?.lastUpdatedAt).toBe(2_500)
    expect(store.events[0]?.transitions).toHaveLength(1)
  })

  it('acknowledges without resolving the event', () => {
    const store = useAlertsStore()
    store.applyEvaluation(triggeredEvaluation)
    store.acknowledge(triggeredEvaluation.identity, 2_250)

    expect(store.acknowledgedEvents).toHaveLength(1)
    expect(store.activeEvents).toHaveLength(0)
    expect(store.events[0]?.state).toBe('acknowledged')
    expect(store.events[0]?.acknowledgedAt).toBe(2_250)
    expect(store.events[0]?.lastUpdatedAt).toBe(2_250)
    expect(store.events[0]?.resolvedAt).toBeNull()
  })

  it('records resolution and retains the event', () => {
    const store = useAlertsStore()
    store.applyEvaluation(triggeredEvaluation)
    store.applyEvaluation({
      ...triggeredEvaluation,
      observedAt: 3_000,
      state: 'resolved',
      transition: 'resolved',
      observedValue: 20,
    })

    expect(store.resolvedEvents).toHaveLength(1)
    expect(store.events[0]?.resolvedAt).toBe(3_000)
    expect(store.events[0]?.transitions.map((transition) => transition.state)).toEqual([
      'triggered',
      'resolved',
    ])
  })

  it('keeps source health separate from alert events and deduplicates by source', () => {
    const store = useAlertsStore()
    store.recordSourceHealth({
      source: 'sensors',
      category: 'temperatures',
      status: 'degraded',
      message: 'sensor unavailable',
      updatedAt: 3_000,
    })

    expect(store.events).toEqual([])
    expect(store.sourceHealth).toHaveLength(1)
    expect(store.monitoringStatus).toBe('degraded')
  })

  it('filters events by lifecycle, category, and severity', () => {
    const store = useAlertsStore()
    store.applyEvaluation(triggeredEvaluation)
    store.setFilters({ states: ['resolved'], categories: [], severities: [] })

    expect(store.activeEvents).toEqual([])
    expect(store.events).toHaveLength(1)
  })

  it('serializes the current session log', () => {
    const store = useAlertsStore()
    store.applyEvaluation(triggeredEvaluation)
    const log = JSON.parse(store.serializeLog(4_000)) as { exportedAt: number; events: unknown[]; sourceHealth: unknown[] }

    expect(log.exportedAt).toBe(4_000)
    expect(log.events).toHaveLength(1)
    expect(log.sourceHealth).toEqual([])
  })
})
