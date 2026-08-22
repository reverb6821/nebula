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

<template>
  <div class="flex h-full flex-col overflow-y-auto">
    <div class="w-full max-w-2xl px-2 py-3">

      <!--
        Prima non c'era alcuno spazio tra header e sezioni, né tra le
        due sezioni: si sarebbero visivamente accavallate (ogni
        SettingsSection ha solo space-y-6 al proprio interno, niente
        gestiva lo spazio *tra* i blocchi). space-y-8 = 2rem, in linea
        con spacing.lg del DESIGN.md.
      -->
      <div class="space-y-8">

        <!-- Header -->
        <div>
          <h1 class="text-lg font-semibold text-foreground">{{ t('settings.title') }}</h1>
          <p class="mt-0.5 text-sm text-muted-foreground">{{ t('settings.subtitle') }}</p>
        </div>

        <SettingsLanguage />
        <SettingsAppearance />

        <!-- Reset -->
        <div class="flex justify-end border-t border-border pt-4">
          <!--
            Prima: `{{ t('common.reset') }} to defaults` — mezza
            traduzione, mezza stringa inglese hardcoded. E il click
            eseguiva subito settings.reset() senza conferma, azzerando
            tutte le preferenze in un colpo solo per un click
            accidentale. Ora una chiave i18n unica + conferma.
          -->
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <SharedButton
                variant="ghost"
                size="sm"
                class="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" />
                {{ t('settings.resetToDefaults') }}
              </SharedButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{{ t('settings.resetConfirmTitle') }}</AlertDialogTitle>
                <AlertDialogDescription>{{ t('settings.resetConfirmDescription') }}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{{ t('common.cancel') }}</AlertDialogCancel>
                <AlertDialogAction
                  class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  @click="settings.reset()"
                >
                  {{ t('settings.resetToDefaults') }}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

      </div>
    </div>
  </div>
</template>