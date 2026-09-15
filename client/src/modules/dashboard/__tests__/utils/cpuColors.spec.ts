import { describe, expect, it } from 'vitest'
import { CPU_COLORS, cpuColor } from '../../utils/cpuColors'

describe('cpuColor', () => {
  it('returns the color at the requested index', () => {
    expect(cpuColor(0)).toBe(CPU_COLORS[0])
    expect(cpuColor(3)).toBe(CPU_COLORS[3])
  })

  it('wraps around when there are more CPUs than palette colors', () => {
    expect(cpuColor(CPU_COLORS.length)).toBe(CPU_COLORS[0])
    expect(cpuColor(CPU_COLORS.length + 2)).toBe(CPU_COLORS[2])
  })
})