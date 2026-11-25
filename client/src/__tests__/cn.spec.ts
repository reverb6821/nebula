import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('mantiene i token di dimensione custom accanto a un colore text-*', () => {
    expect(cn('text-kpi font-extrabold', 'text-warning')).toBe('text-kpi font-extrabold text-warning')
    expect(cn('text-13 text-[#e4e4e7]', 'text-[#ffb3ad]')).toBe('text-13 text-[#ffb3ad]')
  })

  it('risolve i conflitti tra dimensioni, custom e standard', () => {
    expect(cn('text-13', 'text-sm')).toBe('text-sm')
    expect(cn('text-sm', 'text-15')).toBe('text-15')
  })
})
