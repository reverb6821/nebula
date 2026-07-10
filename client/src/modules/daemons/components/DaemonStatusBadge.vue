<script setup lang="ts">
import type { DaemonStatus } from '@/types/daemon'
import { Badge } from '@/components/ui/badge' // <-- Import dello Shadcn Badge
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from '@lucide/vue' // <-- Icone carine
import { cn } from '@/lib/utils'

defineProps<{ status: DaemonStatus }>()

const classes: Record<DaemonStatus, string> = {
  active:   'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30 font-medium',
  inactive: 'bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/20 border-zinc-500/30 font-medium',
  failed:   'bg-red-500/15 text-red-400 hover:bg-red-500/20 border-red-500/30 font-medium',
  unknown:  'bg-yellow-500/15 text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/30 font-medium',
}
</script>

<template>
  <Badge 
    variant="outline" 
    :class="cn('capitalize gap-1.5 px-2 py-0.5 rounded-full border', classes[status])"
  >
    <CheckCircle2 v-if="status === 'active'" class="h-3.5 w-3.5 animate-pulse" />
    <XCircle v-else-if="status === 'inactive'" class="h-3.5 w-3.5" />
    <AlertCircle v-else-if="status === 'failed'" class="h-3.5 w-3.5" />
    <HelpCircle v-else class="h-3.5 w-3.5" />
    
    {{ status }}
  </Badge>
</template>