import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'nebula_settings'

export type FontSize     = 'sm' | 'base' | 'lg' | 'xl'
export type FontFamily   = 'system' | 'inter' | 'mono' | 'dyslexic'
export type LineHeight   = 'normal' | 'relaxed' | 'loose'

interface SettingsState {
  fontSize:      FontSize
  fontFamily:    FontFamily
  lineHeight:    LineHeight
  reducedMotion: boolean
  highContrast:  boolean
}

const defaults: SettingsState = {
  fontSize:      'base',
  fontFamily:    'system',
  lineHeight:    'normal',
  reducedMotion: false,
  highContrast:  false,
}

function load(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults }
  } catch {
    return { ...defaults }
  }
}

// Font family CSS values
const fontFamilyMap: Record<FontFamily, string> = {
  system:   'system-ui, -apple-system, sans-serif',
  inter:    '"Inter", system-ui, sans-serif',
  mono:     '"JetBrains Mono", "Fira Code", monospace',
  dyslexic: '"OpenDyslexic", system-ui, sans-serif',
}

// Font size rem values applied to :root
const fontSizeMap: Record<FontSize, string> = {
  sm:   '13px',
  base: '14px',
  lg:   '16px',
  xl:   '18px',
}

const lineHeightMap: Record<LineHeight, string> = {
  normal:  '1.5',
  relaxed: '1.75',
  loose:   '2',
}

function applyToDOM(state: SettingsState) {
  const root = document.documentElement

  // Font size
  root.style.setProperty('--app-font-size', fontSizeMap[state.fontSize])
  root.style.fontSize = fontSizeMap[state.fontSize]

  // Font family
  root.style.setProperty('--app-font-family', fontFamilyMap[state.fontFamily])
  root.style.fontFamily = fontFamilyMap[state.fontFamily]

  // Line height
  root.style.setProperty('--app-line-height', lineHeightMap[state.lineHeight])
  root.style.lineHeight = lineHeightMap[state.lineHeight]

  // Reduced motion
  if (state.reducedMotion) {
    root.style.setProperty('--app-transition', 'none')
    root.classList.add('reduce-motion')
  } else {
    root.style.removeProperty('--app-transition')
    root.classList.remove('reduce-motion')
  }

  // High contrast
  if (state.highContrast) {
    root.classList.add('high-contrast')
  } else {
    root.classList.remove('high-contrast')
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const state = ref<SettingsState>(load())

  // Apply on init
  applyToDOM(state.value)

  // Persist + apply on change
  watch(state, (s) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    applyToDOM(s)
  }, { deep: true })

  function set<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    state.value = { ...state.value, [key]: value }
  }

  function reset() {
    state.value = { ...defaults }
  }

  return {
    state,
    set,
    reset,
  }
})