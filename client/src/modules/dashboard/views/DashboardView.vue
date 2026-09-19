<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import {
  ArrowDown, ArrowUp, Thermometer, Zap, HardDrive, Cpu, MemoryStick, Network, AlertTriangle,
} from '@lucide/vue'
import { useResourcesStore } from '../store'
import SparklineChart from '../components/SparkLineChart.vue'
import DashboardCard from '../components/DashboardCard.vue'
import KpiCard from '../components/KpiCard.vue'
import { SharedAlert } from '@/components/shared'
import { useAlertsStore } from '@/modules/alerts/store'
import { useAlertMonitor } from '@/modules/alerts/composables/useAlertMonitor'
import { cpuColor } from '../utils/cpuColors'
import { severityFor, severityTextClass, severityBgClass } from '../utils/severity'
import { formatBytesDecimal, formatRateBinary, formatPercent, formatTemp, formatWatts } from '../utils/format.ts'
import { listFilesystems } from '../composables/useFileSystemApi.ts'
import type { FsEntry } from '@/types/resources'

const { t } = useI18n()
const store = useResourcesStore()
const alertsStore = useAlertsStore()
const alertMonitor = useAlertMonitor()
const {
  snapshot, sensors, sensorsUnavailable,
  cpuOverallHistory, cpuCoreHistory, memHistory, swapHistory,
  netRxHistory, netTxHistory, diskReadHistory, diskWriteHistory,
  cpuTempAvg, gpuTempAvg, cpuPowerAvg, gpuPowerAvg,
  netMaxRate, diskMaxRate,
} = storeToRefs(store)

onMounted(() => {
  store.start()
  alertMonitor.start()
})
onUnmounted(() => {
  store.stop()
  alertMonitor.stop()
})

const cpuSeries = computed(() =>
  cpuCoreHistory.value.map((values, i) => ({ id: i, color: cpuColor(i), values })),
)

const memSeries = computed(() => [
  { id: 'mem', color: 'var(--destructive)', values: memHistory.value },
])

const swapSeries = computed(() => [
  { id: 'swap', color: 'var(--success)', values: swapHistory.value },
])

const netSeries = computed(() => [
  { id: 'rx', color: 'var(--primary)', values: netRxHistory.value },
  { id: 'tx', color: 'var(--warning)', values: netTxHistory.value },
])

const diskSeries = computed(() => [
  { id: 'read', color: 'var(--primary)', values: diskReadHistory.value },
  { id: 'write', color: 'var(--warning)', values: diskWriteHistory.value },
])

function tempColor(c: number | null): string {
  if (c === null) return 'text-muted-foreground'
  return severityTextClass(c, { danger: 85, warning: 65 })
}

// ─── File system ────────────────────────────────────────────────────────────

const fsEntries = ref<FsEntry[]>([])
const fsLoading = ref(false)
const fsError = ref<string | null>(null)
const fsSortDir = ref<'asc' | 'desc'>('asc')
const fsSelectedMount = ref<string | null>(null)

async function fetchFilesystems() {
  fsLoading.value = true
  fsError.value = null
  try {
    fsEntries.value = await listFilesystems()
  } catch (error) {
    fsEntries.value = []
    fsError.value = error instanceof Error ? error.message : t('dashboard.fsError')
  } finally {
    fsLoading.value = false
  }
}

onMounted(fetchFilesystems)

const fsSorted = computed(() => {
  const list = [...fsEntries.value]
  list.sort((a, b) => {
    const cmp = a.mount.localeCompare(b.mount)
    return fsSortDir.value === 'asc' ? cmp : -cmp
  })
  return list
})

function toggleFsSort() {
  fsSortDir.value = fsSortDir.value === 'asc' ? 'desc' : 'asc'
}

function selectFsRow(mount: string) {
  fsSelectedMount.value = fsSelectedMount.value === mount ? null : mount
}

// ─── KPI overview (riga in cima) ─────────────────────────────────────────────

const rootFs = computed(
  () => fsSorted.value.find((e) => e.mount === '/') ?? fsSorted.value[0] ?? null,
)

const netTotalRate = computed(
  () => (snapshot.value?.netRxRate ?? 0) + (snapshot.value?.netTxRate ?? 0),
)

const activeAlerts = computed(() => alertsStore.triggeredEvents)
const highestAlertSeverity = computed(() => {
  const severities = activeAlerts.value.map((event) => event.severity)
  if (severities.includes('critical')) return t('alerts.severityCritical')
  if (severities.includes('warning')) return t('alerts.severityWarning')
  if (severities.includes('info')) return t('alerts.severityInfo')
  return t('dashboard.noActiveAlerts')
})
const degradedSourceCount = computed(() => alertsStore.sourceHealth.filter((source) => source.status !== 'healthy').length)
</script>

<template lang="pug">
div(class="flex flex-col gap-4 overflow-auto p-4 text-foreground")

  //- Overview
  div(class="grid grid-cols-2 gap-3 sm:grid-cols-4")
    KpiCard(
      :icon="Cpu"
      :label="t('dashboard.cpu')"
      :value="formatPercent(snapshot?.cpuOverallPercent ?? 0)"
      :severity="severityFor(snapshot?.cpuOverallPercent ?? 0, { danger: 85, warning: 60 })"
    )
    KpiCard(
      :icon="MemoryStick"
      :label="t('dashboard.memory')"
      :value="formatPercent(snapshot?.memUsedPercent ?? 0)"
      :sub="formatBytesDecimal(snapshot?.memUsedBytes ?? 0) + ' / ' + formatBytesDecimal(snapshot?.memTotalBytes ?? 0)"
      :severity="severityFor(snapshot?.memUsedPercent ?? 0, { danger: 85, warning: 60 })"
    )
    KpiCard(
      :icon="HardDrive"
      :label="t('dashboard.diskRoot')"
      :value="rootFs ? formatPercent(rootFs.usedPercent, 0) : '–'"
      :sub="rootFs ? formatBytesDecimal(rootFs.usedBytes) + ' / ' + formatBytesDecimal(rootFs.totalBytes) : undefined"
      :severity="rootFs ? severityFor(rootFs.usedPercent, { danger: 85, warning: 60 }) : undefined"
    )
    KpiCard(
      :icon="Network"
      :label="t('dashboard.network')"
      :value="formatRateBinary(netTotalRate)"
      :sub="t('dashboard.readWriteCombined')"
    )

  DashboardCard(:title="t('dashboard.alertSummary')")
    RouterLink(to="/alerts" class="block rounded-md border border-border/70 bg-background/35 p-3 transition-colors hover:border-primary/45 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring")
      div(class="flex items-start justify-between gap-3")
        div(class="flex items-center gap-2")
          AlertTriangle(class="h-4 w-4 text-warning" aria-hidden="true")
          span(class="cyber-label") {{ t('dashboard.alerts') }}
        span(class="font-mono text-2xl font-semibold text-foreground") {{ activeAlerts.length }}
      div(class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground")
        span {{ t('dashboard.highestSeverity') }}: {{ highestAlertSeverity }}
        span {{ t('dashboard.degradedSourcesCount') }}: {{ degradedSourceCount }}

  //- Griglia principale: CPU / Memoria / Rete / Disco
  div(class="grid grid-cols-1 gap-4 lg:grid-cols-2")

    DashboardCard(:title="t('dashboard.cpu')")
      SparklineChart(:series="cpuSeries" :max="100" :format-y="(v) => `${v} %`")

      div(class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3")
        div(
          v-for="(core, i) in snapshot?.cpuCores ?? []"
          :key="core.id"
          class="flex items-center gap-2 text-xs"
        )
          //- "CPU{n}" resta invariato: è un indice tecnico (CPU1, CPU2…), non una frase da tradurre.
          span(class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ backgroundColor: cpuColor(i) }" aria-hidden="true")
          span(class="text-muted-foreground") {{ t('dashboard.cpu') }}{{ core.id + 1 }}
          span(class="ml-auto font-mono tabular-nums text-foreground") {{ formatPercent(core.percent) }}

    DashboardCard(:title="t('dashboard.memoryAndSwap')")
      SparklineChart(:series="[...memSeries, ...swapSeries]" :max="100" :format-y="(v) => `${v} %`")

      div(class="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-xs")
        div(class="flex items-start gap-2")
          span(class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm bg-destructive" aria-hidden="true")
          div
            div(class="cyber-label") {{ t('dashboard.memory') }}
            div(class="font-mono text-foreground") {{ t('dashboard.usedOfTotal', { used: formatBytesDecimal(snapshot?.memUsedBytes ?? 0), percent: formatPercent(snapshot?.memUsedPercent ?? 0), total: formatBytesDecimal(snapshot?.memTotalBytes ?? 0) }) }}
            div(class="text-muted-foreground/70") {{ t('dashboard.cache') }} {{ formatBytesDecimal(snapshot?.memCacheBytes ?? 0) }}
        div(class="flex items-start gap-2")
          span(class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm bg-success" aria-hidden="true")
          div
            div(class="cyber-label") {{ t('dashboard.swap') }}
            div(class="font-mono text-foreground") {{ t('dashboard.usedOfTotal', { used: formatBytesDecimal(snapshot?.swapUsedBytes ?? 0), percent: formatPercent(snapshot?.swapUsedPercent ?? 0), total: formatBytesDecimal(snapshot?.swapTotalBytes ?? 0) }) }}

    DashboardCard(:title="t('dashboard.network')")
      SparklineChart(:series="netSeries" :max="netMaxRate" :format-y="formatRateBinary")

      div(class="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-xs")
        div(class="flex items-start gap-2")
          ArrowDown(class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true")
          div
            div(class="cyber-label") {{ t('dashboard.received') }}
            div(class="font-mono text-foreground") {{ formatRateBinary(snapshot?.netRxRate ?? 0) }}
            div(class="text-muted-foreground/70") {{ t('dashboard.totalReceived', { value: formatBytesDecimal(snapshot?.netRxTotal ?? 0) }) }}
        div(class="flex items-start gap-2")
          ArrowUp(class="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true")
          div
            div(class="cyber-label") {{ t('dashboard.sent') }}
            div(class="font-mono text-foreground") {{ formatRateBinary(snapshot?.netTxRate ?? 0) }}
            div(class="text-muted-foreground/70") {{ t('dashboard.totalSent', { value: formatBytesDecimal(snapshot?.netTxTotal ?? 0) }) }}

    DashboardCard(:title="t('dashboard.disk')")
      SparklineChart(:series="diskSeries" :max="diskMaxRate" :format-y="formatRateBinary")

      div(class="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-xs")
        div(class="flex items-start gap-2")
          ArrowUp(class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true")
          div
            div(class="cyber-label") {{ t('dashboard.read') }}
            div(class="font-mono text-foreground") {{ formatRateBinary(snapshot?.diskReadRate ?? 0) }}
            div(class="text-muted-foreground/70") {{ t('dashboard.totalRead', { value: formatBytesDecimal(snapshot?.diskReadTotal ?? 0) }) }}
        div(class="flex items-start gap-2")
          ArrowDown(class="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true")
          div
            div(class="cyber-label") {{ t('dashboard.write') }}
            div(class="font-mono text-foreground") {{ formatRateBinary(snapshot?.diskWriteRate ?? 0) }}
            div(class="text-muted-foreground/70") {{ t('dashboard.totalWritten', { value: formatBytesDecimal(snapshot?.diskWriteTotal ?? 0) }) }}

  //- Temperatura e consumi
  DashboardCard(:title="t('dashboard.tempAndPower')")
    i18n-t(
      v-if="sensorsUnavailable"
      keypath="dashboard.sensorsUnavailable"
      tag="div"
      class="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-muted-foreground"
    )
      template(#lmSensors)
        code(class="text-foreground") lm-sensors
      template(#nvidiaSmi)
        code(class="text-foreground") nvidia-smi

    div(v-else class="grid grid-cols-2 gap-3 sm:grid-cols-4")
      div(class="cyber-panel rounded-md p-3")
        div(class="cyber-label flex items-center gap-1.5")
          Thermometer(class="h-3 w-3" aria-hidden="true")
          | {{ t('dashboard.cpu') }}
        div(class="mt-1 font-mono text-lg" :class="tempColor(sensors.cpuTempC)") {{ formatTemp(sensors.cpuTempC) }}
        div(class="text-[10px] text-muted-foreground/70") {{ t('dashboard.avg60s', { value: formatTemp(cpuTempAvg) }) }}

      div(class="cyber-panel rounded-md p-3")
        div(class="cyber-label flex items-center gap-1.5")
          Thermometer(class="h-3 w-3" aria-hidden="true")
          | {{ t('dashboard.gpu') }}
        div(class="mt-1 font-mono text-lg" :class="tempColor(sensors.gpuTempC)") {{ formatTemp(sensors.gpuTempC) }}
        div(class="text-[10px] text-muted-foreground/70") {{ t('dashboard.avg60s', { value: formatTemp(gpuTempAvg) }) }}

      div(class="cyber-panel rounded-md p-3")
        div(class="cyber-label flex items-center gap-1.5")
          Zap(class="h-3 w-3" aria-hidden="true")
          | {{ t('dashboard.cpu') }}
        div(class="mt-1 font-mono text-lg text-foreground") {{ formatWatts(sensors.cpuPowerW) }}
        div(class="text-[10px] text-muted-foreground/70") {{ t('dashboard.avg60s', { value: formatWatts(cpuPowerAvg) }) }}

      div(class="cyber-panel rounded-md p-3")
        div(class="cyber-label flex items-center gap-1.5")
          Zap(class="h-3 w-3" aria-hidden="true")
          | {{ t('dashboard.gpu') }}
        div(class="mt-1 font-mono text-lg text-foreground") {{ formatWatts(sensors.gpuPowerW) }}
        div(class="text-[10px] text-muted-foreground/70") {{ t('dashboard.avg60s', { value: formatWatts(gpuPowerAvg) }) }}

  //- File system
  DashboardCard(:title="t('dashboard.filesystem')")
    SharedAlert(
      v-if="fsError"
      variant="destructive"
      :title="t('common.error')"
      :description="fsError"
    )
    div(v-else-if="fsLoading" class="space-y-2" aria-hidden="true")
      div(v-for="i in 4" :key="i" class="h-10 animate-pulse rounded-md bg-muted")
    div(v-else-if="fsSorted.length === 0" class="py-10 text-center text-sm text-muted-foreground/70") {{ t('dashboard.fsEmpty') }}
    div(v-else class="overflow-x-auto")
      table(class="min-w-[680px] w-full border-collapse text-left text-xs")
        thead
          tr(class="border-b border-border text-muted-foreground")
            th(class="w-10 py-2")
            th(class="cyber-label py-2 pr-4" :aria-sort="fsSortDir === 'asc' ? 'ascending' : 'descending'")
              button(type="button" class="inline-flex items-center gap-1 text-left transition-colors hover:text-foreground" @click="toggleFsSort")
                | {{ t('dashboard.fsDirectory') }}
                span(class="text-muted-foreground/70" aria-hidden="true") {{ fsSortDir === 'asc' ? '▲' : '▼' }}
            th(class="cyber-label py-2 pr-4") {{ t('dashboard.fsType') }}
            th(class="cyber-label py-2 pr-4") {{ t('dashboard.fsTotal') }}
            th(class="cyber-label py-2 pr-4") {{ t('dashboard.fsAvailable') }}
            th(class="cyber-label py-2 pr-4") {{ t('dashboard.fsUsed') }}
        tbody
          tr(
            v-for="entry in fsSorted"
            :key="`${entry.device}-${entry.mount}`"
            tabindex="0"
            role="row"
            :aria-selected="fsSelectedMount === entry.mount"
            class="cursor-pointer border-b border-border/60 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset"
            :class="fsSelectedMount === entry.mount ? 'bg-primary/15 hover:bg-primary/15' : 'hover:bg-accent'"
            @click="selectFsRow(entry.mount)"
            @keydown.enter="selectFsRow(entry.mount)"
            @keydown.space.prevent="selectFsRow(entry.mount)"
          )
            td(class="py-2.5")
              HardDrive(class="h-4 w-4 text-muted-foreground" aria-hidden="true")
            td(class="py-2.5 pr-4")
              div(class="font-mono text-foreground") {{ entry.mount }}
              div(class="text-[10px] text-muted-foreground/70") {{ entry.device }}
            td(class="py-2.5 pr-4 text-muted-foreground") {{ entry.fsType }}
            td(class="py-2.5 pr-4 font-mono text-foreground/90") {{ formatBytesDecimal(entry.totalBytes) }}
            td(class="py-2.5 pr-4 font-mono text-foreground/90") {{ formatBytesDecimal(entry.availBytes) }}
            td(class="py-2.5 pr-4")
              div(class="flex items-center gap-2")
                span(class="font-mono text-foreground/90") {{ formatBytesDecimal(entry.usedBytes) }}
                span(class="text-muted-foreground") {{ formatPercent(entry.usedPercent, 0) }}
              div(class="mt-1 h-1 w-32 overflow-hidden rounded-full bg-muted")
                div(
                  class="h-full rounded-full transition-all"
                  :class="severityBgClass(entry.usedPercent, { danger: 85, warning: 60 })"
                  :style="{ width: `${Math.min(100, entry.usedPercent)}%` }"
                )
</template>