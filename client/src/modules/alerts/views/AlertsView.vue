<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useAlertsStore } from '@/modules/alerts/store'
import { useAlertMonitorViewer } from '@/modules/alerts/composables/useAlertMonitor'
import { exportAlertLog } from '@/modules/alerts/composables/useAlertExport'
import AlertList from '@/modules/alerts/components/AlertList.vue'
import AlertDetail from '@/modules/alerts/components/AlertDetail.vue'
import { useDaemonsStore } from '@/modules/daemons/store'
import { FilterChips } from '@/components/shared'
import type { FilterChip } from '@/components/shared/FilterChips.vue'
import { usePageHeader } from '@/composables/usePageHeader'
import type { AlertEvent } from '@/types/alert'
import { stateFilterOf, withStateFilter, type AlertStateFilter as StateFilter } from '@/modules/alerts/utils/stateFilter'

const { t } = useI18n()
const store = useAlertsStore()
const monitor = useAlertMonitorViewer()
const daemonsStore = useDaemonsStore()
const { pendingNames } = storeToRefs(daemonsStore)
const { events, filteredEvents, activeAlertCount, degradedSources, sourceHealth, filters } = storeToRefs(store)
const { setHeader, clearHeader } = usePageHeader()

const selectedId = ref<string | null>(null)
const selectedEvent = computed(() => selectedId.value ? events.value.find((event) => event.id === selectedId.value) ?? null : null)
const initialLoading = computed(() => monitor.isRunning.value && sourceHealth.value.length === 0)
const monitorLoading = monitor.isLoading
const monitorError = monitor.error

// Conteggi non filtrati: "Active" usa la stessa fonte di banner e sidebar.
const acknowledgedCount = computed(() => events.value.filter((event) => event.state === 'acknowledged').length)
const resolvedCount = computed(() => events.value.filter((event) => event.state === 'resolved').length)

const stateFilter = computed<StateFilter>(() => stateFilterOf(filters.value))

const chips = computed<FilterChip<StateFilter>[]>(() => [
  { value: 'all', label: t('alerts.filterAll'), count: events.value.length },
  { value: 'triggered', label: t('alerts.stateTriggered'), count: activeAlertCount.value },
  { value: 'acknowledged', label: t('alerts.stateAcknowledged'), count: acknowledgedCount.value },
  { value: 'resolved', label: t('alerts.stateResolved'), count: resolvedCount.value },
])

function setStateFilter(value: StateFilter | StateFilter[]) {
  const next = Array.isArray(value) ? value[0] ?? 'all' : value
  store.setFilters(withStateFilter(filters.value, next))
}

function select(event: AlertEvent) {
  selectedId.value = event.id
}

function acknowledge(event: AlertEvent) {
  store.acknowledge(event.id, Date.now())
}

async function exportEvent(_event: AlertEvent) {
  await exportAlertLog(events.value, sourceHealth.value)
}

function restartUnit(event: AlertEvent) {
  void daemonsStore.restart(event.resourceKey)
}

// Selezione automatica del primo evento visibile (master-detail).
watch(filteredEvents, (list) => {
  if (!list.some((event) => event.id === selectedId.value)) selectedId.value = list[0]?.id ?? null
}, { immediate: true })

function syncHeader() {
  setHeader({
    title: t('alerts.title'),
    subtitle: t('alerts.subtitle', { active: activeAlertCount.value, total: events.value.length }),
    toolsComponent: null,
    onRefresh: () => monitor.pollNow(),
    refreshLoading: monitorLoading.value,
  })
}

onMounted(syncHeader)
onUnmounted(clearHeader)
watch([activeAlertCount, events, monitorLoading], syncHeader)
</script>

<template lang="pug">
div(class="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-8 pt-2 pb-12")
  section(:aria-label="t('alerts.summaryLabel')" class="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3")
    div(class="flex flex-col gap-1 rounded-lg border border-[#ff7b63]/20 bg-destructive-surface px-[18px] py-4")
      span(class="text-xs font-semibold text-[#ffb3ad]") {{ t('alerts.active') }}
      span(class="text-stat leading-tight font-extrabold") {{ activeAlertCount }}
    div(class="flex flex-col gap-1 rounded-lg border border-border bg-card px-[18px] py-4")
      span(class="text-xs font-semibold text-muted-foreground") {{ t('alerts.acknowledged') }}
      span(class="text-stat leading-tight font-extrabold") {{ acknowledgedCount }}
    div(class="flex flex-col gap-1 rounded-lg border border-border bg-card px-[18px] py-4")
      span(class="text-xs font-semibold text-muted-foreground") {{ t('alerts.resolved') }}
      span(class="text-stat leading-tight font-extrabold") {{ resolvedCount }}
    div(
      class="flex flex-col gap-1 rounded-lg border px-[18px] py-4"
      :class="degradedSources.length ? 'border-warning/20 bg-warning-surface' : 'border-border bg-card'"
    )
      span(class="text-xs font-semibold" :class="degradedSources.length ? 'text-warning-text' : 'text-muted-foreground'") {{ t('alerts.degradedSource', degradedSources.length) }}
      span(class="mt-1.5 truncate font-mono text-xl font-bold")
        | {{ degradedSources.length ? degradedSources.map((source) => source.source).join(', ') : t('alerts.none') }}

  FilterChips(
    :items="chips"
    :model-value="stateFilter"
    :label="t('alerts.filterLabel')"
    @update:model-value="setStateFilter"
  )

  div(class="flex flex-wrap items-start gap-3.5")
    AlertList(
      :events="filteredEvents"
      :loading="initialLoading || monitorLoading"
      :selected-id="selectedId"
      :error="monitorError"
      @select="select"
    )
    AlertDetail(
      :event="selectedEvent"
      :restart-pending="selectedEvent ? pendingNames.has(selectedEvent.resourceKey) : false"
      @acknowledge="acknowledge"
      @export="exportEvent"
      @restart-unit="restartUnit"
    )
</template>
