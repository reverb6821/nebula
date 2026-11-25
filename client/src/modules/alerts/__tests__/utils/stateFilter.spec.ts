import { describe, expect, it } from 'vitest'
import { stateFilterOf, withStateFilter } from '../../utils/stateFilter'
import type { AlertFilters } from '../../store'

const base: AlertFilters = { states: [], categories: ['services'], severities: ['critical'] }

describe('alert state filter mapping', () => {
  it('nessuno stato selezionato corrisponde al chip All', () => {
    expect(stateFilterOf(base)).toBe('all')
  })

  it('uno stato singolo corrisponde al suo chip', () => {
    expect(stateFilterOf({ ...base, states: ['acknowledged'] })).toBe('acknowledged')
  })

  it('piu\' stati o pending ricadono su All', () => {
    expect(stateFilterOf({ ...base, states: ['triggered', 'resolved'] })).toBe('all')
    expect(stateFilterOf({ ...base, states: ['pending'] })).toBe('all')
  })

  it('All svuota gli stati e conserva categorie e gravita\'', () => {
    expect(withStateFilter({ ...base, states: ['triggered'] }, 'all')).toEqual(base)
  })

  it('selezionare uno stato non muta i filtri in ingresso', () => {
    const input: AlertFilters = { ...base, states: [] }
    const next = withStateFilter(input, 'resolved')
    expect(next.states).toEqual(['resolved'])
    expect(input.states).toEqual([])
    expect(next.categories).not.toBe(input.categories)
  })
})
