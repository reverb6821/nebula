import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { SharedSwitch } from '@/components/shared'

describe('SharedSwitch.vue', () => {
  it('genera un id casuale di default se non fornito e lo associa alla label', () => {
    const wrapper = mount(SharedSwitch, {
      slots: { default: 'Attiva opzione' },
    })

    const button = wrapper.find('button[role="switch"]')
    const label = wrapper.find('label')

    const buttonId = button.attributes('id')
    expect(buttonId).toMatch(/^switch-[a-z0-9]{7}$/)
    expect(label.attributes('for')).toBe(buttonId)
  })

  it('utilizza l\'id passato come prop', () => {
    const wrapper = mount(SharedSwitch, {
      props: { id: 'custom-id' },
      slots: { default: 'Label text' },
    })

    expect(wrapper.find('button').attributes('id')).toBe('custom-id')
    expect(wrapper.find('label').attributes('for')).toBe('custom-id')
  })

  it('riflette lo stato di modelValue tramite aria-checked e le classi CSS', async () => {
    const wrapper = mount(SharedSwitch, {
      props: { modelValue: false },
    })

    let button = wrapper.find('button')
    expect(button.attributes('aria-checked')).toBe('false')
    expect(button.classes()).toContain('bg-zinc-700')

    // Cambiamo la prop per verificare il cambio di stato visivo
    await wrapper.setProps({ modelValue: true })
    expect(button.attributes('aria-checked')).toBe('true')
    expect(button.classes()).toContain('bg-indigo-500')
  })

  it('emette "update:modelValue" invertito quando viene cliccato', async () => {
    const wrapper = mount(SharedSwitch, {
      props: { modelValue: false },
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('non emette alcun evento se il componente è disabilitato', async () => {
    const wrapper = mount(SharedSwitch, {
      props: { modelValue: false, disabled: true },
    })

    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()

    await button.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })
})