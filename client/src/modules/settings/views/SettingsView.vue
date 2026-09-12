<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RotateCcw } from '@lucide/vue'
import { useSettingsStore } from '@/modules/settings/store'
import SettingsLanguage from '../components/SettingsLanguage.vue'
import SettingsAppearance from '../components/SettingsAppearance.vue'
import { SharedButton } from '@/components/shared'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const { t } = useI18n()
const settings = useSettingsStore()
</script>

<template lang="pug">
div(class="flex h-full flex-col overflow-y-auto")
  div(class="w-full max-w-2xl px-2 py-3")
    div(class="space-y-8")
      SettingsLanguage
      SettingsAppearance
      //- Reset
      div(class="flex justify-end border-t border-border pt-4")
        AlertDialog
          AlertDialogTrigger(as-child)
            SharedButton(
              variant="ghost"
              size="sm"
              class="gap-1.5 text-muted-foreground hover:text-foreground"
            )
              RotateCcw(class="h-3.5 w-3.5" aria-hidden="true")
              | {{ t('settings.resetToDefaults') }}
          AlertDialogContent
            AlertDialogHeader
              AlertDialogTitle {{ t('settings.resetConfirmTitle') }}
              AlertDialogDescription {{ t('settings.resetConfirmDescription') }}
            AlertDialogFooter
              AlertDialogCancel {{ t('common.cancel') }}
              AlertDialogAction(
                class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                @click="settings.reset()"
              ) {{ t('settings.resetToDefaults') }}
</template>