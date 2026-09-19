import type { AlertEvent, SourceHealth } from '@/types/alert'

export interface SerializedAlertLog {
  version: 1
  exportedAt: number
  sessionId: string
  events: AlertEvent[]
  sourceHealth: SourceHealth[]
}

function compareEvents(left: AlertEvent, right: AlertEvent): number {
  return left.firstDetectedAt - right.firstDetectedAt || left.id.localeCompare(right.id)
}

function compareTransitions(
  left: AlertEvent['transitions'][number],
  right: AlertEvent['transitions'][number],
): number {
  return left.at - right.at ||
    left.state.localeCompare(right.state) ||
    (left.observedValue ?? Number.NEGATIVE_INFINITY) - (right.observedValue ?? Number.NEGATIVE_INFINITY)
}

function compareSourceHealth(left: SourceHealth, right: SourceHealth): number {
  return left.source.localeCompare(right.source) ||
    left.category.localeCompare(right.category) ||
    left.updatedAt - right.updatedAt ||
    left.status.localeCompare(right.status) ||
    left.message.localeCompare(right.message)
}

export function serializeAlertLog(
  events: AlertEvent[],
  sourceHealth: SourceHealth[],
  sessionId: string,
  exportedAt: number,
): string {
  const document: SerializedAlertLog = {
    version: 1,
    exportedAt,
    sessionId,
    events: events
      .map((event) => ({
        ...event,
        transitions: [...event.transitions].sort(compareTransitions),
      }))
      .sort(compareEvents),
    sourceHealth: [...sourceHealth].sort(compareSourceHealth),
  }

  return JSON.stringify(document, null, 2)
}
