<script setup lang="ts">
import type { DaemonStatus } from '@/types/daemon'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from '@lucide/vue'
import { cn } from '@/lib/utils'

defineProps<{ status: DaemonStatus }>()

const classes: Record<DaemonStatus, string> = {
  active:   'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 border-emerald-500/25 font-medium',
  inactive: 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.06] border-white/[0.08] font-medium',
  failed:   'bg-red-500/10 text-red-400 hover:bg-red-500/15 border-red-500/25 font-medium',
  unknown:  'bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 border-amber-500/25 font-medium',
}
</script>

<template>
  <Badge
    variant="outline"
    :class="cn('gap-1 px-2 py-0.5 rounded-full border font-mono text-[10px]', classes[status])"
  >
    <CheckCircle2 v-if="status === 'active'"   class="h-3 w-3 animate-pulse" />
    <XCircle      v-else-if="status === 'inactive'" class="h-3 w-3" />
    <AlertCircle  v-else-if="status === 'failed'"   class="h-3 w-3" />
    <HelpCircle   v-else                             class="h-3 w-3" />
    {{ status }}
  </Badge>
</template>