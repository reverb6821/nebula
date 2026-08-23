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
import { severityFor, severityTextClass, severityBgClass } from '../utils/severity'
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

// Prima: hex letterali (#ef4444, #3b82f6, #f97316...) scollegati dal
// tema, e due di questi (#3b82f6 blu acceso, #f97316 arancio acceso)
// violano direttamente DESIGN.md ("no colori saturi o neon"). Ora
// var(--destructive/--success/--primary/--warning): stessi ruoli
// semantici usati ovunque nell'app, mai un one-off nuovo. Read/Rx e
// Write/Tx riusano lo stesso binomio primary/warning sia per rete che
// per disco — stesso linguaggio visivo per "in entrata" vs "in uscita"
// invece di due coppie di colori arbitrarie diverse.
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

// tempColor() resta: usato dai riquadri temperatura più sotto, che
// mostrano il numero colorato sempre (contesto diverso dalle KpiCard:
// lì il colore è già l'unico segnale, non c'è un pallino separato).

function tempColor(c: number | null): string {
  if (c === null) return 'text-muted-foreground'
  return severityTextClass(c, { danger: 85, warning: 65 })
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
</script>

<template>
  <div class="flex flex-col gap-4 overflow-auto p-4 text-foreground">

    <!-- Overview -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard
        :icon="Cpu"
        label="CPU"
        :value="formatPercent(snapshot?.cpuOverallPercent ?? 0)"
        :severity="severityFor(snapshot?.cpuOverallPercent ?? 0, { danger: 85, warning: 60 })"
      />
      <KpiCard
        :icon="MemoryStick"
        label="Memoria"
        :value="formatPercent(snapshot?.memUsedPercent ?? 0)"
        :sub="formatBytesDecimal(snapshot?.memUsedBytes ?? 0) + ' / ' + formatBytesDecimal(snapshot?.memTotalBytes ?? 0)"
        :severity="severityFor(snapshot?.memUsedPercent ?? 0, { danger: 85, warning: 60 })"
      />
      <KpiCard
        :icon="HardDrive"
        label="Disco (/)"
        :value="rootFs ? formatPercent(rootFs.usedPercent, 0) : '–'"
        :sub="rootFs ? formatBytesDecimal(rootFs.usedBytes) + ' / ' + formatBytesDecimal(rootFs.totalBytes) : undefined"
        :severity="rootFs ? severityFor(rootFs.usedPercent, { danger: 85, warning: 60 }) : undefined"
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
            <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ backgroundColor: cpuColor(i) }" aria-hidden="true" />
            <span class="text-muted-foreground">CPU{{ core.id + 1 }}</span>
            <span class="ml-auto font-mono tabular-nums text-foreground">{{ formatPercent(core.percent) }}</span>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Memoria e swap">
        <SparklineChart :series="[...memSeries, ...swapSeries]" :max="100" :format-y="(v) => `${v} %`" />

        <div class="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-xs">
          <div class="flex items-start gap-2">
            <span class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm bg-destructive" aria-hidden="true" />
            <div>
              <div class="text-muted-foreground">Memoria</div>
              <div class="font-mono text-foreground">
                {{ formatBytesDecimal(snapshot?.memUsedBytes ?? 0) }}
                ({{ formatPercent(snapshot?.memUsedPercent ?? 0) }})
                di {{ formatBytesDecimal(snapshot?.memTotalBytes ?? 0) }}
              </div>
              <div class="text-muted-foreground/70">Cache {{ formatBytesDecimal(snapshot?.memCacheBytes ?? 0) }}</div>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-sm bg-success" aria-hidden="true" />
            <div>
              <div class="text-muted-foreground">Swap</div>
              <div class="font-mono text-foreground">
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
            <ArrowDown class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <div class="text-muted-foreground">Ricezione</div>
              <div class="font-mono text-foreground">{{ formatRateBinary(snapshot?.netRxRate ?? 0) }}</div>
              <div class="text-muted-foreground/70">Totale ricevuti {{ formatBytesDecimal(snapshot?.netRxTotal ?? 0) }}</div>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <ArrowUp class="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <div class="text-muted-foreground">Invio</div>
              <div class="font-mono text-foreground">{{ formatRateBinary(snapshot?.netTxRate ?? 0) }}</div>
              <div class="text-muted-foreground/70">Totale inviati {{ formatBytesDecimal(snapshot?.netTxTotal ?? 0) }}</div>
            </div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard title="Disco">
        <SparklineChart :series="diskSeries" :max="diskMaxRate" :format-y="formatRateBinary" />

        <div class="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-xs">
          <div class="flex items-start gap-2">
            <ArrowUp class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <div class="text-muted-foreground">Lettura</div>
              <div class="font-mono text-foreground">{{ formatRateBinary(snapshot?.diskReadRate ?? 0) }}</div>
              <div class="text-muted-foreground/70">Totale letti {{ formatBytesDecimal(snapshot?.diskReadTotal ?? 0) }}</div>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <ArrowDown class="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
            <div>
              <div class="text-muted-foreground">Scrittura</div>
              <div class="font-mono text-foreground">{{ formatRateBinary(snapshot?.diskWriteRate ?? 0) }}</div>
              <div class="text-muted-foreground/70">Totale scritti {{ formatBytesDecimal(snapshot?.diskWriteTotal ?? 0) }}</div>
            </div>
          </div>
        </div>
      </DashboardCard>

    </div>

    <!-- Temperatura e consumi -->
    <DashboardCard title="Temperatura e consumi">
      <div
        v-if="sensorsUnavailable"
        class="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground"
      >
        Nessun sensore rilevato — richiede <code class="text-foreground">lm-sensors</code>
        (temperature) e/o RAPL su CPU Intel / <code class="text-foreground">nvidia-smi</code>
        per GPU NVIDIA (consumi).
      </div>

      <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-md border border-border bg-card p-3">
          <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Thermometer class="h-3 w-3" aria-hidden="true" /> CPU
          </div>
          <div class="mt-1 font-mono text-lg" :class="tempColor(sensors.cpuTempC)">
            {{ formatTemp(sensors.cpuTempC) }}
          </div>
          <div class="text-[10px] text-muted-foreground/70">media 60s: {{ formatTemp(cpuTempAvg) }}</div>
        </div>

        <div class="rounded-md border border-border bg-card p-3">
          <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Thermometer class="h-3 w-3" aria-hidden="true" /> GPU
          </div>
          <div class="mt-1 font-mono text-lg" :class="tempColor(sensors.gpuTempC)">
            {{ formatTemp(sensors.gpuTempC) }}
          </div>
          <div class="text-[10px] text-muted-foreground/70">media 60s: {{ formatTemp(gpuTempAvg) }}</div>
        </div>

        <div class="rounded-md border border-border bg-card p-3">
          <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Zap class="h-3 w-3" aria-hidden="true" /> CPU
          </div>
          <div class="mt-1 font-mono text-lg text-foreground">{{ formatWatts(sensors.cpuPowerW) }}</div>
          <div class="text-[10px] text-muted-foreground/70">media 60s: {{ formatWatts(cpuPowerAvg) }}</div>
        </div>

        <div class="rounded-md border border-border bg-card p-3">
          <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Zap class="h-3 w-3" aria-hidden="true" /> GPU
          </div>
          <div class="mt-1 font-mono text-lg text-foreground">{{ formatWatts(sensors.gpuPowerW) }}</div>
          <div class="text-[10px] text-muted-foreground/70">media 60s: {{ formatWatts(gpuPowerAvg) }}</div>
        </div>
      </div>
    </DashboardCard>

    <!-- File system -->
    <DashboardCard title="File system">
      <table class="w-full border-collapse text-left text-xs">
        <thead>
          <tr class="border-b border-border text-muted-foreground">
            <th class="w-10 py-2"></th>
            <!--
              Prima: sort al click su <th>, nessun tabindex/tastiera,
              nessun aria-sort — non ordinabile senza mouse. Stesso
              trattamento già applicato a ProcessTableHeader.vue: un
              <button> dentro il <th> porta focus/Enter/Space gratis,
              aria-sort resta sul <th> (pattern ARIA corretto).
            -->
            <th class="py-2 pr-4 font-medium" :aria-sort="fsSortDir === 'asc' ? 'ascending' : 'descending'">
              <button
                type="button"
                class="inline-flex items-center gap-1 text-left transition-colors hover:text-foreground"
                @click="toggleFsSort"
              >
                Directory
                <span class="text-muted-foreground/70" aria-hidden="true">{{ fsSortDir === 'asc' ? '▲' : '▼' }}</span>
              </button>
            </th>
            <th class="py-2 pr-4 font-medium">Tipo</th>
            <th class="py-2 pr-4 font-medium">Totale</th>
            <th class="py-2 pr-4 font-medium">Disponibile</th>
            <th class="py-2 pr-4 font-medium">Usato</th>
          </tr>
        </thead>
        <tbody>
          <!--
            Prima: riga selezionata in bg-red-950/40 — rosso comunica
            errore/pericolo, non "selezionato". Ora bg-primary/15, la
            stessa convenzione di "selezionato" usata in tutta l'app
            (tab attivi, righe processo, ecc.). Aggiunto anche
            tabindex/tastiera: prima la selezione funzionava solo col
            mouse.
          -->
          <tr
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
          >
            <td class="py-2.5">
              <HardDrive class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </td>
            <td class="py-2.5 pr-4">
              <div class="font-mono text-foreground">{{ entry.mount }}</div>
              <div class="text-[10px] text-muted-foreground/70">{{ entry.device }}</div>
            </td>
            <td class="py-2.5 pr-4 text-muted-foreground">{{ entry.fsType }}</td>
            <td class="py-2.5 pr-4 font-mono text-foreground/90">{{ formatBytesDecimal(entry.totalBytes) }}</td>
            <td class="py-2.5 pr-4 font-mono text-foreground/90">{{ formatBytesDecimal(entry.availBytes) }}</td>
            <td class="py-2.5 pr-4">
              <div class="flex items-center gap-2">
                <span class="font-mono text-foreground/90">{{ formatBytesDecimal(entry.usedBytes) }}</span>
                <span class="text-muted-foreground">{{ formatPercent(entry.usedPercent, 0) }}</span>
              </div>
              <!--
                Prima: bg-red-500 fisso, qualunque fosse la percentuale
                — un disco al 5% e uno al 95% mostravano la stessa
                barra rossa allarmante. Ora severityBgClass() con le
                stesse soglie usate per le KPI in cima alla pagina.
              -->
              <div class="mt-1 h-1 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full transition-all"
                  :class="severityBgClass(entry.usedPercent, { danger: 85, warning: 60 })"
                  :style="{ width: `${Math.min(100, entry.usedPercent)}%` }"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!fsLoading && fsSorted.length === 0" class="py-10 text-center text-sm text-muted-foreground/70">
        Nessun file system trovato.
      </div>
    </DashboardCard>

  </div>
</template>