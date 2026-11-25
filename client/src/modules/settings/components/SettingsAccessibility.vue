<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Switch } from '@/components/ui/switch'
import { useSettingsStore } from '@/modules/settings/store'
import SettingsSection from './SettingsSection.vue'
import SettingsRow from './SettingsRow.vue'

const { t } = useI18n()
const settings = useSettingsStore()
</script>

<template lang="pug">
SettingsSection(:title="t('settings.sectionAccessibility')")
  SettingsRow(:label="t('settings.reducedMotion')" :hint="t('settings.reducedMotionHint')")
    template(#default="{ labelId }")
      Switch(
        :model-value="settings.state.reducedMotion"
        :aria-labelledby="labelId"
        @update:model-value="settings.set('reducedMotion', $event)"
      )
  SettingsRow(:label="t('settings.highContrast')" :hint="t('settings.highContrastHint')")
    template(#default="{ labelId }")
      Switch(
        :model-value="settings.state.highContrast"
        :aria-labelledby="labelId"
        @update:model-value="settings.set('highContrast', $event)"
      )
</template>
