import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettingsStore } from '@/modules/settings/store'

const STORAGE_KEY = 'nebula_settings'

describe('useSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    
    localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('style')
    
    vi.restoreAllMocks()
  })

  describe('Inizializzazione e Caricamento', () => {
    it('dovrebbe inizializzarsi con i valori di default se localStorage è vuoto', () => {
      const store = useSettingsStore()

      expect(store.state).toEqual({
        fontSize: 'base',
        fontFamily: 'system',
        lineHeight: 'normal',
        reducedMotion: false,
        highContrast: false,
      })

      const html = document.documentElement
      expect(html.style.getPropertyValue('--app-font-family')).toBe('system-ui, -apple-system, sans-serif')
      expect(html.style.getPropertyValue('--app-font-size')).toBe('14px')
      expect(html.style.getPropertyValue('--app-line-height')).toBe('1.5')
      expect(html.classList.contains('reduce-motion')).toBe(false)
      expect(html.classList.contains('high-contrast')).toBe(false)
    })

    it('dovrebbe caricare i dati salvati in localStorage all\'avvio', () => {
      const savedSettings = {
        fontSize: 'xl',
        fontFamily: 'mono',
        lineHeight: 'loose',
        reducedMotion: true,
        highContrast: true,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSettings))

      const store = useSettingsStore()

      expect(store.state).toEqual(savedSettings)
      
      const html = document.documentElement
      expect(html.style.getPropertyValue('--app-font-family')).toBe('"JetBrains Mono", "Fira Code", monospace')
      expect(html.style.getPropertyValue('--app-font-size')).toBe('18px')
      expect(html.style.getPropertyValue('--app-line-height')).toBe('2')
      expect(html.classList.contains('reduce-motion')).toBe(true)
      expect(html.classList.contains('high-contrast')).toBe(true)
    })

    it('dovrebbe usare i default in caso di JSON corrotto o errore in localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid-json{')
      
      const store = useSettingsStore()
      expect(store.state.fontSize).toBe('base')
    })
  })

  describe('Azioni e Reattività', () => {
    it('dovrebbe aggiornare una singola impostazione con set()', async () => {
      const store = useSettingsStore()
      
      store.set('fontSize', 'lg')
      expect(store.state.fontSize).toBe('lg')

      await new Promise((resolve) => setTimeout(resolve, 0))

      const html = document.documentElement
      expect(html.style.getPropertyValue('--app-font-size')).toBe('16px')
      
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      expect(saved.fontSize).toBe('lg')
    })

    it('dovrebbe gestire correttamente i toggle booleani delle classi nel DOM', async () => {
      const store = useSettingsStore()
      const html = document.documentElement

      store.set('reducedMotion', true)
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(html.classList.contains('reduce-motion')).toBe(true)

      store.set('reducedMotion', false)
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(html.classList.contains('reduce-motion')).toBe(false)
    })

    it('dovrebbe resettare lo stato ai valori di default con reset()', async () => {
      const store = useSettingsStore()
      
      store.set('fontFamily', 'dyslexic')
      store.set('highContrast', true)
      await new Promise((resolve) => setTimeout(resolve, 0))

      store.reset()
      expect(store.state.fontFamily).toBe('system')
      expect(store.state.highContrast).toBe(false)

      await new Promise((resolve) => setTimeout(resolve, 0))

      const html = document.documentElement
      expect(html.style.getPropertyValue('--app-font-family')).toBe('system-ui, -apple-system, sans-serif')
      expect(html.classList.contains('high-contrast')).toBe(false)
    })
  })
})