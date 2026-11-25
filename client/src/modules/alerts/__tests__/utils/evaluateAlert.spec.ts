import { describe, expect, it } from 'vitest'
import type { AlertPreset } from '@/types/alert'
import { evaluateAlert } from '@/modules/alerts/utils/evaluateAlert'

const preset: AlertPreset = {
  key: 'resources.cpu-high',
  category: 'resources',
  metric: 'cpuOverallPercent',
  severity: 'warning',
  comparison: 'gte',
  threshold: 90,
  minimumDurationMs: 1_000,
  cooldownMs: 10_000,
  message: 'CPU usage is high',
}

describe('evaluateAlert', () => {
  it('does not trigger before minimum duration', () => {
    const first = evaluateAlert(preset, 'cpu', 95, 1_000)
    const second = evaluateAlert(preset, 'cpu', 95, 2_000, first.nextState)

    expect(first.state).toBe('pending')
    expect(second.transition).toBe('triggered')
  })

  it('resolves and suppresses a retrigger during cooldown', () => {
    const first = evaluateAlert(preset, 'cpu', 95, 1_000)
    const triggered = evaluateAlert(preset, 'cpu', 95, 6_000, first.nextState)
    const resolved = evaluateAlert(preset, 'cpu', 20, 7_000, triggered.nextState)
    const suppressed = evaluateAlert(preset, 'cpu', 95, 8_000, resolved.nextState)

    expect(resolved.transition).toBe('resolved')
    expect(suppressed.transition).toBe('cooldown')
  })

  it('returns a stable identity and condition for safe values', () => {
    const evaluation = evaluateAlert(preset, 'host-1', 20, 1_000)

    expect(evaluation.identity).toBe('resources.cpu-high:host-1')
    expect(evaluation.condition).toBe(false)
    expect(evaluation.state).toBe('pending')
    expect(evaluation.observedValue).toBe(20)
    expect(evaluation.threshold).toBe(90)
  })

  it('does not trigger or resolve on null observations', () => {
    const pending = evaluateAlert(preset, 'cpu', 95, 1_000)
    const unavailablePending = evaluateAlert(preset, 'cpu', null, 10_000, pending.nextState)
    const triggered = evaluateAlert(preset, 'cpu', 95, 6_000, pending.nextState)
    const unavailableTriggered = evaluateAlert(preset, 'cpu', null, 7_000, triggered.nextState)

    expect(unavailablePending.transition).toBeNull()
    expect(unavailablePending.state).toBe('pending')
    expect(unavailableTriggered.transition).toBeNull()
    expect(unavailableTriggered.state).toBe('triggered')
  })

  it('uses the configured comparison including equality', () => {
    const equalPreset = { ...preset, comparison: 'eq' as const, threshold: 1 }

    expect(evaluateAlert(equalPreset, 'service', 1, 1_000).condition).toBe(true)
    expect(evaluateAlert(equalPreset, 'service', 2, 1_000).condition).toBe(false)
  })

  it('keeps resource identities independent', () => {
    const cpu = evaluateAlert(preset, 'cpu', 95, 1_000)
    const memory = evaluateAlert(preset, 'memory', 20, 2_000)

    expect(cpu.identity).not.toBe(memory.identity)
    expect(memory.state).toBe('pending')
    expect(memory.nextState.conditionSince).toBeNull()
  })

  it('does not emit repeated triggered transitions', () => {
    const first = evaluateAlert(preset, 'cpu', 95, 1_000)
    const triggered = evaluateAlert(preset, 'cpu', 95, 6_000, first.nextState)
    const repeated = evaluateAlert(preset, 'cpu', 95, 7_000, triggered.nextState)

    expect(triggered.state).toBe('triggered')
    expect(repeated.state).toBe('triggered')
    expect(repeated.transition).toBeNull()
  })

  it('allows a new pending condition after cooldown expires', () => {
    const first = evaluateAlert(preset, 'cpu', 95, 1_000)
    const triggered = evaluateAlert(preset, 'cpu', 95, 6_000, first.nextState)
    const resolved = evaluateAlert(preset, 'cpu', 20, 7_000, triggered.nextState)
    const afterCooldown = evaluateAlert(preset, 'cpu', 95, 17_000, resolved.nextState)

    expect(afterCooldown.transition).toBeNull()
    expect(afterCooldown.state).toBe('pending')
    expect(afterCooldown.nextState.conditionSince).toBe(17_000)
  })
})
