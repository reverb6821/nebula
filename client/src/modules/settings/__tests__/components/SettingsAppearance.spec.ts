import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import SettingsAppearance from '../../components/SettingsAppearance.vue'

// Stesso motivo del mock in store.spec.ts: niente window.NL_PORT in jsdom.
vi.mock('@neutralinojs/lib', () => ({
  storage: {
    getData: vi.fn().mockRejectedValue(new Error('NE_ST_NOSTKEY')),
    setData: vi.fn().mockResolvedValue(undefined),
  },
}))

// Messaggi minimi e controllati dal test, indipendenti dai file di
// traduzione reali dell'app: qui interessa solo che le label cambino con
// la lingua, non il loro contenuto esatto in produzione.
const messages = {
  en: {
    settings: {
      fontSize: 'Font size',
      fontSizeSmall: 'Small',
      fontSizeDefault: 'Default',
      fontSizeLarge: 'Large',
      fontSizeXL: 'Extra large',
      fontFamily: 'Font family',
      fontDefault: 'System',
      fontSans: 'Sans-serif',
      fontMono: 'Monospace',
      fontDyslexic: 'Dyslexic-friendly',
      lineHeight: 'Line height',
      lineHeightNormal: 'Normal',
      lineHeightRelaxed: 'Relaxed',
      lineHeightLoose: 'Loose',
      reducedMotion: 'Reduce motion',
      reducedMotionHint: '',
      highContrast: 'High contrast',
      highContrastHint: '',
      sectionAppearance: 'Appearance',
    },
  },
  it: {
    settings: {
      fontSize: 'Dimensione testo',
      fontSizeSmall: 'Piccolo',
      fontSizeDefault: 'Predefinito',
      fontSizeLarge: 'Grande',
      fontSizeXL: 'Molto grande',
      fontFamily: 'Font',
      fontDefault: 'Sistema',
      fontSans: 'Senza grazie',
      fontMono: 'Monospazio',
      fontDyslexic: 'Per dislessia',
      lineHeight: 'Interlinea',
      lineHeightNormal: 'Normale',
      lineHeightRelaxed: 'Rilassata',
      lineHeightLoose: 'Ampia',
      reducedMotion: 'Riduci animazioni',
      reducedMotionHint: '',
      highContrast: 'Alto contrasto',
      highContrastHint: '',
      sectionAppearance: 'Aspetto',
    },
  },
}

function createTestI18n(locale: 'en' | 'it' = 'en') {
  return createI18n({ legacy: false, locale, fallbackLocale: 'en', messages })
}

// Stub di SettingsButtonGroup: cattura le options ricevute come prop
// invece di dover navigare il DOM renderizzato — testa direttamente il
// computed, non il rendering di SettingsButtonGroup (già coperto nel suo
// spec dedicato).
const SettingsButtonGroupStub = {
  name: 'SettingsButtonGroup',
  props: ['options', 'modelValue', 'ariaLabelledby', 'vertical'],
  template: `<div class="stub-group" :data-options="JSON.stringify(options)" />`,
}

function mountComponent(i18n: ReturnType<typeof createTestI18n>) {
  return mount(SettingsAppearance, {
    global: {
      plugins: [i18n],
      stubs: { SettingsButtonGroup: SettingsButtonGroupStub },
    },
  })
}

function optionsOf(wrapper: VueWrapper, index: number) {
  const el = wrapper.findAll('.stub-group')[index]!
  return JSON.parse(el.attributes('data-options')!) as {
    value: string
    label: string
    previewFont?: string
  }[]
}

describe('SettingsAppearance — computed delle label', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('genera le label di fontSize nella lingua attiva', () => {
    const wrapper = mountComponent(createTestI18n('it'))

    const fontSize = optionsOf(wrapper, 0)
    expect(fontSize.map((o) => o.label)).toEqual([
      'Piccolo', 'Predefinito', 'Grande', 'Molto grande',
    ])
    expect(fontSize.map((o) => o.value)).toEqual(['sm', 'base', 'lg', 'xl'])
  })

  it('ricalcola le label quando la lingua cambia a runtime, senza restare congelate al primo render', async () => {
    const i18n = createTestI18n('en')
    const wrapper = mountComponent(i18n)

    expect(optionsOf(wrapper, 0).map((o) => o.label)).toContain('Small')

    // Simula il cambio lingua che farebbe SettingsLanguage.vue via setLocale()
    i18n.global.locale.value = 'it'
    await nextTick()

    expect(optionsOf(wrapper, 0).map((o) => o.label)).toContain('Piccolo')
  })

  it('genera le opzioni di fontFamily col previewFont corretto per ciascuna', () => {
    const wrapper = mountComponent(createTestI18n('en'))

    const fontFamily = optionsOf(wrapper, 1)
    expect(fontFamily).toEqual([
      { value: 'system', label: 'System', previewFont: 'system-ui' },
      { value: 'inter', label: 'Sans-serif', previewFont: 'Inter' },
      { value: 'mono', label: 'Monospace', previewFont: 'monospace' },
      { value: 'dyslexic', label: 'Dyslexic-friendly', previewFont: 'system-ui' },
    ])
  })

  it('genera le opzioni di lineHeight nell\'ordine atteso', () => {
    const wrapper = mountComponent(createTestI18n('en'))

    const lineHeight = optionsOf(wrapper, 2)
    expect(lineHeight.map((o) => o.value)).toEqual(['normal', 'relaxed', 'loose'])
    expect(lineHeight.map((o) => o.label)).toEqual(['Normal', 'Relaxed', 'Loose'])
  })
})