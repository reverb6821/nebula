<script setup lang="ts">
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'

// Header bar GNOME: 56px, stesso fondo della finestra, nessun bordo.
// Sinistra il trigger della sidebar, al centro titolo + stato (oppure un
// componente custom, es. Tabs), a destra azioni ghost icon 40x40.
// La finestra Neutralino e' decorata: niente pulsanti finestra.
defineProps<{
  title: string
  subtitle?: string
  titleComponent?: Component | null
  titleProps?: Record<string, unknown>
  toolsComponent?: Component | null
  toolsProps?: Record<string, unknown>
  onRefresh?: (() => void) | null
  refreshLoading?: boolean
}>()

const { t } = useI18n()
</script>

<template lang="pug">
header(class="flex min-h-14 shrink-0 flex-wrap items-center gap-1.5 bg-background px-2.5 py-2")
  SidebarTrigger(class="size-10 rounded-lg [&_svg]:size-[18px]" :aria-label="t('header.toggleSidebar')")
  div(class="flex min-w-40 flex-1 flex-col items-center")
    component(v-if="titleComponent" :is="titleComponent" v-bind="titleProps")
    template(v-else)
      h1(class="text-15 font-bold") {{ title }}
      span(v-if="subtitle" class="text-xs text-muted-foreground") {{ subtitle }}
  div(class="flex min-w-10 items-center justify-end gap-0.5")
    component(v-if="toolsComponent" :is="toolsComponent" v-bind="toolsProps")
    Button(
      v-if="onRefresh"
      variant="ghost"
      size="icon"
      :disabled="refreshLoading"
      :aria-label="t('common.refresh')"
      @click="onRefresh()"
    )
      RefreshCw(:class="{ 'animate-spin': refreshLoading }" aria-hidden="true")
</template>
