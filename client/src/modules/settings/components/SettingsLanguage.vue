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

<template>
  <SettingsSection :title="t('settings.sectionLanguage')">
    <SettingsRow :label="t('settings.language')" :hint="t('settings.languageHint')">
      <Select :model-value="locale" @update:model-value="onLocaleChange">
        <SelectTrigger class="w-52 border-zinc-700 bg-zinc-900">
          <SelectValue />
        </SelectTrigger>
        <SelectContent class="border-zinc-800 bg-zinc-900">
          <SelectItem
            v-for="loc in availableLocales"
            :key="loc.code"
            :value="loc.code"
            class="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
          >
            {{ loc.flag }} {{ loc.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </SettingsRow>
  </SettingsSection>
</template>