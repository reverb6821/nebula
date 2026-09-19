<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAlertsStore } from '@/modules/alerts/store'
import { useAlertMonitor } from '@/modules/alerts/composables/useAlertMonitor'
import { exportAlertLog } from '@/modules/alerts/composables/useAlertExport'
import AlertSummary from '@/modules/alerts/components/AlertSummary.vue'
import AlertFilters from '@/modules/alerts/components/AlertFilters.vue'
import AlertList from '@/modules/alerts/components/AlertList.vue'
import AlertDetail from '@/modules/alerts/components/AlertDetail.vue'
import { usePageHeader } from '@/composables/usePageHeader'
import type { AlertEvent } from '@/types/alert'

const { t } = useI18n()
const store = useAlertsStore()
const monitor = useAlertMonitor()
const { events, filteredEvents, activeEvents, acknowledgedEvents, resolvedEvents, sourceHealth, monitoringStatus, filters } = storeToRefs(store)
const { setHeader, clearHeader } = usePageHeader()

const selectedId = ref<string | null>(null)
const selectedEvent = computed(() => selectedId.value ? events.value.find((event) => event.id === selectedId.value) ?? null : null)
const degradedSources = computed(() => sourceHealth.value.filter((source) => source.status !== 'healthy').map((source) => source.source))
const initialLoading = computed(() => monitor.isRunning.value && sourceHealth.value.length === 0)
const monitorLoading = monitor.isLoading
const monitorError = monitor.error

function select(event: AlertEvent) {
  selectedId.value = event.id
}
function acknowledge(event: AlertEvent) {
  store.acknowledge(event.id, Date.now())
}
async function exportEvent(_event: AlertEvent) {
  await exportAlertLog(events.value, sourceHealth.value)
}
function applyFilters(nextFilters: typeof filters.value) {
  store.setFilters(nextFilters)
}

function syncHeader() {
  setHeader({
    title: t('alerts.title'),
    subtitle: t('alerts.subtitle', { active: activeEvents.value.length, total: events.value.length }),
    toolsComponent: AlertFilters,
    toolsProps: {
      filters: filters.value,
      'onUpdate:filters': applyFilters,
    },
  })
}

onMounted(() => {
  syncHeader()
  monitor.start()
})
onUnmounted(() => {
  monitor.stop()
  clearHeader()
})
watch([filters, events, activeEvents], syncHeader, { deep: true })
</script>

<template lang="pug">
div(class="flex h-full min-h-0 flex-col gap-4 px-2 py-3")
  AlertSummary(
    :monitoring-status="monitoringStatus"
    :degraded-sources="degradedSources"
    :active-count="activeEvents.length"
    :acknowledged-count="acknowledgedEvents.length"
    :resolved-count="resolvedEvents.length"
  )
  div(class="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]")
    AlertList(
      :events="filteredEvents"
      :loading="initialLoading || monitorLoading"
      :selected-id="selectedId"
      :error="monitorError"
      @select="select"
    )
    AlertDetail(
      :event="selectedEvent"
      @acknowledge="acknowledge"
      @export="exportEvent"
    )
</template>