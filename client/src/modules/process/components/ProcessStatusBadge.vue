<script setup lang="ts">
import type { ProcessStatus } from '@/types/process'

defineProps<{ status: ProcessStatus }>()

const labels: Record<ProcessStatus, string> = {
  R: 'Running',
  S: 'Sleeping',
  D: 'Disk wait',
  Z: 'Zombie',
  T: 'Stopped',
  I: 'Idle',
  '?': 'Unknown',
}

const dots: Record<ProcessStatus, string> = {
  R: 'bg-emerald-400 animate-pulse',
  S: 'bg-zinc-500',
  D: 'bg-yellow-400',
  Z: 'bg-red-500',
  T: 'bg-orange-400',
  I: 'bg-zinc-600',
  '?': 'bg-zinc-700',
}
</script>

<template>
  <div class="flex items-center gap-1.5">
    <span :class="['h-1.5 w-1.5 shrink-0 rounded-full', dots[status]]" />
    <span class="text-xs text-zinc-500">{{ labels[status] }}</span>
  </div>
</template>