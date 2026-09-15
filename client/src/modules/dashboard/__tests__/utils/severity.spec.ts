import { describe, expect, it } from 'vitest'
import {
  severityBgClass,
  severityFor,
  severityTextClass,
} from '../../utils/severity'

const limits = { danger: 85, warning: 60 }

describe('severity helpers', () => {
  it('uses destructive at and above the danger threshold', () => {
    expect(severityFor(85, limits)).toBe('destructive')
    expect(severityFor(100, limits)).toBe('destructive')
  })

  it('uses warning between thresholds and success below warning', () => {
    expect(severityFor(60, limits)).toBe('warning')
    expect(severityFor(84.9, limits)).toBe('warning')
    expect(severityFor(59.9, limits)).toBe('success')
  })

  it('maps severity to static Tailwind classes', () => {
    expect(severityTextClass(90, limits)).toBe('text-destructive')
    expect(severityBgClass(70, limits)).toBe('bg-warning')
    expect(severityTextClass(10, limits)).toBe('text-success')
  })
})