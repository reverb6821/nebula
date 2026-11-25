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
