<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  ArrowDown, ArrowUp, Thermometer, Zap, HardDrive, Cpu, MemoryStick, Network,
} from '@lucide/vue'
import { useResourcesStore } from '../store'
import SparklineChart from '../components/SparkLineChart.vue'
import DashboardCard from '../components/DashboardCard.vue'
import KpiCard from '../components/KpiCard.vue'
import { cpuColor } from '../utils/cpuColors'
import { formatBytesDecimal, formatRateBinary, formatPercent, formatTemp, formatWatts } from '../utils/format.ts'
import { listFilesystems } from '../composables/useFileSystemApi.ts'
import type { FsEntry } from '@/types/resources'

const store = useResourcesStore()
const {
  snapshot, sensors, sensorsUnavailable,
  cpuOverallHistory, cpuCoreHistory, memHistory, swapHistory,
  netRxHistory, netTxHistory, diskReadHistory, diskWriteHistory,
  cpuTempAvg, gpuTempAvg, cpuPowerAvg, gpuPowerAvg,
  netMaxRate, diskMaxRate,
} = storeToRefs(store)

onMounted(() => store.start())
onUnmounted(() => store.stop())

const cpuSeries = computed(() =>
  cpuCoreHistory.value.map((values, i) => ({ id: i, color: cpuColor(i), values })),
)

const memSeries = computed(() => [
  { id: 'mem', color: '#ef4444', values: memHistory.value },
])

const swapSeries = computed(() => [
  { id: 'swap', color: '#22c55e', values: swapHistory.value },
])

const netSeries = computed(() => [
  { id: 'rx', color: '#3b82f6', values: netRxHistory.value },
  { id: 'tx', color: '#f97316', values: netTxHistory.value },
])

const diskSeries = computed(() => [
  { id: 'read', color: '#3b82f6', values: diskReadHistory.value },
  { id: 'write', color: '#f97316', values: diskWriteHistory.value },
])

function tempColor(c: number | null): string {
  if (c === null) return 'text-zinc-600'
  if (c >= 85) return 'text-red-400'
  if (c >= 65) return 'text-amber-300'
  return 'text-emerald-400'
}

// ─── File system ────────────────────────────────────────────────────────────

const fsEntries = ref<FsEntry[]>([])
const fsLoading = ref(false)
const fsSortDir = ref<'asc' | 'desc'>('asc')
const fsSelectedMount = ref<string | null>(null)

async function fetchFilesystems() {
  fsLoading.value = true
  try {
    fsEntries.value = await listFilesystems()
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
// Un colpo d'occhio prima del dettaglio: CPU/RAM correnti, disco radice,
// throughput di rete combinato (rx+tx).

const rootFs = computed(
  () => fsSorted.value.find((e) => e.mount === '/') ?? fsSorted.value[0] ?? null,
)

const netTotalRate = computed(
  () => (snapshot.value?.netRxRate ?? 0) + (snapshot.value?.netTxRate ?? 0),
)

function kpiColorFor(percent: number): string {
  if (percent >= 85) return 'text-red-400'
  if (percent >= 60) return 'text-amber-300'
  return 'text-emerald-400'
}
</script>

<template>
  <div class="flex flex-col gap-4 overflow-auto p-4 text-zinc-300">

    <!-- Overview -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard
        :icon="Cpu"
        label="CPU"
        :value="formatPercent(snapshot?.cpuOverallPercent ?? 0)"
        :accent="kpiColorFor(snapshot?.cpuOverallPercent ?? 0)"
      />
      <KpiCard
        :icon="MemoryStick"
        label="Memoria"
        :value="formatPercent(snapshot?.memUsedPercent ?? 0)"
        :sub="formatBytesDecimal(snapshot?.memUsedBytes ?? 0) + ' / ' + formatBytesDecimal(snapshot?.memTotalBytes ?? 0)"
        :accent="kpiColorFor(snapshot?.memUsedPercent ?? 0)"
      />
      <KpiCard
        :icon="HardDrive"
        label="Disco (/)"
        :value="rootFs ? formatPercent(rootFs.usedPercent, 0) : '–'"
        :sub="rootFs ? formatBytesDecimal(rootFs.usedBytes) + ' / ' + formatBytesDecimal(rootFs.totalBytes) : undefined"
        :accent="rootFs ? kpiColorFor(rootFs.usedPercent) : 'text-zinc-600'"
      />
      <KpiCard
        :icon="Network"
        label="Rete"
        :value="formatRateBinary(netTotalRate)"
        sub="lettura + scrittura combinate"
      />
    </div>

    <!-- Griglia principale: CPU / Memoria / Rete / Disco -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">

      <DashboardCard title="CPU">
        <SparklineChart :series="cpuSeries" :max="100" :format-y="(v) => `${v} %`" />

        <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          <div
            v-for="(core, i) in snapshot?.cpuCores ?? []"
            :key="core.id"
            class="flex items-center gap-2 text-xs"
          >
            <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ backgroundColor: cpuColor(i) }" />
            <span class="text-zinc-400">CPU{{ core.id + 1 }}</span>
            <span class="ml-auto font-mono tabular-nums text-zinc-200">{{ formatPercent(core.percent) }}</span>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Memoria e swap">
        <SparklineChart :series="[...memSeries, ...swapSeries]" :max="100" :format-y="(v) => `${v} %`" />

        <div class="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-xs">
          <div class="flex items-start gap-2">
            <span class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm bg-red-500" />
            <div>
              <div class="text-zinc-400">Memoria</div>
              <div class="font-mono text-zinc-200">
                {{ formatBytesDecimal(snapshot?.memUsedBytes ?? 0) }}
                ({{ formatPercent(snapshot?.memUsedPercent ?? 0) }})
                di {{ formatBytesDecimal(snapshot?.memTotalBytes ?? 0) }}
              </div>
              <div class="text-zinc-600">Cache {{ formatBytesDecimal(snapshot?.memCacheBytes ?? 0) }}</div>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm bg-emerald-500" />
            <div>
              <div class="text-zinc-400">Swap</div>
              <div class="font-mono text-zinc-200">
                {{ formatBytesDecimal(snapshot?.swapUsedBytes ?? 0) }}
                ({{ formatPercent(snapshot?.swapUsedPercent ?? 0) }})
                di {{ formatBytesDecimal(snapshot?.swapTotalBytes ?? 0) }}
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Rete">
        <SparklineChart :series="netSeries" :max="netMaxRate" :format-y="formatRateBinary" />

        <div class="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-xs">
          <div class="flex items-start gap-2">
            <ArrowDown class="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
            <div>
              <div class="text-zinc-400">Ricezione</div>
              <div class="font-mono text-zinc-200">{{ formatRateBinary(snapshot?.netRxRate ?? 0) }}</div>
              <div class="text-zinc-600">Totale ricevuti {{ formatBytesDecimal(snapshot?.netRxTotal ?? 0) }}</div>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <ArrowUp class="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
            <div>
              <div class="text-zinc-400">Invio</div>
              <div class="font-mono text-zinc-200">{{ formatRateBinary(snapshot?.netTxRate ?? 0) }}</div>
              <div class="text-zinc-600">Totale inviati {{ formatBytesDecimal(snapshot?.netTxTotal ?? 0) }}</div>
            </div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Disco">
        <SparklineChart :series="diskSeries" :max="diskMaxRate" :format-y="formatRateBinary" />

        <div class="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-xs">
          <div class="flex items-start gap-2">
            <ArrowUp class="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
            <div>
              <div class="text-zinc-400">Lettura</div>
              <div class="font-mono text-zinc-200">{{ formatRateBinary(snapshot?.diskReadRate ?? 0) }}</div>
              <div class="text-zinc-600">Totale letti {{ formatBytesDecimal(snapshot?.diskReadTotal ?? 0) }}</div>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <ArrowDown class="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
            <div>
              <div class="text-zinc-400">Scrittura</div>
              <div class="font-mono text-zinc-200">{{ formatRateBinary(snapshot?.diskWriteRate ?? 0) }}</div>
              <div class="text-zinc-600">Totale scritti {{ formatBytesDecimal(snapshot?.diskWriteTotal ?? 0) }}</div>
            </div>
          </div>
        </div>
      </DashboardCard>

    </div>

    <!-- Temperatura e consumi -->
    <DashboardCard title="Temperatura e consumi">
      <div
        v-if="sensorsUnavailable"
        class="rounded border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-500"
      >
        Nessun sensore rilevato — richiede <code class="text-zinc-400">lm-sensors</code>
        (temperature) e/o RAPL su CPU Intel / <code class="text-zinc-400">nvidia-smi</code>
        per GPU NVIDIA (consumi).
      </div>

      <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded border border-zinc-800 bg-zinc-900/40 p-3">
          <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
            <Thermometer class="h-3 w-3" /> CPU
          </div>
          <div class="mt-1 font-mono text-lg" :class="tempColor(sensors.cpuTempC)">
            {{ formatTemp(sensors.cpuTempC) }}
          </div>
          <div class="text-[10px] text-zinc-600">media 60s: {{ formatTemp(cpuTempAvg) }}</div>
        </div>

        <div class="rounded border border-zinc-800 bg-zinc-900/40 p-3">
          <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
            <Thermometer class="h-3 w-3" /> GPU
          </div>
          <div class="mt-1 font-mono text-lg" :class="tempColor(sensors.gpuTempC)">
            {{ formatTemp(sensors.gpuTempC) }}
          </div>
          <div class="text-[10px] text-zinc-600">media 60s: {{ formatTemp(gpuTempAvg) }}</div>
        </div>

        <div class="rounded border border-zinc-800 bg-zinc-900/40 p-3">
          <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
            <Zap class="h-3 w-3" /> CPU
          </div>
          <div class="mt-1 font-mono text-lg text-zinc-200">{{ formatWatts(sensors.cpuPowerW) }}</div>
          <div class="text-[10px] text-zinc-600">media 60s: {{ formatWatts(cpuPowerAvg) }}</div>
        </div>

        <div class="rounded border border-zinc-800 bg-zinc-900/40 p-3">
          <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
            <Zap class="h-3 w-3" /> GPU
          </div>
          <div class="mt-1 font-mono text-lg text-zinc-200">{{ formatWatts(sensors.gpuPowerW) }}</div>
          <div class="text-[10px] text-zinc-600">media 60s: {{ formatWatts(gpuPowerAvg) }}</div>
        </div>
      </div>
    </DashboardCard>

    <!-- File system -->
    <DashboardCard title="File system">
      <table class="w-full border-collapse text-left text-xs">
        <thead>
          <tr class="border-b border-zinc-800 text-zinc-500">
            <th class="w-10 py-2"></th>
            <th class="cursor-pointer select-none py-2 pr-4 font-medium" @click="toggleFsSort">
              Directory
              <span class="text-zinc-600">{{ fsSortDir === 'asc' ? '▲' : '▼' }}</span>
            </th>
            <th class="py-2 pr-4 font-medium">Tipo</th>
            <th class="py-2 pr-4 font-medium">Totale</th>
            <th class="py-2 pr-4 font-medium">Disponibile</th>
            <th class="py-2 pr-4 font-medium">Usato</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in fsSorted"
            :key="`${entry.device}-${entry.mount}`"
            class="cursor-pointer border-b border-zinc-900"
            :class="fsSelectedMount === entry.mount ? 'bg-red-950/40' : 'hover:bg-white/[0.03]'"
            @click="selectFsRow(entry.mount)"
          >
            <td class="py-2.5">
              <HardDrive class="h-4 w-4 text-zinc-600" />
            </td>
            <td class="py-2.5 pr-4">
              <div class="font-mono text-zinc-200">{{ entry.mount }}</div>
              <div class="text-[10px] text-zinc-600">{{ entry.device }}</div>
            </td>
            <td class="py-2.5 pr-4 text-zinc-400">{{ entry.fsType }}</td>
            <td class="py-2.5 pr-4 font-mono text-zinc-300">{{ formatBytesDecimal(entry.totalBytes) }}</td>
            <td class="py-2.5 pr-4 font-mono text-zinc-300">{{ formatBytesDecimal(entry.availBytes) }}</td>
            <td class="py-2.5 pr-4">
              <div class="flex items-center gap-2">
                <span class="font-mono text-zinc-300">{{ formatBytesDecimal(entry.usedBytes) }}</span>
                <span class="text-zinc-500">{{ formatPercent(entry.usedPercent, 0) }}</span>
              </div>
              <div class="mt-1 h-1 w-32 overflow-hidden rounded-full bg-zinc-800">
                <div
                  class="h-full rounded-full bg-red-500"
                  :style="{ width: `${Math.min(100, entry.usedPercent)}%` }"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!fsLoading && fsSorted.length === 0" class="py-10 text-center text-sm text-zinc-600">
        Nessun file system trovato.
      </div>
    </DashboardCard>

  </div>
</template>