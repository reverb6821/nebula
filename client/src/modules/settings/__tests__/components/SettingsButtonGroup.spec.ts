import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsButtonGroup from '../../components/SettingsButtonGroup.vue'

// SharedButton è stubbato: questo file testa la logica di
// SettingsButtonGroup (props passate, evento emesso, ruoli ARIA sul
// contenitore), non il rendering interno di SharedButton/Button/reka-ui
// — quello è responsabilità dei rispettivi test, non di questo.
const SharedButtonStub = {
  name: 'SharedButton',
  inheritAttrs: false,
  emits: ['click'],
  template: `<button v-bind="$attrs" @click="$emit('click')"><slot /></button>`,
}

const options = [
  { value: 'sm', label: 'Small' },
  { value: 'base', label: 'Default' },
  { value: 'lg', label: 'Large' },
]

function mountGroup(props: Record<string, unknown> = {}) {
  return mount(SettingsButtonGroup, {
    props: {
      options,
      modelValue: 'base',
      ...props,
    },
    global: {
      stubs: { SharedButton: SharedButtonStub },
    },
  })
}

describe('SettingsButtonGroup', () => {
  it('renderizza un bottone per ogni opzione', () => {
    const wrapper = mountGroup()
    const buttons = wrapper.findAll('button[role="radio"]')
    expect(buttons).toHaveLength(options.length)
  })

  it('segna aria-checked=true solo sul bottone corrispondente a modelValue', () => {
    const wrapper = mountGroup({ modelValue: 'lg' })
    const buttons = wrapper.findAll('button[role="radio"]')

    expect(buttons[0]!.attributes('aria-checked')).toBe('false')
    expect(buttons[1]!.attributes('aria-checked')).toBe('false')
    expect(buttons[2]!.attributes('aria-checked')).toBe('true')
  })

  it('emette update:modelValue con il value corretto al click', async () => {
    const wrapper = mountGroup({ modelValue: 'base' })
    const buttons = wrapper.findAll('button[role="radio"]')

    await buttons[2]!.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['lg'])
  })

  it('il contenitore ha role=radiogroup e inoltra aria-labelledby', () => {
    const wrapper = mountGroup({ ariaLabelledby: 'settings-row-abc123' })
    const group = wrapper.find('[role="radiogroup"]')

    expect(group.exists()).toBe(true)
    expect(group.attributes('aria-labelledby')).toBe('settings-row-abc123')
  })

  it('usa lo slot di default per personalizzare il contenuto di ogni bottone', () => {
    const wrapper = mount(SettingsButtonGroup, {
      props: { options, modelValue: 'base' },
      global: { stubs: { SharedButton: SharedButtonStub } },
      slots: {
        default: `<template #default="{ option }">Custom: {{ option.label }}</template>`,
      },
    })

    expect(wrapper.text()).toContain('Custom: Small')
    expect(wrapper.text()).toContain('Custom: Default')
    expect(wrapper.text()).toContain('Custom: Large')
  })

  it('senza slot personalizzato, mostra opt.label come fallback', () => {
    const wrapper = mountGroup()
    expect(wrapper.text()).toContain('Small')
    expect(wrapper.text()).toContain('Default')
    expect(wrapper.text()).toContain('Large')
  })
})