<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { MeterBar } from '@/components/shared'
import { createSystemMetersSampler } from '../composables/useSystemMeters'
import type { SystemMeters } from '../composables/useSystemMeters'

defineProps<{ tasksTotal: number; tasksRunning: number }>()

const { t } = useI18n()

const meters = ref<SystemMeters | null>(null)
const sample = createSystemMetersSampler()

async function tick() {
  const result = await sample()
  if (result) meters.value = result
}

const { pause, resume } = useIntervalFn(tick, 1000, { immediate: false })

onMounted(() => { tick(); resume() })
onUnmounted(pause)

function formatCompact(bytes: number): string {
  const units = ['K', 'M', 'G', 'T']
  let v = bytes / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(v < 10 ? 2 : 1)}${units[i]}`
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

// Arancio sopra il 15%, come nel design (source/Processes.dc.html).
function coreColor(percent: number): string {
  return percent > 15 ? 'bg-caution' : 'bg-primary-text'
}

function pct(used: number, total: number): number {
  return total > 0 ? (used / total) * 100 : 0
}
</script>

<template lang="pug">
section(
  :aria-label="t('processes.systemLoad')"
  class="flex flex-wrap gap-x-9 gap-y-5 rounded-lg border border-border bg-card px-5 py-[18px]"
)
  div(class="grid min-w-0 flex-[3_1_520px] grid-cols-[repeat(auto-fill,minmax(min(150px,100%),1fr))] gap-x-5 gap-y-2.5")
    div(v-for="core in meters?.cores ?? []" :key="core.id" class="flex items-center gap-2 font-mono text-xs")
      span(class="w-[18px] text-right text-muted-foreground") {{ core.id }}
      MeterBar(:value="core.percent" :height="10" :radius="3" class="flex-1" :bar-class="coreColor(core.percent)" :label="t('processes.coreLabel', { n: core.id })")
      span(class="w-11 text-right") {{ core.percent.toFixed(1) }}%
  div(class="flex min-w-0 flex-[1_1_280px] flex-col gap-3")
    div(class="flex items-center gap-2.5 font-mono text-xs")
      span(class="w-[38px] text-muted-foreground") Mem
      MeterBar(:value="pct(meters?.memUsedBytes ?? 0, meters?.memTotalBytes ?? 0)" :height="10" :radius="3" class="flex-1" bar-class="bg-success" label="Mem")
      span {{ formatCompact(meters?.memUsedBytes ?? 0) }}/{{ formatCompact(meters?.memTotalBytes ?? 0) }}
    div(class="flex items-center gap-2.5 font-mono text-xs")
      span(class="w-[38px] text-muted-foreground") Swap
      MeterBar(:value="pct(meters?.swapUsedBytes ?? 0, meters?.swapTotalBytes ?? 0)" :height="10" :radius="3" class="flex-1" bar-class="bg-caution" label="Swap")
      span {{ formatCompact(meters?.swapUsedBytes ?? 0) }}/{{ formatCompact(meters?.swapTotalBytes ?? 0) }}
    div(class="mt-1 flex flex-wrap gap-2")
      span(class="rounded-[7px] bg-white/5 px-2.5 py-1.5 font-mono text-xs") {{ t('processes.tasks', { total: tasksTotal, running: tasksRunning }) }}
      span(class="rounded-[7px] bg-white/5 px-2.5 py-1.5 font-mono text-xs") load {{ meters?.loadAvg.map((n) => n.toFixed(2)).join(' ') ?? '- - -' }}
      span(class="rounded-[7px] bg-white/5 px-2.5 py-1.5 font-mono text-xs") up {{ formatUptime(meters?.uptimeSeconds ?? 0) }}
</template>
