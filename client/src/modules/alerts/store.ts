import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type {
  AlertCategory,
  AlertEvent,
  AlertLifecycle,
  AlertSeverity,
  SourceHealth,
} from '@/types/alert'
import type { AlertEvaluation as EvaluatedAlert, EvaluationState } from '@/modules/alerts/utils/evaluateAlert'
import { ALERT_PRESETS } from '@/modules/alerts/utils/alertPresets'
import { serializeAlertLog } from '@/modules/alerts/utils/serializeAlertLog'

export interface AlertFilters {
  states: AlertLifecycle[]
  categories: AlertCategory[]
  severities: AlertSeverity[]
}

export type MonitoringStatus = 'healthy' | 'degraded'

const EMPTY_FILTERS: AlertFilters = {
  states: [],
  categories: [],
  severities: [],
}

let sessionSequence = 0

function createSessionId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  sessionSequence += 1
  return `session-${sessionSequence}`
}

function presetForIdentity(identity: string) {
  const presetKey = identity.slice(0, identity.lastIndexOf(':'))
  const preset = ALERT_PRESETS.find((candidate) => candidate.key === presetKey)
  if (!preset) throw new Error(`Unknown alert preset for identity: ${identity}`)
  return preset
}

function matchesFilters(event: AlertEvent, filters: AlertFilters): boolean {
  return (filters.states.length === 0 || filters.states.includes(event.state)) &&
    (filters.categories.length === 0 || filters.categories.includes(event.category)) &&
    (filters.severities.length === 0 || filters.severities.includes(event.severity))
}

export const useAlertsStore = defineStore('alerts', () => {
  const events = ref<AlertEvent[]>([])
  const sourceHealth = ref<SourceHealth[]>([])
  const filters = ref<AlertFilters>({ ...EMPTY_FILTERS })
  const evaluationStates = ref<Record<string, EvaluationState>>({})
  const sessionId = createSessionId()

  const filteredEvents = computed(() => events.value.filter((event) => matchesFilters(event, filters.value)))
  const triggeredEvents = computed(() => events.value.filter((event) => event.state === 'triggered'))
  const activeEvents = computed(() => filteredEvents.value.filter((event) => event.state === 'triggered'))
  const acknowledgedEvents = computed(() => filteredEvents.value.filter((event) => event.state === 'acknowledged'))
  const resolvedEvents = computed(() => filteredEvents.value.filter((event) => event.state === 'resolved'))
  const monitoringStatus = computed<MonitoringStatus>(() =>
    sourceHealth.value.some((source) => source.status !== 'healthy') ? 'degraded' : 'healthy',
  )

  function evaluationStateFor(identity: string): EvaluationState | undefined {
    return evaluationStates.value[identity]
  }

  function setEvaluationState(identity: string, state: EvaluationState) {
    evaluationStates.value = { ...evaluationStates.value, [identity]: state }
  }

  function applyEvaluation(evaluation: EvaluatedAlert): AlertEvent | null {
    const index = events.value.findIndex((event) => event.id === evaluation.identity)
    const timestamp = evaluation.observedAt

    if (index === -1) {
      if (evaluation.transition !== 'triggered') return null
      const preset = presetForIdentity(evaluation.identity)
      const resourceKey = evaluation.identity.slice(evaluation.identity.lastIndexOf(':') + 1)
      const event: AlertEvent = {
        id: evaluation.identity,
        presetKey: preset.key,
        category: preset.category,
        resourceKey,
        severity: preset.severity,
        state: 'triggered',
        observedValue: evaluation.observedValue,
        threshold: evaluation.threshold,
        firstDetectedAt: timestamp,
        lastUpdatedAt: timestamp,
        acknowledgedAt: null,
        resolvedAt: null,
        transitions: [{ state: 'triggered', at: timestamp, observedValue: evaluation.observedValue }],
      }
      events.value = [...events.value, event]
      return event
    }

    const current = events.value[index]
    if (!current) return null

    const nextState = evaluation.state === 'acknowledged' && current.state === 'acknowledged'
      ? 'acknowledged'
      : evaluation.state
    const transition = evaluation.transition
    const transitions = transition === null || transition === 'cooldown'
      ? current.transitions
      : [...current.transitions, {
          state: transition,
          at: timestamp,
          observedValue: evaluation.observedValue,
        }]
    const updated: AlertEvent = {
      ...current,
      state: nextState,
      observedValue: evaluation.observedValue,
      threshold: evaluation.threshold,
      lastUpdatedAt: timestamp,
      resolvedAt: transition === 'resolved' ? timestamp : current.resolvedAt,
      transitions,
    }
    events.value = events.value.map((event, eventIndex) => eventIndex === index ? updated : event)
    return updated
  }

  function acknowledge(id: string, acknowledgedAt: number) {
    const index = events.value.findIndex((event) => event.id === id)
    const event = index === -1 ? undefined : events.value[index]
    if (!event || event.state !== 'triggered') return
    events.value = events.value.map((candidate, eventIndex) => eventIndex === index
      ? {
          ...candidate,
          state: 'acknowledged',
          acknowledgedAt,
          lastUpdatedAt: acknowledgedAt,
          transitions: [...candidate.transitions, {
            state: 'acknowledged',
            at: acknowledgedAt,
            observedValue: candidate.observedValue,
          }],
        }
      : candidate)
    const evaluationState = evaluationStates.value[id]
    if (evaluationState) {
      setEvaluationState(id, { ...evaluationState, state: 'acknowledged' })
    }
  }

  function recordSourceHealth(health: SourceHealth) {
    const index = sourceHealth.value.findIndex((source) =>
      source.source === health.source && source.category === health.category)
    if (index === -1) {
      sourceHealth.value = [...sourceHealth.value, { ...health }]
      return
    }
    sourceHealth.value = sourceHealth.value.map((source, sourceIndex) =>
      sourceIndex === index ? { ...health } : source,
    )
  }

  function setFilters(nextFilters: AlertFilters) {
    filters.value = {
      states: [...nextFilters.states],
      categories: [...nextFilters.categories],
      severities: [...nextFilters.severities],
    }
  }

  function serializeLog(exportedAt: number): string {
    return serializeAlertLog(events.value, sourceHealth.value, sessionId, exportedAt)
  }

  return {
    events,
    filteredEvents,
    triggeredEvents,
    activeEvents,
    acknowledgedEvents,
    resolvedEvents,
    sourceHealth,
    monitoringStatus,
    evaluationStateFor,
    setEvaluationState,
    filters,
    applyEvaluation,
    acknowledge,
    recordSourceHealth,
    setFilters,
    serializeLog,
  }
})
