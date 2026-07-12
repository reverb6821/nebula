<script setup lang="ts">
import { computed } from 'vue'
import { Play, Square, RotateCcw, Trash2, FileText } from '@lucide/vue'
import type { DockerContainer, ContainerStats } from '@/types/docker'
import { SharedButton } from '@/components/shared'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import ContainerStatusBadge from './ContainerStatusBadge.vue'

const props = defineProps<{
  container: DockerContainer
  stats: ContainerStats | undefined
  pending: boolean
  selected: boolean
}>()

const emit = defineEmits<{
  start: []
  stop: []
  restart: []
  remove: []
  logs: []
}>()

const isRunning = computed(() => props.container.status === 'running')

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}
</script>

<template>
  <Card
    class="cursor-pointer transition-colors hover:bg-zinc-900 bg-zinc-900/60"
    :class="selected ? 'border-indigo-500/50 bg-zinc-900' : 'border-zinc-800'"
    @click="emit('logs')"
  >
    <CardHeader class="pb-2">
      <div class="flex items-start justify-between gap-2">
        <CardTitle class="truncate font-mono text-sm font-medium text-zinc-100">
          {{ container.name }}
        </CardTitle>
        <ContainerStatusBadge :status="container.status" />
      </div>
      <p class="truncate text-xs text-zinc-500">{{ container.image }}</p>
    </CardHeader>

    <CardContent class="flex flex-col gap-2 pb-3">
      <!-- Ports -->
      <div v-if="container.ports.length" class="flex flex-wrap gap-1">
        <span
          v-for="port in container.ports"
          :key="port"
          class="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400"
        >
          {{ port }}
        </span>
      </div>

      <!-- Stats -->
      <div v-if="isRunning && stats" class="flex gap-3 font-mono text-xs text-zinc-400">
        <span>CPU {{ stats.cpuPercent.toFixed(1) }}%</span>
        <span>MEM {{ formatBytes(stats.memUsage) }}</span>
      </div>
    </CardContent>

    <CardFooter class="flex items-center gap-1 border-t border-zinc-800 pt-2" @click.stop>
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            class="h-7 w-7 text-zinc-400 hover:text-zinc-200 hover:bg-transparent"
            @click="emit('logs')"
          >
            <FileText class="h-3.5 w-3.5" />
          </SharedButton>
        </TooltipTrigger>
        <TooltipContent>Logs</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :loading="pending"
            :disabled="pending"
            :icon="isRunning ? Square : Play"
            class="h-7 w-7 hover:bg-transparent"
            :class="isRunning ? 'text-zinc-400 hover:text-red-400' : 'text-emerald-400 hover:text-emerald-300'"
            @click="isRunning ? emit('stop') : emit('start')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ isRunning ? 'Stop' : 'Start' }}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending || !isRunning"
            :icon="RotateCcw"
            class="h-7 w-7 text-zinc-400 hover:text-zinc-200 hover:bg-transparent"
            @click="emit('restart')"
          />
        </TooltipTrigger>
        <TooltipContent>Restart</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending"
            :icon="Trash2"
            class="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-transparent"
            @click="emit('remove')"
          />
        </TooltipTrigger>
        <TooltipContent>Remove</TooltipContent>
      </Tooltip>
    </CardFooter>
  </Card>
</template>