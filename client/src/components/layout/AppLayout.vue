<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import AppSidebar from './AppSidebar.vue'
import PageHeader from './PageHeader.vue'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { usePageHeader } from '@/composables/usePageHeader'
import { useAlertMonitorBackground } from '@/modules/alerts/composables/useAlertMonitor'
import { useDockerStore } from '@/modules/docker/store'
import { useIntervalFn } from '@vueuse/core'

const header = usePageHeader()
const { title, subtitle, titleComponent, titleProps, toolsComponent, toolsProps, onRefresh, refreshLoading } = storeToRefs(header)

// Un solo monitor per tutta l'app: prima ogni vista (Dashboard, Alerts)
// ne avviava uno proprio e lo fermava all'unmount, quindi badge sidebar,
// banner e pagina Alerts potevano mostrare conteggi diversi.
// Cadenza lenta in background, piena quando una vista mostra gli alert
// (vedi useAlertMonitorViewer in Overview e Alerts).
const alertMonitor = useAlertMonitorBackground()

// Badge Docker in sidebar (running/totale): connessione all'avvio e
// aggiornamento periodico dell'elenco container.
const dockerStore = useDockerStore()
const DOCKER_BADGE_REFRESH_MS = 60_000
const dockerBadgeTimer = useIntervalFn(() => {
  if (dockerStore.connected) void dockerStore.refresh()
}, DOCKER_BADGE_REFRESH_MS, { immediate: false })

onMounted(() => {
  alertMonitor.start()
  void dockerStore.connect()
  dockerBadgeTimer.resume()
})
onUnmounted(() => {
  alertMonitor.stop()
  dockerBadgeTimer.pause()
})
</script>

<template lang="pug">
TooltipProvider(:delay-duration="300")
  SidebarProvider(class="h-svh overflow-hidden bg-background")
    AppSidebar
    SidebarInset(class="flex h-svh min-w-0 flex-col overflow-hidden bg-background")
      PageHeader(
        :title="title"
        :subtitle="subtitle"
        :title-component="titleComponent"
        :title-props="titleProps"
        :tools-component="toolsComponent"
        :tools-props="toolsProps"
        :on-refresh="onRefresh"
        :refresh-loading="refreshLoading"
      )
      main(class="min-h-0 flex-1 overflow-y-auto")
        RouterView
</template>
