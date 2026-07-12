<script setup lang="ts">
import type { DockerContainer } from '@/types/docker'
import { Badge } from '@/components/ui/badge'
import { Play, Square, RotateCcw, AlertCircle, Clock, HelpCircle } from '@lucide/vue'
import { cn } from '@/lib/utils'

defineProps<{ status: DockerContainer['status'] }>()

type StatusConfig = { class: string; icon: unknown; label: string }

const config: Record<string, StatusConfig> = {
  running:    { class: 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30', icon: Play,        label: 'running' },
  paused:     { class: 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/20 border-amber-500/30',        icon: Square,      label: 'paused' },
  restarting: { class: 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/20 border-blue-500/30',            icon: RotateCcw,   label: 'restarting' },
  dead:       { class: 'bg-red-500/15 text-red-400 hover:bg-red-500/20 border-red-500/30',                icon: AlertCircle, label: 'dead' },
  exited:     { class: 'bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/20 border-zinc-500/30',            icon: Square,      label: 'exited' },
  created:    { class: 'bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/20 border-zinc-500/30',            icon: Clock,       label: 'created' },
}

const fallback: StatusConfig = { class: 'bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/20 border-zinc-500/30', icon: HelpCircle, label: '' }
</script>

<template>
  <Badge
    variant="outline"
    :class="cn('gap-1 px-2 py-0.5 rounded-full border font-mono text-[10px] font-medium', (config[status] ?? fallback).class)"
  >
    <component
      :is="(config[status] ?? fallback).icon"
      class="h-3 w-3"
      :class="{ 'animate-pulse': status === 'running', 'animate-spin': status === 'restarting' }"
    />
    {{ (config[status] ?? fallback).label || status }}
  </Badge>
</template>