import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { CheckCircle2 } from '@lucide/vue'
import SharedStatusBadge from '../SharedStatusBadge.vue'

describe('SharedStatusBadge', () => {
  it('renders the label and semantic tone as a reusable badge', () => {
    const wrapper = mount(SharedStatusBadge, {
      props: {
        label: 'Running',
        tone: 'success',
        icon: CheckCircle2,
        animation: 'pulse',
      },
    })

    expect(wrapper.text()).toContain('Running')
    expect(wrapper.classes()).toContain('border-success/40')
    expect(wrapper.classes()).toContain('text-success')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('supports a compact dot mode without rendering a badge wrapper', () => {
    const wrapper = mount(SharedStatusBadge, {
      props: {
        label: 'Active',
        tone: 'primary',
        mode: 'dot',
      },
    })

    expect(wrapper.text()).toContain('Active')
    expect(wrapper.classes()).toContain('border-primary/40')
    expect(wrapper.find('span[aria-hidden="true"]').classes()).toContain('bg-primary')
  })
})
