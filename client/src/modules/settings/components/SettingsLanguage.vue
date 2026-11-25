<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { availableLocales, setLocale, type LocaleCode } from '@/i18n'
import type { AcceptableValue } from 'reka-ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'

const { t, locale } = useI18n()

function onLocaleChange(value: AcceptableValue) {
  if (typeof value === 'string') setLocale(value as LocaleCode)
}
</script>

<template lang="pug">
SettingsSection(:title="t('settings.sectionLanguage')")
  SettingsRow(:label="t('settings.interfaceLanguage')" :hint="t('settings.languageHint')")
    template(#default="{ labelId }")
      Select(:model-value="locale" @update:model-value="onLocaleChange")
        SelectTrigger(:aria-labelledby="labelId" class="min-h-10 w-48 rounded-[9px] border-0 bg-white/10 px-3.5 font-medium hover:bg-white/15 dark:bg-white/10 dark:hover:bg-white/15")
          SelectValue
        SelectContent(class="rounded-[10px] border-border bg-popover")
          SelectItem(
            v-for="loc in availableLocales"
            :key="loc.code"
            :value="loc.code"
            class="rounded-sm text-foreground focus:bg-accent focus:text-foreground"
          ) {{ loc.label }}
</template>