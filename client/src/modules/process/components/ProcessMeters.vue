<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { createSystemMetersSampler } from '../composables/useSystemMeters'
import type { SystemMeters } from '../composables/useSystemMeters'

defineProps<{ tasksTotal: number; tasksRunning: number }>()

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

function barColor(percent: number): string {
  if (percent >= 80) return 'bg-destructive'
  if (percent >= 50) return 'bg-warning'
  return 'bg-success'
}
</script>

<template lang="pug">
div(class="border-b border-border bg-background px-3 py-2 font-mono text-[11px] text-foreground")
  //- CPU per-core, ordine column-major come htop (3 righe)
  div(
    class="grid gap-x-6 gap-y-0.5"
    style="grid-template-rows: repeat(3, auto); grid-auto-flow: column;"
  )
    div(v-for="core in meters?.cores ?? []" :key="core.id" class="flex items-center gap-1")
      span(class="w-4 text-right text-muted-foreground") {{ core.id }}
      span(class="text-muted-foreground/60") [
      span(class="relative h-3 w-24 overflow-hidden bg-muted")
        span(
          class="absolute inset-y-0 left-0 transition-[width] duration-500"
          :class="barColor(core.percent)"
          :style="{ width: `${core.percent}%` }"
        )
      span(class="text-muted-foreground/60") ]
      span(class="w-12 text-right tabular-nums text-muted-foreground") {{ core.percent.toFixed(1) }}%

  //- Mem
  div(class="mt-1.5 flex items-center gap-1")
    span(class="w-8 text-muted-foreground") Mem
    span(class="text-muted-foreground/60") [
    span(class="relative h-3 w-64 overflow-hidden bg-muted")
      span(
        class="absolute inset-y-0 left-0 bg-success transition-[width] duration-500"
        :style="{ width: `${meters && meters.memTotalBytes > 0 ? (meters.memUsedBytes / meters.memTotalBytes) * 100 : 0}%` }"
      )
    span(class="text-muted-foreground/60") ]
    span(class="ml-1 tabular-nums text-muted-foreground") {{ formatCompact(meters?.memUsedBytes ?? 0) }}/{{ formatCompact(meters?.memTotalBytes ?? 0) }}

  //- Swap
  div(class="mt-0.5 flex items-center gap-1")
    span(class="w-8 text-muted-foreground") Swp
    span(class="text-muted-foreground/60") [
    span(class="relative h-3 w-64 overflow-hidden bg-muted")
      span(
        class="absolute inset-y-0 left-0 bg-destructive transition-[width] duration-500"
        :style="{ width: `${meters && meters.swapTotalBytes > 0 ? (meters.swapUsedBytes / meters.swapTotalBytes) * 100 : 0}%` }"
      )
    span(class="text-muted-foreground/60") ]
    span(class="ml-1 tabular-nums text-muted-foreground") {{ formatCompact(meters?.swapUsedBytes ?? 0) }}/{{ formatCompact(meters?.swapTotalBytes ?? 0) }}

  //- Tasks / Load / Uptime (semplificato: niente breakdown thread, vedi nota in chat)
  div(class="mt-1.5 flex items-center gap-4 text-muted-foreground")
    span
      | Tasks:
      span(class="text-foreground") {{ tasksTotal }}
      | ,
      span(class="text-success") {{ tasksRunning }} running
    span
      | Load average:
      span(class="text-foreground") {{ meters?.loadAvg.map((n) => n.toFixed(2)).join(' ') ?? '- - -' }}
    span
      | Uptime:
      span(class="text-foreground") {{ formatUptime(meters?.uptimeSeconds ?? 0) }}
</template>