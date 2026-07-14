import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsView from '@/modules/settings/views/SettingsView.vue'

const mockReset = vi.fn()
vi.mock('@/modules/settings/store', () => ({
  useSettingsStore: () => ({
    reset: mockReset,
    fontSize: 'base',
    set: vi.fn(),
    s: { fontSize: 'base' } 
  }),
}))

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>()
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string) => key,
      locale: 'en-GB'
    }),
  }
})

describe('SettingsView.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createWrapper = () => {
    return mount(SettingsView, {
      global: {
        // Usiamo gli stubs qui: intercettano i componenti a prescindere dal percorso di importazione
        stubs: {
          SettingsLanguage: { template: '<div class="mock-settings-language" />' },
          SettingsAppearance: { template: '<div class="mock-settings-appearance" />' }
        }
      }
    })
  }

  it('dovrebbe renderizzare l\'header con i testi di traduzione corretti', () => {
    const wrapper = createWrapper()

    const title = wrapper.find('h1')
    const subtitle = wrapper.find('p')

    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('settings.title')

    expect(subtitle.exists()).toBe(true)
    expect(subtitle.text()).toBe('settings.subtitle')
  })

  it('dovrebbe includere i sotto-componenti della lingua e dell\'aspetto', () => {
    const wrapper = createWrapper()

    expect(wrapper.find('.mock-settings-language').exists()).toBe(true)
    expect(wrapper.find('.mock-settings-appearance').exists()).toBe(true)
  })

  it('dovrebbe invocare la funzione reset dello store quando si clicca sul bottone di ripristino', async () => {
    const wrapper = createWrapper()

    const resetButton = wrapper.find('button')
    expect(resetButton.exists()).toBe(true)
    expect(resetButton.text()).toContain('common.reset')

    await resetButton.trigger('click')

    expect(mockReset).toHaveBeenCalledTimes(1)
  })
})