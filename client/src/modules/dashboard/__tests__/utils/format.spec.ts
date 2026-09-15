import { describe, expect, it } from 'vitest'
import {
  formatBytesDecimal,
  formatPercent,
  formatRateBinary,
  formatTemp,
  formatWatts,
} from '../../utils/format'

describe('dashboard formatters', () => {
  it('formats decimal byte sizes and invalid values', () => {
    expect(formatBytesDecimal(999)).toBe('999 byte')
    expect(formatBytesDecimal(1500)).toBe('1,5 kB')
    expect(formatBytesDecimal(Number.NaN)).toBe('–')
  })

  it('formats binary rates with a zero floor', () => {
    expect(formatRateBinary(0)).toBe('0 byte/s')
    expect(formatRateBinary(1024)).toBe('1,0 KiB/s')
    expect(formatRateBinary(Number.POSITIVE_INFINITY)).toBe('0 byte/s')
  })

  it('formats percentages, temperatures, and watts including unavailable values', () => {
    expect(formatPercent(12.34)).toBe('12,3%')
    expect(formatTemp(null)).toBe('– °C')
    expect(formatTemp(42.6)).toBe('43 °C')
    expect(formatWatts(null)).toBe('– W')
    expect(formatWatts(12.34)).toBe('12,3 W')
  })
})