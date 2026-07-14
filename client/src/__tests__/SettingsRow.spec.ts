import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsRow from '@/modules/settings/components/SettingsRow.vue'

describe('SettingsRow.vue', () => {
  it('dovrebbe renderizzare la label correttamente', () => {
    const wrapper = mount(SettingsRow, {
      props: {
        label: 'Lingua Applicazione',
      },
    })

    expect(wrapper.text()).toContain('Lingua Applicazione')
  })

  it("dovrebbe mostrare l'hint solo se viene passato come prop", () => {
    // Caso 1: Senza hint
    const wrapperWithoutHint = mount(SettingsRow, {
      props: { label: 'Test Label' },
    })
    expect(wrapperWithoutHint.findAll('p')).toHaveLength(1)

    // Caso 2: Con hint
    const wrapperWithHint = mount(SettingsRow, {
      props: {
        label: 'Test Label',
        hint: 'Questo è un suggerimento',
      },
    })
    
    // Converte in un array nativo per evitare l'errore di TypeScript
    const hintsPresent = [...wrapperWithHint.findAll('p')]
    const hintElement = hintsPresent[1]

    expect(hintsPresent).toHaveLength(2)
    expect(hintElement).toBeTruthy()
    if (!hintElement) return

    expect(hintElement.text()).toBe('Questo è un suggerimento')
  })

  it('dovrebbe renderizzare il contenuto passato nello slot', () => {
    const wrapper = mount(SettingsRow, {
      props: {
        label: 'Test Slot',
      },
      slots: {
        default: '<button class="my-custom-input">Click Me</button>',
      },
    })

    const customInput = wrapper.find('.my-custom-input')
    expect(customInput.exists()).toBe(true)
    expect(customInput.text()).toBe('Click Me')
  })
})