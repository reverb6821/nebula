import { createI18n } from 'vue-i18n'
import { enGB } from './en-GB'
import { itIT } from './it-IT'

const STORAGE_KEY = 'nebula_locale'

const messages = {
  'en-GB': enGB,
  'it-IT': itIT,
}

export const availableLocales = [
  { code: 'en-GB', label: 'English (UK)', flag: '🇬🇧' },
  { code: 'it-IT', label: 'Italiano',     flag: '🇮🇹' },
] as const

export type LocaleCode = typeof availableLocales[number]['code']

const savedLocale = (localStorage.getItem(STORAGE_KEY) as LocaleCode | null)
  ?? 'en-GB'

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en-GB',
  messages,
})

export function setLocale(code: LocaleCode) {
  i18n.global.locale.value = code
  localStorage.setItem(STORAGE_KEY, code)
  document.documentElement.lang = code
}