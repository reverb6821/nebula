<script setup lang="ts">
import { computed } from 'vue'
import { Play, Square, RotateCcw, Trash2, FileText } from '@lucide/vue'
import type { DockerContainer, ContainerStats } from '@/types/docker'
import { Button } from '@/components/ui/button'
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
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}
</script>

<template>
  <div
    :class="[
      'rounded-lg border bg-zinc-900/60 px-4 py-3 transition-colors hover:bg-zinc-900 cursor-pointer',
      selected ? 'border-indigo-500/50 bg-zinc-900' : 'border-zinc-800',
    ]"
    @click="emit('logs')"
  >
    <div class="flex items-center gap-4">
      <!-- Name + image -->
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="truncate font-mono text-sm font-medium text-zinc-100">
            {{ container.name }}
          </span>
          <ContainerStatusBadge :status="container.status" />
        </div>
        <p class="mt-0.5 truncate text-xs text-zinc-500">{{ container.image }}</p>

        <!-- Ports -->
        <div v-if="container.ports.length" class="mt-1 flex flex-wrap gap-1">
          <span
            v-for="port in container.ports"
            :key="port"
            class="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400"
          >
            {{ port }}
          </span>
        </div>
      </div>

      <!-- Stats (only when running) -->
      <div v-if="isRunning && stats" class="hidden shrink-0 flex-col items-end gap-0.5 sm:flex">
        <span class="font-mono text-xs text-zinc-400">
          CPU {{ stats.cpuPercent.toFixed(1) }}%
        </span>
        <span class="font-mono text-xs text-zinc-400">
          MEM {{ formatBytes(stats.memUsage) }}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex shrink-0 items-center gap-1" @click.stop>
        <!-- Logs -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-zinc-400 hover:text-zinc-200"
              @click="emit('logs')"
            >
              <FileText class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Logs</TooltipContent>
        </Tooltip>

        <!-- Start / Stop -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :class="isRunning
                ? 'text-zinc-400 hover:text-red-400'
                : 'text-emerald-400 hover:text-emerald-300'"
              :disabled="pending"
              @click="isRunning ? emit('stop') : emit('start')"
            >
              <Square v-if="isRunning" class="h-3.5 w-3.5" />
              <Play v-else class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{ isRunning ? 'Stop' : 'Start' }}</TooltipContent>
        </Tooltip>

        <!-- Restart -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-zinc-400 hover:text-zinc-200"
              :disabled="pending || !isRunning"
              @click="emit('restart')"
            >
              <RotateCcw class="h-3.5 w-3.5" :class="{ 'animate-spin': pending }" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Restart</TooltipContent>
        </Tooltip>

        <!-- Remove -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-zinc-400 hover:text-red-400"
              :disabled="pending"
              @click="emit('remove')"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove</TooltipContent>
        </Tooltip>
      </div>
    </div>
  </div>
</template>