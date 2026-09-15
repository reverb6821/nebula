import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import SettingsLanguage from '../../components/SettingsLanguage.vue'

const setLocale = vi.fn()

// Mock di @/i18n: isoliamo il test dal contenuto reale dei locale file,
// serve solo che availableLocales esista (per il v-for) e che setLocale
// sia spiabile.
vi.mock('@/i18n', () => ({
  availableLocales: [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  ],
  setLocale: (...args: unknown[]) => setLocale(...args),
}))

const messages = {
  en: {
    settings: {
      sectionLanguage: 'Language',
      language: 'Language',
      languageHint: '',
    },
  },
}

// Select va stubbato per intero (con tutti i suoi sotto-componenti):
// reka-ui SelectRoot fornisce context via provide/inject ai figli, che
// altrimenti proverebbero a fare inject da un provider inesistente se
// solo Select fosse stubbato e i figli reali. Qui non ci interessa il
// rendering della select, solo che l'evento arrivi a onLocaleChange.
const SelectStub = {
  name: 'Select',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div><slot /></div>',
}

const PassthroughStub = { template: '<div><slot /></div>' }

function mountComponent() {
  const i18n = createI18n({ legacy: false, locale: 'en', messages })
  return mount(SettingsLanguage, {
    global: {
      plugins: [i18n],
      stubs: {
        Select: SelectStub,
        SelectTrigger: PassthroughStub,
        SelectContent: PassthroughStub,
        SelectItem: PassthroughStub,
        SelectValue: PassthroughStub,
        SettingsSection: PassthroughStub,
        // Il default slot di SettingsRow è scoped (:label-id): lo stub
        // deve forwardarlo, altrimenti il contenuto con <Select> dentro
        // non verrebbe mai renderizzato.
        SettingsRow: { template: '<div><slot :label-id="\'test-label\'" /></div>' },
      },
    },
  })
}

describe('SettingsLanguage — onLocaleChange', () => {
  beforeEach(() => {
    setLocale.mockClear()
  })

  it('chiama setLocale quando il valore emesso è una stringa', async () => {
    const wrapper = mountComponent()
    const select = wrapper.findComponent(SelectStub)

    await select.vm.$emit('update:modelValue', 'it')

    expect(setLocale).toHaveBeenCalledTimes(1)
    expect(setLocale).toHaveBeenCalledWith('it')
  })

  it('non chiama setLocale se il valore emesso non è una stringa (type-guard)', async () => {
    const wrapper = mountComponent()
    const select = wrapper.findComponent(SelectStub)

    // AcceptableValue di reka-ui ammette anche array/undefined in casi
    // limite (es. select multipla, o evento vuoto): onLocaleChange deve
    // ignorarli silenziosamente invece di propagare un valore non valido
    // a setLocale/allo storage.
    await select.vm.$emit('update:modelValue', ['it', 'en'])
    await select.vm.$emit('update:modelValue', 42)
    await select.vm.$emit('update:modelValue', undefined)

    expect(setLocale).not.toHaveBeenCalled()
  })
})