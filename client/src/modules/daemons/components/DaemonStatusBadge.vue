<script setup lang="ts">
import type { DaemonStatus } from '@/types/daemon'
import { cn } from '@/lib/utils'

defineProps<{ status: DaemonStatus }>()

const variants: Record<DaemonStatus, string> = {
  active:   'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  inactive: 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/30',
  failed:   'bg-red-500/15 text-red-400 ring-red-500/30',
  unknown:  'bg-yellow-500/15 text-yellow-400 ring-yellow-500/30',
}

const dots: Record<DaemonStatus, string> = {
  active:   'bg-emerald-400 animate-pulse',
  inactive: 'bg-zinc-500',
  failed:   'bg-red-400',
  unknown:  'bg-yellow-400',
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