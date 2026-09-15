import { describe, expect, it } from 'vitest'
import { h, markRaw } from 'vue'
import { mount } from '@vue/test-utils'
import KpiCard from '../../components/KpiCard.vue'

const IconStub = markRaw({ render: () => h('svg') })

describe('KpiCard', () => {
  it('renders label, value, and optional subtitle', () => {
    const wrapper = mount(KpiCard, {
      props: { icon: IconStub, label: 'CPU', value: '42%', sub: '8 cores' },
    })

    expect(wrapper.text()).toContain('CPU')
    expect(wrapper.text()).toContain('42%')
    expect(wrapper.text()).toContain('8 cores')
  })

  it('maps warning severity to warning classes', () => {
    const wrapper = mount(KpiCard, {
      props: { icon: IconStub, label: 'CPU', value: '90%', severity: 'warning' },
    })

    expect(wrapper.find('.bg-warning').exists()).toBe(true)
    expect(wrapper.find('.text-warning').exists()).toBe(true)
  })

  it('omits the severity indicator when severity is not provided', () => {
    const wrapper = mount(KpiCard, {
      props: { icon: IconStub, label: 'CPU', value: '42%' },
    })

    expect(wrapper.find('.bg-success, .bg-warning, .bg-destructive').exists()).toBe(false)
  })
})
