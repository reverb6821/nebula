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
  SettingsRow(:label="t('settings.language')" :hint="t('settings.languageHint')")
    template(#default="{ labelId }")
      Select(:model-value="locale" @update:model-value="onLocaleChange")
        SelectTrigger(:aria-labelledby="labelId" class="w-52 rounded-md border-border bg-card")
          SelectValue
        SelectContent(class="rounded-md border-border bg-popover")
          SelectItem(
            v-for="loc in availableLocales"
            :key="loc.code"
            :value="loc.code"
            class="rounded-sm text-foreground focus:bg-accent focus:text-foreground"
          ) {{ loc.flag }} {{ loc.label }}
</template>