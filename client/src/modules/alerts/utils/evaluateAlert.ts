import type { AlertLifecycle, AlertPreset } from '@/types/alert'

export type AlertEvaluationTransition = 'triggered' | 'resolved' | 'cooldown' | null

export interface EvaluationState {
  conditionSince: number | null
  lastTriggeredAt: number | null
  lastObservedValue: number | null
  state: AlertLifecycle
}

export interface AlertEvaluation {
  identity: string
  observedAt: number
  condition: boolean
  state: AlertLifecycle
  transition: AlertEvaluationTransition
  observedValue: number | null
  threshold: number
  nextState: EvaluationState
}

function matchesCondition(preset: AlertPreset, observedValue: number): boolean {
  switch (preset.comparison) {
    case 'gt':
      return observedValue > preset.threshold
    case 'gte':
      return observedValue >= preset.threshold
    case 'lt':
      return observedValue < preset.threshold
    case 'lte':
      return observedValue <= preset.threshold
    case 'eq':
      return observedValue === preset.threshold
    case 'neq':
      return observedValue !== preset.threshold
  }
}

export function evaluateAlert(
  preset: AlertPreset,
  resourceKey: string,
  observedValue: number | null,
  now: number,
  previous?: EvaluationState,
): AlertEvaluation {
  const priorState: EvaluationState = previous ?? {
    conditionSince: null,
    lastTriggeredAt: null,
    lastObservedValue: null,
    state: 'pending',
  }
  const identity = `${preset.key}:${resourceKey}`
  const condition = observedValue !== null && matchesCondition(preset, observedValue)
  let state = priorState.state
  let transition: AlertEvaluationTransition = null
  let conditionSince = priorState.conditionSince
  let lastTriggeredAt = priorState.lastTriggeredAt

  if (observedValue === null) {
    if (state === 'pending') conditionSince = null
  } else if (!condition) {
    conditionSince = null
    if (state === 'triggered' || state === 'acknowledged') {
      state = 'resolved'
      transition = 'resolved'
    }
  } else if (state === 'triggered' || state === 'acknowledged') {
    conditionSince = null
  } else if (
    state === 'resolved' &&
    lastTriggeredAt !== null &&
    now - lastTriggeredAt < preset.cooldownMs
  ) {
    transition = 'cooldown'
    conditionSince = null
  } else if (conditionSince === null) {
    state = 'pending'
    conditionSince = now
  } else if (now - conditionSince >= preset.minimumDurationMs) {
    state = 'triggered'
    transition = 'triggered'
    lastTriggeredAt = now
    conditionSince = null
  }

  const nextState: EvaluationState = {
    conditionSince,
    lastTriggeredAt,
    lastObservedValue: observedValue,
    state,
  }

  return {
    identity,
    observedAt: now,
    condition,
    state,
    transition,
    observedValue,
    threshold: preset.threshold,
    nextState,
  }
}
