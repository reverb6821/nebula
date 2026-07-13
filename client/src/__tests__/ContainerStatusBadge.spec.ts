import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContainerStatusBadge from '@/modules/docker/components/ContainerStatusBadge.vue'

describe('ContainerStatusBadge.vue', () => {
  it('mostra correttamente il testo e le classi per lo stato running', () => {
    const wrapper = mount(ContainerStatusBadge, {
      props: { status: 'running' }
    })
    
    expect(wrapper.text()).toContain('running')
    expect(wrapper.classes()).toContain('bg-emerald-500/15')
    
    const icon = wrapper.find('.animate-pulse')
    expect(icon.exists()).toBe(true)
  })

  it('mostra correttamente il testo e le classi per lo stato dead', () => {
    const wrapper = mount(ContainerStatusBadge, {
      props: { status: 'dead' }
    })
    
    expect(wrapper.text()).toContain('dead')
    expect(wrapper.classes()).toContain('bg-red-500/15')
  })

  it('usa il fallback in caso di stato sconosciuto', () => {
    const wrapper = mount(ContainerStatusBadge, {
      props: { status: 'unknown-status' as any }
    })
    
    expect(wrapper.text()).toContain('unknown-status')
    expect(wrapper.classes()).toContain('bg-zinc-500/15')
  })
})