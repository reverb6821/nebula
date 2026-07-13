import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DaemonStatusBadge from '@/modules/daemons/components/DaemonStatusBadge.vue'

describe('DaemonStatusBadge.vue', () => {
  it('esegue il rendering corretto dello stato active', () => {
    const wrapper = mount(DaemonStatusBadge, {
      props: { status: 'active' }
    })
    expect(wrapper.text()).toContain('active')
    expect(wrapper.find('.animate-pulse').exists()).toBe(true)
    expect(wrapper.classes()).toContain('text-emerald-400')
  })

  it('esegue il rendering corretto dello stato failed', () => {
    const wrapper = mount(DaemonStatusBadge, {
      props: { status: 'failed' }
    })
    expect(wrapper.text()).toContain('failed')
    expect(wrapper.classes()).toContain('text-red-400')
  })
})