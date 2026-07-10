<script setup lang="ts">
import type { ContainerStatus } from '@/types/docker'
import { cn } from '@/lib/utils'

defineProps<{ status: ContainerStatus }>()

const variants: Record<ContainerStatus, string> = {
  running:    'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  exited:     'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
  paused:     'bg-yellow-500/15 text-yellow-400 ring-yellow-500/30',
  restarting: 'bg-blue-500/15 text-blue-400 ring-blue-500/30',
  dead:       'bg-red-500/15 text-red-400 ring-red-500/30',
  created:    'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
  removing:   'bg-orange-500/15 text-orange-400 ring-orange-500/30',
  unknown:    'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
}

const dots: Record<ContainerStatus, string> = {
  running:    'bg-emerald-400 animate-pulse',
  exited:     'bg-zinc-500',
  paused:     'bg-yellow-400',
  restarting: 'bg-blue-400 animate-pulse',
  dead:       'bg-red-400',
  created:    'bg-zinc-500',
  removing:   'bg-orange-400 animate-pulse',
  unknown:    'bg-zinc-600',
}
</script>

<template>
  <span
    :class="cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
      variants[status],
    )"
  >
    <span :class="cn('h-1.5 w-1.5 rounded-full', dots[status])" />
    {{ status }}
  </span>
</template>