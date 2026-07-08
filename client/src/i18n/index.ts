import { createI18n } from "vue-i18n";

import { enGB } from './en-GB'
import { itIT } from './it-IT'


const messages = {
    'en-GB': enGB,
    'it-IT': itIT
}

const i18n = createI18n({
  locale: 'en-GB',
  fallbackLocale: 'en-GB',
  messages
})

export { i18n }