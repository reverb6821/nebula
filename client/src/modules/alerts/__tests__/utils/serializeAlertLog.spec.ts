import { describe, expect, it } from 'vitest'
import type { AlertEvent, SourceHealth } from '@/types/alert'
import { serializeAlertLog } from '@/modules/alerts/utils/serializeAlertLog'

const event = (id: string, firstDetectedAt: number, transitions: AlertEvent['transitions']): AlertEvent => ({
  id,
  presetKey: 'resources.cpu-high',
  category: 'resources',
  resourceKey: id,
  severity: 'warning',
  state: 'resolved',
  observedValue: 20,
  threshold: 90,
  firstDetectedAt,
  lastUpdatedAt: 3_000,
  acknowledgedAt: null,
  resolvedAt: 3_000,
  transitions,
})

const health: SourceHealth = {
  source: 'sensors',
  category: 'temperatures',
  status: 'degraded',
  message: 'sensor unavailable',
  updatedAt: 2_000,
}

describe('serializeAlertLog', () => {
  it('serializes a versioned document with deterministic ordering', () => {
    const input = [
      event('late', 2_000, [
        { state: 'resolved', at: 3_000, observedValue: 20 },
        { state: 'triggered', at: 2_000, observedValue: 95 },
      ]),
      event('early', 1_000, [
        { state: 'resolved', at: 2_000, observedValue: 20 },
        { state: 'triggered', at: 1_000, observedValue: 95 },
      ]),
    ]

    const output = JSON.parse(serializeAlertLog(input, [health], 'session-1', 4_000)) as {
      version: number
      exportedAt: number
      sessionId: string
      events: AlertEvent[]
      sourceHealth: SourceHealth[]
    }

    expect(output.version).toBe(1)
    expect(output.exportedAt).toBe(4_000)
    expect(output.sessionId).toBe('session-1')
    expect(output.events.map(({ id }) => id)).toEqual(['early', 'late'])
    expect(output.events[0]?.transitions.map(({ at }) => at)).toEqual([1_000, 2_000])
  })

  it('uses deterministic tie ordering for events and transitions', () => {
    const input = [
      event('b', 1_000, [
        { state: 'resolved', at: 2_000, observedValue: 20 },
        { state: 'triggered', at: 2_000, observedValue: 95 },
      ]),
      event('a', 1_000, [
        { state: 'triggered', at: 2_000, observedValue: 95 },
        { state: 'resolved', at: 2_000, observedValue: 20 },
      ]),
    ]

    const output = JSON.parse(serializeAlertLog(input, [], 'session-1', 4_000)) as {
      events: AlertEvent[]
    }

    expect(output.events.map(({ id }) => id)).toEqual(['a', 'b'])
    expect(output.events[0]?.transitions.map(({ state }) => state)).toEqual(['resolved', 'triggered'])
  })

  it('does not mutate source arrays while sorting', () => {
    const events = [event('b', 2_000, []), event('a', 1_000, [])]
    serializeAlertLog(events, [], 'session-1', 4_000)

    expect(events.map(({ id }) => id)).toEqual(['b', 'a'])
  })
})
