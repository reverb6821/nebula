<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExternalLink } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared'
import { usePageHeader } from '@/composables/usePageHeader'
import { useSettingsStore } from '@/modules/settings/store'
import SettingsLanguage from '../components/SettingsLanguage.vue'
import SettingsAppearance from '../components/SettingsAppearance.vue'
import SettingsFont from '../components/SettingsFont.vue'
import SettingsAccessibility from '../components/SettingsAccessibility.vue'
import SettingsSection from '../components/SettingsSection.vue'

const { t } = useI18n()
const settings = useSettingsStore()
const { setHeader, clearHeader } = usePageHeader()

const appVersion = typeof window !== 'undefined' && window.NL_APPVERSION ? window.NL_APPVERSION : '0.0.1'
const resetOpen = ref(false)

// Link spostati qui dal vecchio footer dell'app.
const links = [
  { key: 'repository', href: 'https://codeberg.org/reverb6821/nebula-dock/src/branch/main' },
  { key: 'mastodon', href: 'https://mastodon.uno/@reverb6821' },
] as const

onMounted(() => {
  setHeader({
    title: t('settings.title'),
    subtitle: t('settings.subtitle'),
    toolsComponent: null,
  })
})
onUnmounted(clearHeader)
</script>

<template lang="pug">
div(class="mx-auto flex w-full max-w-[760px] flex-col gap-7 px-8 pt-4 pb-14")
  SettingsLanguage
  SettingsAppearance
  SettingsFont
  SettingsAccessibility

  SettingsSection(:title="t('settings.sectionAbout')")
    div(class="flex min-h-[60px] items-center gap-4 px-4 py-3")
      span(class="flex-1") {{ t('settings.version') }}
      span(class="font-mono text-group-foreground") Nebula Dock {{ appVersion }}
    a(
      v-for="link in links"
      :key="link.key"
      :href="link.href"
      target="_blank"
      rel="noopener noreferrer"
      class="flex min-h-[60px] items-center gap-4 px-4 py-3 hover:bg-white/3"
    )
      span(class="flex-1") {{ t(`footer.${link.key}`) }}
      ExternalLink(class="size-4 text-muted-foreground" aria-hidden="true")

  div(class="flex justify-end")
    Button(variant="destructive-soft" @click="resetOpen = true") {{ t('settings.resetToDefaults') }}

  ConfirmDialog(
    v-model:open="resetOpen"
    :title="t('settings.resetConfirmTitle')"
    :description="t('settings.resetConfirmDescription')"
    :confirm-label="t('settings.resetToDefaults')"
    :cancel-label="t('common.cancel')"
    @confirm="settings.reset()"
  )
</template>
