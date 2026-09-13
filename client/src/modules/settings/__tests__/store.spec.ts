import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

// Mock di @neutralinojs/lib: in ambiente jsdom non esiste window.NL_PORT,
// quindi la vera libreria non funzionerebbe comunque — mockiamo solo il
// namespace storage, che è l'unica parte usata da questo store.
vi.mock('@neutralinojs/lib', () => ({
  storage: {
    getData: vi.fn(),
    setData: vi.fn(),
  },
}))

import { storage } from '@neutralinojs/lib'
import { useSettingsStore, applyToDOM } from '../store'

const mockGetData = vi.mocked(storage.getData)
const mockSetData = vi.mocked(storage.setData)

describe('useSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('style')
  })

  it('parte dai default in modo sincrono, prima che lo storage risponda', () => {
    mockGetData.mockReturnValue(new Promise(() => {})) // mai risolta in questo test
    const settings = useSettingsStore()

    expect(settings.state.fontSize).toBe('base')
    expect(settings.state.fontFamily).toBe('system')
    expect(settings.state.reducedMotion).toBe(false)
  })

  it('carica lo stato salvato una volta che Neutralino.storage risponde', async () => {
    mockGetData.mockResolvedValue(
      JSON.stringify({ fontSize: 'lg', highContrast: true }),
    )
    const settings = useSettingsStore()

    await vi.waitUntil(() => settings.state.fontSize === 'lg')

    // Merge coi default: i campi non salvati restano quelli di default
    expect(settings.state.fontSize).toBe('lg')
    expect(settings.state.highContrast).toBe(true)
    expect(settings.state.fontFamily).toBe('system')
  })

  it('torna ai default se la chiave non esiste ancora (prima esecuzione)', async () => {
    // NE_ST_NOSTKEY: Neutralino.storage.getData rigetta se la chiave non c'è
    mockGetData.mockRejectedValue(new Error('NE_ST_NOSTKEY'))
    const settings = useSettingsStore()

    await vi.waitFor(() => {
      expect(mockGetData).toHaveBeenCalled()
    })
    await nextTick()

    expect(settings.state.fontSize).toBe('base')
  })

  it('set() aggiorna lo stato, applica il DOM e persiste su storage', async () => {
    mockGetData.mockRejectedValue(new Error('NE_ST_NOSTKEY'))
    const settings = useSettingsStore()
    await nextTick()

    settings.set('fontSize', 'xl')
    await nextTick()

    expect(settings.state.fontSize).toBe('xl')
    expect(document.documentElement.style.getPropertyValue('--app-font-size')).toBe('18px')
    expect(mockSetData).toHaveBeenCalledWith(
      'nebula_settings',
      expect.stringContaining('"fontSize":"xl"'),
    )
  })

  it('reset() riporta tutti i campi ai default', async () => {
    mockGetData.mockRejectedValue(new Error('NE_ST_NOSTKEY'))
    const settings = useSettingsStore()
    await nextTick()

    settings.set('fontSize', 'xl')
    settings.set('highContrast', true)
    await nextTick()

    settings.reset()
    await nextTick()

    expect(settings.state.fontSize).toBe('base')
    expect(settings.state.highContrast).toBe(false)
  })

  it('applyToDOM imposta le CSS variable e le classi corrette', () => {
    applyToDOM({
      fontSize: 'sm',
      fontFamily: 'mono',
      lineHeight: 'loose',
      reducedMotion: true,
      highContrast: true,
    })

    const root = document.documentElement
    expect(root.style.getPropertyValue('--app-font-size')).toBe('13px')
    expect(root.style.getPropertyValue('--app-line-height')).toBe('2')
    expect(root.classList.contains('reduce-motion')).toBe(true)
    expect(root.classList.contains('high-contrast')).toBe(true)
  })
})