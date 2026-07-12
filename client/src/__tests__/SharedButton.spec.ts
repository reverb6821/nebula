import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Loader2, Search } from '@lucide/vue'
import { SharedButton } from '@/components/shared'

describe('SharedButton.vue', () => {
  it('mostra la label passata come prop', () => {
    const wrapper = mount(SharedButton, {
      props: { label: 'Invia' },
    })
    expect(wrapper.text()).toContain('Invia')
  })

  it('mostra il contenuto dello slot di default al posto della label', () => {
    const wrapper = mount(SharedButton, {
      props: { label: 'Label Prop' },
      slots: { default: 'Contenuto Slot' },
    })
    expect(wrapper.text()).toContain('Contenuto Slot')
    expect(wrapper.text()).not.toContain('Label Prop')
  })

  it('mostra il loader e disabilita il bottone quando loading è true', () => {
    const wrapper = mount(SharedButton, {
      props: { loading: true },
    })
    expect(wrapper.findComponent(Loader2).exists()).toBe(true)
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('mostra l\'icona specificata se non è in stato loading', () => {
    const wrapper = mount(SharedButton, {
      props: { icon: Search },
    })
    expect(wrapper.findComponent(Search).exists()).toBe(true)
    expect(wrapper.findComponent(Loader2).exists()).toBe(false)
  })

  it('se loading è true, l\'icona non deve essere mostrata', () => {
    const wrapper = mount(SharedButton, {
      props: { icon: Search, loading: true },
    })
    expect(wrapper.findComponent(Loader2).exists()).toBe(true)
    expect(wrapper.findComponent(Search).exists()).toBe(false)
  })

  it('applica l\'attributo disabled se la prop disabled è true', () => {
    const wrapper = mount(SharedButton, {
      props: { disabled: true },
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })
})