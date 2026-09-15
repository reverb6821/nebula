import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { ChevronUp, ChevronDown, ChevronsUpDown } from '@lucide/vue'
import ProcessTableHeader from '../../components/ProcessTableHeader.vue'

describe('ProcessTableHeader', () => {
  it('senza sortKey: mostra un div non interattivo, nessun bottone e nessun aria-sort', () => {
    const wrapper = mount(ProcessTableHeader, {
      props: { label: 'Nome', activeSortKey: 'cpuPercent', sortDir: 'desc' },
    })

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.find('th').attributes('aria-sort')).toBeUndefined()
    expect(wrapper.text()).toBe('Nome')
  })

  it('con sortKey ma non attiva: mostra il bottone con icona neutra (ChevronsUpDown) e aria-sort="none"', () => {
    const wrapper = mount(ProcessTableHeader, {
      props: {
        label: 'CPU', sortKey: 'cpuPercent', activeSortKey: 'memPercent', sortDir: 'desc',
      },
    })

    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('th').attributes('aria-sort')).toBe('none')
    expect(wrapper.findComponent(ChevronsUpDown).exists()).toBe(true)
    expect(wrapper.findComponent(ChevronUp).exists()).toBe(false)
    expect(wrapper.findComponent(ChevronDown).exists()).toBe(false)
  })

  it('attiva e ascendente: mostra ChevronUp e aria-sort="ascending"', () => {
    const wrapper = mount(ProcessTableHeader, {
      props: {
        label: 'CPU', sortKey: 'cpuPercent', activeSortKey: 'cpuPercent', sortDir: 'asc',
      },
    })

    expect(wrapper.find('th').attributes('aria-sort')).toBe('ascending')
    expect(wrapper.findComponent(ChevronUp).exists()).toBe(true)
    expect(wrapper.findComponent(ChevronsUpDown).exists()).toBe(false)
  })

  it('attiva e discendente: mostra ChevronDown e aria-sort="descending"', () => {
    const wrapper = mount(ProcessTableHeader, {
      props: {
        label: 'CPU', sortKey: 'cpuPercent', activeSortKey: 'cpuPercent', sortDir: 'desc',
      },
    })

    expect(wrapper.find('th').attributes('aria-sort')).toBe('descending')
    expect(wrapper.findComponent(ChevronDown).exists()).toBe(true)
    expect(wrapper.findComponent(ChevronsUpDown).exists()).toBe(false)
  })

  it('click sul bottone emette sort con la sortKey', async () => {
    const wrapper = mount(ProcessTableHeader, {
      props: {
        label: 'CPU', sortKey: 'cpuPercent', activeSortKey: 'memPercent', sortDir: 'desc',
      },
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('sort')).toEqual([['cpuPercent']])
  })

  it('align="right" applica text-right sul th e flex-row-reverse sul bottone', () => {
    const wrapper = mount(ProcessTableHeader, {
      props: {
        label: 'CPU', sortKey: 'cpuPercent', activeSortKey: 'cpuPercent', sortDir: 'desc', align: 'right',
      },
    })

    expect(wrapper.find('th').classes()).toContain('text-right')
    expect(wrapper.find('button').classes()).toContain('flex-row-reverse')
  })
})