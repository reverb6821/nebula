<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/modules/settings/store'
import SettingsLanguage from '../components/SettingsLanguage.vue'
import SettingsAppearance from '../components/SettingsAppearance.vue'

const { t } = useI18n()
const settings = useSettingsStore()
</script>

<template>
  <div class="flex h-full flex-col overflow-y-auto">
    <div class="w-full max-w-2xl px-2 py-3">

      <!-- Header -->
      <div>
        <h1 class="text-lg font-semibold text-zinc-100">{{ t('settings.title') }}</h1>
        <p class="mt-0.5 text-sm text-zinc-500">{{ t('settings.subtitle') }}</p>
      </div>

      <SettingsLanguage />
      <SettingsAppearance />

      <!-- Reset -->
      <div class="flex justify-end pt-2">
        <button
          class="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
          @click="settings.reset()"
        >
          {{ t('common.reset') }} to defaults
        </button>
      </div>

    </div>
  </div>
</template>