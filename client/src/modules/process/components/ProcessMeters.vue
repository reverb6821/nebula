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
  if (percent >= 80) return 'bg-red-500'
  if (percent >= 50) return 'bg-amber-400'
  return 'bg-emerald-500'
}
</script>

<template>
  <div class="border-b border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-[11px] text-zinc-300">
    <!-- CPU per-core, ordine column-major come htop (3 righe) -->
    <div
      class="grid gap-x-6 gap-y-0.5"
      style="grid-template-rows: repeat(3, auto); grid-auto-flow: column;"
    >
      <div v-for="core in meters?.cores ?? []" :key="core.id" class="flex items-center gap-1">
        <span class="w-4 text-right text-zinc-500">{{ core.id }}</span>
        <span class="text-zinc-600">[</span>
        <span class="relative h-3 w-24 overflow-hidden bg-zinc-900">
          <span
            class="absolute inset-y-0 left-0 transition-[width] duration-500"
            :class="barColor(core.percent)"
            :style="{ width: `${core.percent}%` }"
          />
        </span>
        <span class="text-zinc-600">]</span>
        <span class="w-12 text-right tabular-nums text-zinc-400">{{ core.percent.toFixed(1) }}%</span>
      </div>
    </div>

    <!-- Mem -->
    <div class="mt-1.5 flex items-center gap-1">
      <span class="w-8 text-zinc-500">Mem</span>
      <span class="text-zinc-600">[</span>
      <span class="relative h-3 w-64 overflow-hidden bg-zinc-900">
        <span
          class="absolute inset-y-0 left-0 bg-emerald-600 transition-[width] duration-500"
          :style="{ width: `${meters && meters.memTotalBytes > 0 ? (meters.memUsedBytes / meters.memTotalBytes) * 100 : 0}%` }"
        />
      </span>
      <span class="text-zinc-600">]</span>
      <span class="ml-1 tabular-nums text-zinc-400">
        {{ formatCompact(meters?.memUsedBytes ?? 0) }}/{{ formatCompact(meters?.memTotalBytes ?? 0) }}
      </span>
    </div>

    <!-- Swap -->
    <div class="mt-0.5 flex items-center gap-1">
      <span class="w-8 text-zinc-500">Swp</span>
      <span class="text-zinc-600">[</span>
      <span class="relative h-3 w-64 overflow-hidden bg-zinc-900">
        <span
          class="absolute inset-y-0 left-0 bg-red-600 transition-[width] duration-500"
          :style="{ width: `${meters && meters.swapTotalBytes > 0 ? (meters.swapUsedBytes / meters.swapTotalBytes) * 100 : 0}%` }"
        />
      </span>
      <span class="text-zinc-600">]</span>
      <span class="ml-1 tabular-nums text-zinc-400">
        {{ formatCompact(meters?.swapUsedBytes ?? 0) }}/{{ formatCompact(meters?.swapTotalBytes ?? 0) }}
      </span>
    </div>

    <!-- Tasks / Load / Uptime (semplificato: niente breakdown thread, vedi nota in chat) -->
    <div class="mt-1.5 flex items-center gap-4 text-zinc-500">
      <span>
        Tasks: <span class="text-zinc-300">{{ tasksTotal }}</span>,
        <span class="text-emerald-400">{{ tasksRunning }} running</span>
      </span>
      <span>
        Load average:
        <span class="text-zinc-300">{{ meters?.loadAvg.map((n) => n.toFixed(2)).join(' ') ?? '- - -' }}</span>
      </span>
      <span>
        Uptime: <span class="text-zinc-300">{{ formatUptime(meters?.uptimeSeconds ?? 0) }}</span>
      </span>
    </div>
  </div>
</template>