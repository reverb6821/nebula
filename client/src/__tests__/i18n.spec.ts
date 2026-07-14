import { beforeEach, describe, expect, it } from 'vitest'
import { i18n, availableLocales, setLocale } from '@/i18n/index'
import { enGB } from '@/i18n/en-GB'
import { itIT } from '@/i18n/it-IT'

// Funzione helper per estrarre ricorsivamente tutte le chiavi di un oggetto
function getDeepKeys(obj: Record<string, any>, prefix = ''): string[] {
  return Object.keys(obj).reduce<string[]>((res, el) => {
    if (Array.isArray(obj[el])) {
      return [...res, prefix + el]
    } else if (typeof obj[el] === 'object' && obj[el] !== null) {
      return [...res, prefix + el, ...getDeepKeys(obj[el], prefix + el + '.')]
    }
    return [...res, prefix + el]
  }, [])
}

describe('Configurazione i18n', () => {
  beforeEach(() => {
    localStorage.clear()
    // Ripristina il locale iniziale di default prima di ogni test
    setLocale('en-GB')
  })

  it('dovrebbe avere "en-GB" come locale di default e fallback', () => {
    expect(i18n.global.locale.value).toBe('en-GB')
    expect(i18n.global.fallbackLocale.value).toBe('en-GB')
  })

  it('dovrebbe contenere le lingue configurate', () => {
    expect(availableLocales).toContainEqual({ code: 'en-GB', label: 'English (UK)', flag: '🇬🇧' })
    expect(availableLocales).toContainEqual({ code: 'it-IT', label: 'Italiano', flag: '🇮🇹' })
  })

  it('dovrebbe avere la stessa struttura di chiavi tra en-GB e it-IT', () => {
    const keysEN = getDeepKeys(enGB).sort()
    const keysIT = getDeepKeys(itIT).sort()

    // Questo confronto fallirà se mancano chiavi o se i tipi/livelli sono asimmetrici
    expect(keysEN).toEqual(keysIT)
  })

  it('dovrebbe tradurre correttamente in en-GB', () => {
    setLocale('en-GB')
    
    // Sostituisci 'common.refresh' con una chiave realmente esistente nel tuo file en-GB.ts
    const translation = i18n.global.t('common.refresh') 
    expect(translation).toBe(enGB.common.refresh) 
  })

  it('dovrebbe tradurre correttamente in it-IT', () => {
    setLocale('it-IT')

    // Sostituisci 'common.refresh' con una chiave realmente esistente nel tuo file it-IT.ts
    const translation = i18n.global.t('common.refresh')
    expect(translation).toBe(itIT.common.refresh)
  })
})