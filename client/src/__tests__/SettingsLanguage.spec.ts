import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import SettingsLanguage from '@/modules/settings/components/SettingsLanguage.vue'
import SettingsSection from '@/modules/settings/components/SettingsSection.vue'
import SettingsRow from '@/modules/settings/components/SettingsRow.vue'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

vi.mock('@/components/ui/select', () => ({
  Select: {
    props: ['modelValue'],
    template: '<div class="mock-select"><slot /></div>'
  },
  SelectTrigger: {
    template: '<button><slot /></button>'
  },
  SelectValue: {
    template: '<span />'
  },
  SelectContent: {
    template: '<div class="mock-content"><slot /></div>'
  },
  SelectItem: {
    props: ['value'],
    template: '<div class="mock-item" :value="value"><slot /></div>'
  }
}))

const mockSetLocale = vi.fn()
vi.mock('@/i18n', () => ({
  availableLocales: [
    { code: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
    { code: 'it-IT', label: 'Italiano', flag: '🇮🇹' },
  ],
  setLocale: (code: string) => mockSetLocale(code),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: 'en-GB',
  }),
}))

describe('SettingsLanguage.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dovrebbe renderizzare la sezione lingua con le etichette corrette', () => {
    const wrapper = mount(SettingsLanguage, {
      global: {
        components: { SettingsSection, SettingsRow, Select, SelectTrigger, SelectValue, SelectContent, SelectItem },
      },
    })

    const section = wrapper.findComponent(SettingsSection)
    expect(section.props('title')).toBe('settings.sectionLanguage')

    const row = wrapper.findComponent(SettingsRow)
    expect(row.props('label')).toBe('settings.language')
    expect(row.props('hint')).toBe('settings.languageHint')
  })

  it('dovrebbe inizializzare il componente Select con il locale attivo', () => {
    const wrapper = mount(SettingsLanguage, {
      global: {
        components: { SettingsSection, SettingsRow, Select, SelectTrigger, SelectValue, SelectContent, SelectItem },
      },
    })

    const select = wrapper.findComponent(Select)
    expect(select.props('modelValue')).toBe('en-GB')
  })

it('dovrebbe generare gli elementi di selezione per ogni locale disponibile', () => {
    const wrapper = mount(SettingsLanguage, {
      global: {
        components: { SettingsSection, SettingsRow },
      },
    })

    const items = wrapper.findAll('.mock-item')
    expect(items).toHaveLength(2)

    const firstItem = items[0]
    const secondItem = items[1]

    expect(firstItem).toBeTruthy()
    expect(secondItem).toBeTruthy()
    if (!firstItem || !secondItem) return

    expect(firstItem.attributes('value')).toBe('en-GB')
    expect(firstItem.text()).toBe('🇬🇧 English (UK)')

    expect(secondItem.attributes('value')).toBe('it-IT')
    expect(secondItem.text()).toBe('🇮🇹 Italiano')
  })

  it('dovrebbe chiamare setLocale quando la selezione cambia', async () => {
    const wrapper = mount(SettingsLanguage, {
      global: {
        components: { SettingsSection, SettingsRow, Select, SelectTrigger, SelectValue, SelectContent, SelectItem },
      },
    })

    const select = wrapper.findComponent(Select)

    select.vm.$emit('update:modelValue', 'it-IT')

    expect(mockSetLocale).toHaveBeenCalledWith('it-IT')
  })
})