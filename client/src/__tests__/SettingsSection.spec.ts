import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsSection from '@/modules/settings/components/SettingsSection.vue'

vi.mock('@/components/ui/separator', () => ({
  Separator: {
    template: '<hr class="mock-separator" />'
  }
}))

describe('SettingsSection.vue', () => {
  it('dovrebbe renderizzare il titolo correttamente all\'interno del tag h2', () => {
    const wrapper = mount(SettingsSection, {
      props: {
        title: 'Impostazioni Account',
      },
    })

    const heading = wrapper.find('h2')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('Impostazioni Account')
  })

  it('dovrebbe renderizzare il componente Separator', () => {
    const wrapper = mount(SettingsSection, {
      props: {
        title: 'Test Separator',
      },
    })

    const separator = wrapper.find('.mock-separator')
    expect(separator.exists()).toBe(true)
  })

  it('dovrebbe renderizzare il contenuto passato nello slot predefinito', () => {
    const wrapper = mount(SettingsSection, {
      props: {
        title: 'Sezione Avanzata',
      },
      slots: {
        default: '<div class="custom-content">Contenuto Slot</div>',
      },
    })

    const slotContent = wrapper.find('.custom-content')
    expect(slotContent.exists()).toBe(true)
    expect(slotContent.text()).toBe('Contenuto Slot')
  })
})