import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { storage } from '@neutralinojs/lib'

const STORAGE_KEY = 'nebula_settings'

export type FontSize   = 'sm' | 'base' | 'lg' | 'xl'
export type FontFamily = 'system' | 'inter' | 'mono'
export type LineHeight = 'normal' | 'relaxed' | 'loose'
export type AccentColor = 'blue' | 'teal' | 'purple' | 'orange' | 'slate'

interface SettingsState {
  accent:        AccentColor
  fontSize:      FontSize
  fontFamily:    FontFamily
  lineHeight:    LineHeight
  reducedMotion: boolean
  highContrast:  boolean
}

const defaults: SettingsState = {
  accent:        'blue',
  fontSize:      'base',
  fontFamily:    'system',
  lineHeight:    'normal',
  reducedMotion: false,
  highContrast:  false,
}

const fontFamilyMap: Record<FontFamily, string> = {
  system:   'var(--font-sans)',
  inter:    '"Inter Variable", "Inter", system-ui, sans-serif',
  mono:     'var(--font-mono)',
}

// Dimensione della root: le utility Tailwind sono in rem, quindi 16px
// e' la scala del design (body text-sm = 14px). Le altre scalano tutto.
const fontSizeMap: Record<FontSize, string> = {
  sm:   '15px',
  base: '16px',
  lg:   '18px',
  xl:   '20px',
}

const lineHeightMap: Record<LineHeight, string> = {
  normal:  '1.5',
  relaxed: '1.75',
  loose:   '2',
}

// Persistenza via Neutralino.storage invece di localStorage: stesso
// motivo e stesso pattern usati in modules/daemons/store.ts e
// modules/docker/store.ts — dati su disco in .storage/ nella cartella
// dell'app, non nel profilo del webview.
async function load(): Promise<SettingsState> {
  try {
    const raw = await storage.getData(STORAGE_KEY)
    if (!raw) return { ...defaults }
    const saved = { ...defaults, ...JSON.parse(raw) } as SettingsState
    // Valori non piu' supportati (es. il vecchio font 'dyslexic') tornano al default.
    if (!(saved.fontFamily in fontFamilyMap)) saved.fontFamily = defaults.fontFamily
    return saved
  } catch {
    // NE_ST_NOSTKEY: chiave non ancora scritta (prima esecuzione)
    return { ...defaults }
  }
}

export function applyToDOM(state: SettingsState) {
  const root = document.documentElement
  // Imposta le CSS variables — main.css le usa con !important
  root.style.setProperty('--app-font-family', fontFamilyMap[state.fontFamily])
  root.style.setProperty('--app-font-size', fontSizeMap[state.fontSize])
  root.style.setProperty('--app-line-height', lineHeightMap[state.lineHeight])
  root.classList.toggle('reduce-motion', state.reducedMotion)
  root.classList.toggle('high-contrast', state.highContrast)
  // Accento: il blu GNOME e' il default di main.css, gli altri si
  // attivano con [data-accent] (vedi design/nebula-handoff/theme.css).
  if (state.accent && state.accent !== 'blue') root.dataset.accent = state.accent
  else delete root.dataset.accent
}

export const useSettingsStore = defineStore('settings', () => {
  // Primo render con i default: lo storage nativo è asincrono, quindi
  // non possiamo più leggerlo in modo sincrono al momento in cui il
  // ref viene creato (come faceva localStorage.getItem prima). Il
  // watch qui sotto applica comunque il DOM non appena `load()` risolve
  // e aggiorna `state`, quindi il flash è limitato al primissimo frame.
  const state = ref<SettingsState>({ ...defaults })

  load().then((s) => { state.value = s })

  watch(state, (s) => {
    storage.setData(STORAGE_KEY, JSON.stringify(s)).catch(() => {})
    applyToDOM(s)
  }, { deep: true })

  function set<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    state.value = { ...state.value, [key]: value }
  }

  function reset() {
    state.value = { ...defaults }
  }

  return { state, set, reset }
})