<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ArrowDownUp, Cpu, Database, HardDrive, MemoryStick, RotateCcw, Thermometer, Zap } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { BoxedList, BoxedListRow, MeterBar, StatCard, StatusDot, TrendChart } from '@/components/shared'
import type { StatusDotTone } from '@/components/shared/StatusDot.vue'
import { usePageHeader } from '@/composables/usePageHeader'
import { useAlertsStore } from '@/modules/alerts/store'
import { useAlertMonitorViewer } from '@/modules/alerts/composables/useAlertMonitor'
import { useDaemonsStore } from '@/modules/daemons/store'
import { useDockerStore } from '@/modules/docker/store'
import { useProcessesStore } from '@/modules/process/store'
import { useResourcesStore } from '../store'
import HealthBanner from '../components/HealthBanner.vue'
import ChartLegendValue from '../components/ChartLegendValue.vue'
import { listFilesystems } from '../composables/useFileSystemApi'
import { formatBytesDecimal, formatPercent, formatRateBinary, formatTemp, formatWatts } from '../utils/format'
import type { ContainerStatus } from '@/types/docker'
import type { FsEntry } from '@/types/resources'

const { t } = useI18n()
const { setHeader, clearHeader } = usePageHeader()

const resources = useResourcesStore()
const {
  snapshot, sensors, sensorsUnavailable,
  cpuOverallHistory, memHistory,
  netRxHistory, netTxHistory, diskReadHistory, diskWriteHistory,
  cpuTempAvg, gpuTempAvg, cpuPowerAvg, gpuPowerAvg,
  netMaxRate, diskMaxRate,
} = storeToRefs(resources)

// La Overview mostra banner e lista alert: monitor a cadenza piena.
useAlertMonitorViewer()
const alertsStore = useAlertsStore()
const { activeAlertCount, hasCriticalActive, degradedSources } = storeToRefs(alertsStore)

const daemonsStore = useDaemonsStore()
const { daemons, pendingNames } = storeToRefs(daemonsStore)

const dockerStore = useDockerStore()
const { containers, connected: dockerConnected } = storeToRefs(dockerStore)

const processesStore = useProcessesStore()
const { processes } = storeToRefs(processesStore)

const HISTORY_POINTS = 60
const SPARK_POINTS = 30

// ─── File system ────────────────────────────────────────────────────────────

const fsEntries = ref<FsEntry[]>([])

async function fetchFilesystems() {
  try {
    fsEntries.value = await listFilesystems()
  } catch {
    fsEntries.value = []
  }
}

const rootFs = computed(() => fsEntries.value.find((e) => e.mount === '/') ?? fsEntries.value[0] ?? null)
const fsSorted = computed(() => [...fsEntries.value].sort((a, b) => a.mount.localeCompare(b.mount)))

// ─── Lifecycle ──────────────────────────────────────────────────────────────

function refresh() {
  void fetchFilesystems()
  void daemonsStore.fetch()
  if (dockerConnected.value) void dockerStore.refresh()
  else void dockerStore.connect()
}

onMounted(() => {
  setHeader({
    title: t('overview.title'),
    subtitle: t('overview.subtitle'),
    toolsComponent: null,
    onRefresh: refresh,
  })
  resources.start()
  refresh()
})

onUnmounted(() => {
  resources.stop()
  clearHeader()
})

// ─── Helpers ────────────────────────────────────────────────────────────────

// I formatter esistenti restituiscono "valore unita'": il design mostra
// l'unita' separata, piu' piccola e attenuata.
function splitUnit(formatted: string): { value: string; unit: string } {
  const index = formatted.lastIndexOf(' ')
  if (index === -1) {
    const match = formatted.match(/^(.*?)(%?)$/)
    return { value: match?.[1] ?? formatted, unit: match?.[2] ?? '' }
  }
  return { value: formatted.slice(0, index), unit: formatted.slice(index + 1) }
}

function percentParts(value: number) {
  return splitUnit(formatPercent(value))
}

function initials(name: string): string {
  const clean = name.replace(/[^A-Za-z0-9]/g, '')
  if (!clean) return '?'
  return (clean[0]!.toUpperCase() + (clean[1] ?? '').toLowerCase())
}

// ─── KPI ────────────────────────────────────────────────────────────────────

const cpuPercent = computed(() => snapshot.value?.cpuOverallPercent ?? 0)
const memPercent = computed(() => snapshot.value?.memUsedPercent ?? 0)
const cores = computed(() => snapshot.value?.cpuCores ?? [])

const networkDegraded = computed(() => degradedSources.value.some((source) => source.category === 'network'))
const netTotalRate = computed(() => (snapshot.value?.netRxRate ?? 0) + (snapshot.value?.netTxRate ?? 0))
const netTotalHistory = computed(() => netRxHistory.value.map((rx, i) => rx + (netTxHistory.value[i] ?? 0)))
const netSparkMax = computed(() => Math.max(1024, ...netTotalHistory.value.slice(-SPARK_POINTS)) * 1.2)
const cpuSparkMax = computed(() => Math.max(10, ...cpuOverallHistory.value.slice(-SPARK_POINTS)) * 1.2)

const diskPercent = computed(() => rootFs.value?.usedPercent ?? 0)
const diskHigh = computed(() => diskPercent.value > 70)

const memFootnote = computed(() => {
  const s = snapshot.value
  if (!s) return undefined
  const cached = t('overview.cached', { value: formatBytesDecimal(s.memCacheBytes) })
  const swap = s.swapUsedBytes > 0
    ? t('overview.swapUsed', { value: formatBytesDecimal(s.swapUsedBytes) })
    : t('overview.swapUnused')
  return `${cached} · ${swap}`
})

// ─── Memory & swap ──────────────────────────────────────────────────────────

const memBreakdown = computed(() => {
  const s = snapshot.value
  if (!s || s.memTotalBytes <= 0) return null
  const used = s.memUsedBytes
  const cache = s.memCacheBytes
  const free = Math.max(0, s.memTotalBytes - used - cache)
  const pct = (v: number) => (v / s.memTotalBytes) * 100
  return { used, cache, free, usedPct: pct(used), cachePct: pct(cache) }
})

// ─── Grafici ────────────────────────────────────────────────────────────────

const cpuSeries = computed(() => [{
  id: 'cpu', values: cpuOverallHistory.value, color: 'var(--primary-text)', area: true, fill: 'var(--primary)', fillOpacity: 0.28,
}])
const cpuSparkSeries = computed(() => [{
  id: 'cpu', values: cpuOverallHistory.value.slice(-SPARK_POINTS), color: 'var(--primary-text)', area: true, fill: 'var(--primary)', fillOpacity: 0.25,
}])
const netSparkSeries = computed(() => [{
  id: 'net', values: netTotalHistory.value.slice(-SPARK_POINTS), color: networkDegraded.value ? 'var(--caution)' : 'var(--primary-text)',
}])
const memSeries = computed(() => [{
  id: 'mem', values: memHistory.value, color: 'var(--primary-text)', area: true, fill: 'var(--primary)', fillOpacity: 0.22,
}])
const netSeries = computed(() => [
  { id: 'rx', values: netRxHistory.value, color: 'var(--chart-1)' },
  { id: 'tx', values: netTxHistory.value, color: 'var(--chart-2)', dashed: true },
])
const diskSeries = computed(() => [
  { id: 'read', values: diskReadHistory.value, color: 'var(--chart-1)' },
  { id: 'write', values: diskWriteHistory.value, color: 'var(--chart-2)', dashed: true },
])

const xAxis = computed(() => ['60 s', '45 s', '30 s', '15 s', t('overview.now')])

// ─── Liste ──────────────────────────────────────────────────────────────────

const topProcesses = computed(() =>
  [...processes.value].sort((a, b) => b.cpuPercent - a.cpuPercent).slice(0, 5),
)

const overviewContainers = computed(() =>
  [...containers.value]
    .sort((a, b) => Number(b.status === 'running') - Number(a.status === 'running'))
    .slice(0, 5),
)

function containerTone(status: ContainerStatus): StatusDotTone {
  if (status === 'running') return 'running'
  if (status === 'dead') return 'failed'
  if (status === 'restarting' || status === 'paused') return 'warning'
  return 'idle'
}

const failedUnits = computed(() => daemons.value.filter((d) => d.status === 'failed'))

const bannerVisible = computed(() => activeAlertCount.value > 0 || degradedSources.value.length > 0)
const bannerTitle = computed(() => degradedSources.value.length > 0
  ? t('overview.bannerDegraded', activeAlertCount.value)
  : t('overview.bannerAlerts', activeAlertCount.value))
const bannerDescription = computed(() => {
  const parts: string[] = []
  if (degradedSources.value.length > 0) {
    parts.push(t('overview.bannerSources', {
      sources: degradedSources.value.map((s) => t(`overview.sources.${s.source}`)).join(', '),
    }))
  }
  if (failedUnits.value.length > 0) parts.push(t('overview.bannerUnits', failedUnits.value.length))
  return parts.join(' ')
})

function fsTone(percent: number): string {
  return percent > 70 ? 'bg-warning' : 'bg-primary-text'
}
</script>

<template lang="pug">
div(class="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-8 pt-2 pb-12")

  HealthBanner(
    v-if="bannerVisible"
    :title="bannerTitle"
    :description="bannerDescription"
    :action-label="t('overview.reviewAlerts')"
    :critical="hasCriticalActive"
    to="/alerts"
  )

  //- KPI
  section(:aria-label="t('overview.title')" class="grid grid-cols-[repeat(auto-fit,minmax(min(230px,100%),1fr))] gap-3.5")
    StatCard(
      :icon="Cpu"
      :label="t('overview.processor')"
      :meta="cores.length ? t('overview.threads', { n: cores.length }) : undefined"
      :value="percentParts(cpuPercent).value"
      unit="%"
    )
      TrendChart(:series="cpuSparkSeries" :max="cpuSparkMax" :height="36" :width="300" :points="SPARK_POINTS")
    StatCard(
      :icon="MemoryStick"
      :label="t('overview.memory')"
      :meta="snapshot ? `${formatBytesDecimal(snapshot.memUsedBytes)} / ${formatBytesDecimal(snapshot.memTotalBytes)}` : undefined"
      :value="percentParts(memPercent).value"
      unit="%"
      :footnote="memFootnote"
    )
      MeterBar(:value="memPercent" class="mt-3.5" :label="t('overview.memory')")
    StatCard(
      :icon="Database"
      :label="t('overview.disk')"
      :meta="rootFs ? `${formatBytesDecimal(rootFs.usedBytes)} / ${formatBytesDecimal(rootFs.totalBytes)}` : undefined"
      :value="rootFs ? String(Math.round(diskPercent)) : '–'"
      unit="%"
      :value-class="diskHigh ? 'text-warning' : undefined"
      :footnote="rootFs ? t('overview.free', { value: formatBytesDecimal(rootFs.availBytes) }) : undefined"
    )
      template(#label)
        | {{ t('overview.disk') }}
        |
        span(class="font-mono") {{ rootFs?.mount ?? '/' }}
      MeterBar(:value="diskPercent" class="mt-3.5" :bar-class="diskHigh ? 'bg-warning' : undefined" :label="t('overview.disk')")
    StatCard(
      :icon="ArrowDownUp"
      :label="t('overview.network')"
      :meta="networkDegraded ? t('overview.degraded') : undefined"
      meta-class="text-caution"
      :value="splitUnit(formatRateBinary(netTotalRate)).value"
      :unit="splitUnit(formatRateBinary(netTotalRate)).unit"
    )
      TrendChart(:series="netSparkSeries" :max="netSparkMax" :height="36" :width="300" :points="SPARK_POINTS")

  //- Grafici CPU e memoria
  div(class="flex flex-wrap gap-3.5")
    section(
      :aria-label="t('overview.processorHistory')"
      class="flex min-w-0 flex-[2_1_520px] flex-col gap-4 rounded-lg border border-border bg-card px-5 pt-[18px] pb-5"
    )
      div(class="flex flex-wrap items-center gap-3")
        h2(class="flex-1 text-15 font-bold") {{ t('overview.processorHistory') }}
      div(class="flex gap-2.5")
        div(class="relative h-[170px] min-w-0 flex-1 border-b border-l border-b-white/12 border-l-white/8")
          TrendChart(
            :series="cpuSeries"
            :max="100"
            :height="170"
            :points="HISTORY_POINTS"
            :grid="4"
            :label="t('overview.cpuChartLabel', { value: formatPercent(cpuPercent) })"
          )
        div(class="-mt-1.5 flex h-[176px] flex-col justify-between font-mono text-2xs text-muted-foreground" aria-hidden="true")
          span 100%
          span 50%
          span 0%
      div(class="-mt-2 flex justify-between pr-10 font-mono text-2xs text-muted-foreground" aria-hidden="true")
        span(v-for="label in xAxis" :key="label") {{ label }}
      div(class="grid grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))] gap-x-[18px] gap-y-2.5")
        div(v-for="core in cores" :key="core.id" class="flex flex-col gap-[5px]")
          div(class="flex justify-between font-mono text-xs")
            span(class="text-muted-foreground") {{ t('overview.core', { n: core.id + 1 }) }}
            span {{ formatPercent(core.percent) }}
          MeterBar(:value="core.percent" :height="4" :label="t('overview.core', { n: core.id + 1 })")

    section(
      :aria-label="t('overview.memorySwap')"
      class="flex min-w-0 flex-[1_1_320px] flex-col gap-[18px] rounded-lg border border-border bg-card px-5 pt-[18px] pb-5"
    )
      h2(class="text-15 font-bold") {{ t('overview.memorySwap') }}
      div(class="flex flex-col gap-2.5")
        div(class="flex items-baseline justify-between")
          span(class="text-group-foreground") {{ t('overview.ram') }}
          span(class="font-mono text-13") {{ t('overview.totalValue', { value: formatBytesDecimal(snapshot?.memTotalBytes ?? 0) }) }}
        div(class="flex h-3.5 gap-0.5 overflow-hidden rounded-[7px] bg-white/5" aria-hidden="true")
          div(class="bg-primary-text" :style="{ width: `${memBreakdown?.usedPct ?? 0}%` }")
          div(class="bg-idle" :style="{ width: `${memBreakdown?.cachePct ?? 0}%` }")
        div(class="mt-1.5 flex flex-col")
          div(class="flex items-center gap-2.5 border-b border-border py-2.5")
            span(class="size-2.5 rounded-[3px] bg-primary-text" aria-hidden="true")
            span(class="flex-1") {{ t('overview.inUse') }}
            span(class="font-mono") {{ formatBytesDecimal(memBreakdown?.used ?? 0) }}
          div(class="flex items-center gap-2.5 border-b border-border py-2.5")
            span(class="size-2.5 rounded-[3px] bg-idle" aria-hidden="true")
            span(class="flex-1") {{ t('overview.cacheBuffers') }}
            span(class="font-mono") {{ formatBytesDecimal(memBreakdown?.cache ?? 0) }}
          div(class="flex items-center gap-2.5 py-2.5")
            span(class="size-2.5 rounded-[3px] border border-white/25 bg-white/12" aria-hidden="true")
            span(class="flex-1") {{ t('overview.freeLabel') }}
            span(class="font-mono") {{ formatBytesDecimal(memBreakdown?.free ?? 0) }}
      div(class="flex flex-col gap-2.5 border-t border-white/8 pt-4")
        div(class="flex items-baseline justify-between")
          span(class="text-group-foreground") {{ t('overview.swap') }}
          span(class="font-mono text-13") {{ formatBytesDecimal(snapshot?.swapUsedBytes ?? 0) }} / {{ formatBytesDecimal(snapshot?.swapTotalBytes ?? 0) }}
        MeterBar(:value="snapshot?.swapUsedPercent ?? 0" :label="t('overview.swap')")
        span(class="text-xs text-muted-foreground")
          | {{ (snapshot?.swapUsedBytes ?? 0) > 0 ? t('overview.swapInUse', { value: formatPercent(snapshot?.swapUsedPercent ?? 0) }) : t('overview.swapNotInUse') }}
      div(class="mt-auto")
        TrendChart(
          :series="memSeries"
          :max="100"
          :height="64"
          :width="300"
          :points="HISTORY_POINTS"
          :label="t('overview.memChartLabel', { value: formatPercent(memPercent) })"
        )

  //- Rete e disco
  div(class="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] gap-3.5")
    section(
      :aria-label="t('overview.network')"
      class="flex flex-col gap-3.5 rounded-lg border border-border bg-card px-5 pt-[18px] pb-5"
    )
      div(class="flex flex-wrap items-center gap-4")
        h2(class="flex-1 text-15 font-bold") {{ t('overview.network') }}
        ChartLegendValue(:label="t('overview.down')" :value="formatRateBinary(snapshot?.netRxRate ?? 0)" color-class="bg-chart-1")
        ChartLegendValue(:label="t('overview.up')" :value="formatRateBinary(snapshot?.netTxRate ?? 0)" color-class="bg-chart-2")
      div(class="border-b border-white/12")
        TrendChart(:series="netSeries" :max="netMaxRate" :height="130" :points="HISTORY_POINTS" :grid="3" :label="t('overview.netChartLabel')")
      div(class="flex justify-between font-mono text-2xs text-muted-foreground")
        span 60 s
        span {{ t('overview.scale', { value: formatRateBinary(netMaxRate) }) }}
        span {{ t('overview.now') }}

    section(
      :aria-label="t('overview.diskActivity')"
      class="flex flex-col gap-3.5 rounded-lg border border-border bg-card px-5 pt-[18px] pb-5"
    )
      div(class="flex flex-wrap items-center gap-4")
        h2(class="flex-1 text-15 font-bold") {{ t('overview.diskActivity') }}
        ChartLegendValue(:label="t('overview.read')" :value="formatRateBinary(snapshot?.diskReadRate ?? 0)" color-class="bg-chart-1")
        ChartLegendValue(:label="t('overview.write')" :value="formatRateBinary(snapshot?.diskWriteRate ?? 0)" color-class="bg-chart-2")
      div(class="border-b border-white/12")
        TrendChart(:series="diskSeries" :max="diskMaxRate" :height="130" :points="HISTORY_POINTS" :grid="3" :label="t('overview.diskChartLabel')")
      div(class="flex justify-between font-mono text-2xs text-muted-foreground")
        span 60 s
        span {{ t('overview.scale', { value: formatRateBinary(diskMaxRate) }) }}
        span {{ t('overview.now') }}

  //- Liste
  div(class="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-3.5")
    section(:aria-label="t('overview.topProcesses')" class="overflow-hidden rounded-lg border border-border bg-card")
      div(class="flex items-center px-5 pt-4 pb-2.5")
        h2(class="flex-1 text-15 font-bold") {{ t('overview.topProcesses') }}
        RouterLink(to="/processes" class="text-13 font-semibold text-primary-text hover:text-[#c6dcf7]") {{ t('overview.allProcesses', { n: processes.length }) }}
      div(v-if="topProcesses.length === 0" class="border-t border-border px-5 py-4 text-13 text-muted-foreground") {{ t('overview.noProcesses') }}
      div(
        v-for="p in topProcesses"
        :key="p.pid"
        class="flex items-center gap-3 border-t border-border px-5 py-[11px]"
      )
        span(class="inline-flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-white/8 font-mono text-xs font-semibold" aria-hidden="true") {{ initials(p.name) }}
        div(class="flex min-w-0 flex-1 flex-col")
          span(class="truncate font-semibold") {{ p.name }}
          span(class="font-mono text-xs text-muted-foreground") {{ t('overview.pid', { pid: p.pid }) }}
        span(class="font-mono font-semibold" :class="p.cpuPercent >= 15 ? 'text-caution' : undefined") {{ formatPercent(p.cpuPercent) }}

    section(:aria-label="t('overview.containers')" class="overflow-hidden rounded-lg border border-border bg-card")
      div(class="flex items-center px-5 pt-4 pb-2.5")
        h2(class="flex-1 text-15 font-bold") {{ t('overview.containers') }}
        RouterLink(to="/docker" class="text-13 font-semibold text-primary-text hover:text-[#c6dcf7]") {{ t('overview.openDocker') }}
      div(v-if="!dockerConnected" class="border-t border-border px-5 py-4 text-13 text-muted-foreground") {{ t('overview.dockerUnavailable') }}
      div(v-else-if="overviewContainers.length === 0" class="border-t border-border px-5 py-4 text-13 text-muted-foreground") {{ t('overview.noContainers') }}
      div(
        v-for="c in overviewContainers"
        :key="c.id"
        class="flex items-center gap-3 border-t border-border px-5 py-[13px]"
      )
        StatusDot(:tone="containerTone(c.status)")
        div(class="flex min-w-0 flex-1 flex-col")
          span(class="truncate font-semibold") {{ c.name }}
          span(class="truncate font-mono text-xs text-muted-foreground") {{ c.image }}
        span(
          class="text-xs font-semibold"
          :class="c.status === 'running' ? 'text-success' : 'text-muted-foreground'"
        ) {{ t(`overview.containerStatus.${c.status}`) }}

    section(:aria-label="t('overview.needsAttention')" class="overflow-hidden rounded-lg border border-border bg-card")
      div(class="flex items-center px-5 pt-4 pb-2.5")
        h2(class="flex-1 text-15 font-bold") {{ t('overview.needsAttention') }}
        RouterLink(to="/services" class="text-13 font-semibold text-primary-text hover:text-[#c6dcf7]") {{ t('overview.services') }}
      div(
        v-if="failedUnits.length === 0 && degradedSources.length === 0"
        class="border-t border-border px-5 py-4 text-13 text-muted-foreground"
      ) {{ t('overview.nothingToReview') }}
      div(
        v-for="unit in failedUnits"
        :key="unit.name"
        class="flex items-center gap-3 border-t border-border py-[13px] pr-3 pl-5"
      )
        StatusDot(tone="failed")
        div(class="flex min-w-0 flex-1 flex-col")
          span(class="truncate font-mono text-13 font-semibold") {{ unit.name }}
          span(class="text-xs text-muted-foreground") {{ t('overview.unitFailed') }}
        Button(
          variant="ghost"
          size="icon"
          :disabled="pendingNames.has(unit.name)"
          :aria-label="t('overview.restartUnit', { name: unit.name })"
          @click="daemonsStore.restart(unit.name)"
        )
          RotateCcw(class="size-4" aria-hidden="true")
      div(
        v-for="source in degradedSources"
        :key="`${source.category}:${source.source}`"
        class="flex items-center gap-3 border-t border-border px-5 py-[13px]"
      )
        StatusDot(tone="warning")
        div(class="flex min-w-0 flex-1 flex-col")
          span(class="truncate font-semibold") {{ t(`overview.sources.${source.source}`) }}
          span(class="text-xs text-muted-foreground") {{ t('overview.sourceDegraded') }}

  //- Sensori e file system (dati esistenti, fuori dalle anteprime)
  div(class="grid grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] gap-3.5")
    BoxedList(:title="t('overview.sensors')")
      i18n-t(
        v-if="sensorsUnavailable"
        keypath="dashboard.sensorsUnavailable"
        tag="div"
        class="px-[18px] py-4 text-13 text-muted-foreground"
      )
        template(#lmSensors)
          code(class="font-mono text-foreground") lm-sensors
        template(#nvidiaSmi)
          code(class="font-mono text-foreground") nvidia-smi
      template(v-else)
        BoxedListRow(:title="`${t('dashboard.cpu')} · ${formatTemp(sensors.cpuTempC)}`" :subtitle="t('dashboard.avg60s', { value: formatTemp(cpuTempAvg) })")
          template(#prefix)
            Thermometer(class="size-[18px] text-muted-foreground" aria-hidden="true")
        BoxedListRow(:title="`${t('dashboard.gpu')} · ${formatTemp(sensors.gpuTempC)}`" :subtitle="t('dashboard.avg60s', { value: formatTemp(gpuTempAvg) })")
          template(#prefix)
            Thermometer(class="size-[18px] text-muted-foreground" aria-hidden="true")
        BoxedListRow(:title="`${t('dashboard.cpu')} · ${formatWatts(sensors.cpuPowerW)}`" :subtitle="t('dashboard.avg60s', { value: formatWatts(cpuPowerAvg) })")
          template(#prefix)
            Zap(class="size-[18px] text-muted-foreground" aria-hidden="true")
        BoxedListRow(:title="`${t('dashboard.gpu')} · ${formatWatts(sensors.gpuPowerW)}`" :subtitle="t('dashboard.avg60s', { value: formatWatts(gpuPowerAvg) })")
          template(#prefix)
            Zap(class="size-[18px] text-muted-foreground" aria-hidden="true")

    BoxedList(:title="t('overview.storage')")
      div(v-if="fsSorted.length === 0" class="px-[18px] py-4 text-13 text-muted-foreground") {{ t('dashboard.fsEmpty') }}
      BoxedListRow(
        v-for="fs in fsSorted"
        :key="fs.mount"
        :title="fs.mount"
        mono
        :subtitle="t('overview.fsUsage', { used: formatBytesDecimal(fs.usedBytes), total: formatBytesDecimal(fs.totalBytes), fsType: fs.fsType })"
      )
        template(#prefix)
          HardDrive(class="size-[18px] text-muted-foreground" aria-hidden="true")
        template(#suffix)
          div(class="flex w-32 items-center gap-2.5")
            MeterBar(:value="fs.usedPercent" :height="6" :bar-class="fsTone(fs.usedPercent)" :label="fs.mount")
            span(class="w-10 text-right font-mono text-xs" :class="fs.usedPercent > 70 ? 'text-warning' : 'text-muted-foreground'") {{ Math.round(fs.usedPercent) }}%
</template>
