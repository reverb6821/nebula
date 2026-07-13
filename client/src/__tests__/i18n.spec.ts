import { describe, expect, it } from 'vitest'
import { i18n } from '../i18n' // Aggiusta il percorso in base alla tua struttura
import { enGB } from '../i18n/en-GB'
import { itIT } from '../i18n/it-IT'

describe('Configurazione i18n', () => {
  it('dovrebbe avere "en-GB" come locale di default e fallback', () => {
    expect(i18n.global.locale.value).toBe('en-GB')
    expect(i18n.global.fallbackLocale.value).toBe('en-GB')
  })

  it('dovrebbe contenere le lingue configurate', () => {
    const availableLocales = i18n.global.availableLocales
    expect(availableLocales).toContain('en-GB')
    expect(availableLocales).toContain('it-IT')
  })

  it('dovrebbe avere la stessa struttura di chiavi tra en-GB e it-IT', () => {
    const enKeys = Object.keys(enGB.demo)
    const itKeys = Object.keys(itIT.demo)
    
    expect(enKeys).toEqual(itKeys)
  })

  it('dovrebbe tradurre correttamente in en-GB', () => {
    i18n.global.locale.value = 'en-GB'
    
    // Accedi tramite la proprietà .t di vue-i18n
    expect(i18n.global.t('demo.title')).toBe('My App Neutralinojs + Vue')
    expect(i18n.global.t('demo.subtitle')).toBe("Check the browser/app to see folder's name.")
  })

  it('dovrebbe tradurre correttamente in it-IT', () => {
    i18n.global.locale.value = 'it-IT'
    
    expect(i18n.global.t('demo.title')).toBe('La mia App Neutralinojs + Vue')
    expect(i18n.global.t('demo.subtitle')).toBe('ontrolla la console del browser/app per vedere i file della cartella.')
  })
})