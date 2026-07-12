<script setup lang="ts">
import { computed } from 'vue'
import { Play, Square, RotateCcw, Trash2, FileText, Star } from '@lucide/vue'
import type { DockerContainer, ContainerStats } from '@/types/docker'
import { SharedButton } from '@/components/shared'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
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
  favorite: boolean
}>()

const emit = defineEmits<{
  start: []
  stop: []
  restart: []
  remove: []
  logs: []
  toggleFavorite: []
}>()

const isRunning = computed(() => props.container.status === 'running')

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}
</script>

<template>
  <Item
    variant="outline"
    class="group border-zinc-800 bg-zinc-900/60 transition-colors hover:border-zinc-700 hover:bg-zinc-900 cursor-pointer"
    :class="{
      'border-indigo-500/50 bg-zinc-900': selected,
      'border-amber-500/30 bg-amber-500/5': favorite && !selected,
    }"
    @click="emit('logs')"
  >
    <!-- Status dot -->
    <ItemMedia>
      <span
        class="h-2 w-2 rounded-full"
        :class="{
          'bg-emerald-400 animate-pulse': container.status === 'running',
          'bg-red-400': container.status === 'dead',
          'bg-yellow-400': container.status === 'paused',
          'bg-blue-400 animate-pulse': container.status === 'restarting',
          'bg-zinc-600': !['running','dead','paused','restarting'].includes(container.status),
        }"
      />
    </ItemMedia>

    <!-- Name + image -->
    <ItemContent>
      <ItemTitle class="font-mono text-sm text-zinc-100 flex items-center gap-2">
        {{ container.name }}
        <ContainerStatusBadge :status="container.status" />
      </ItemTitle>
      <ItemDescription class="truncate text-xs text-zinc-500">
        {{ container.image }}
        <template v-if="isRunning && stats">
          <span class="mx-1.5 text-zinc-700">·</span>
          <span class="font-mono">CPU {{ stats.cpuPercent.toFixed(1) }}%</span>
          <span class="mx-1.5 text-zinc-700">·</span>
          <span class="font-mono">MEM {{ formatBytes(stats.memUsage) }}</span>
        </template>
      </ItemDescription>
    </ItemContent>

    <!-- Actions -->
    <ItemActions class="gap-1" @click.stop>
      <!-- Favorite -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            class="h-8 w-8 hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity"
            :class="favorite ? 'text-amber-400 opacity-100' : 'text-zinc-600 hover:text-amber-400'"
            @click="emit('toggleFavorite')"
          >
            <Star class="h-3.5 w-3.5" :class="{ 'fill-current': favorite }" />
          </SharedButton>
        </TooltipTrigger>
        <TooltipContent>{{ favorite ? 'Remove from favorites' : 'Add to favorites' }}</TooltipContent>
      </Tooltip>

      <!-- Logs -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-transparent"
            @click="emit('logs')"
          >
            <FileText class="h-3.5 w-3.5" />
          </SharedButton>
        </TooltipTrigger>
        <TooltipContent>Logs</TooltipContent>
      </Tooltip>

      <!-- Start / Stop -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :loading="pending"
            :disabled="pending"
            :icon="isRunning ? Square : Play"
            class="h-8 w-8 hover:bg-transparent"
            :class="isRunning ? 'text-zinc-400 hover:text-red-400' : 'text-emerald-400 hover:text-emerald-300'"
            @click="isRunning ? emit('stop') : emit('start')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ isRunning ? 'Stop' : 'Start' }}</TooltipContent>
      </Tooltip>

      <!-- Restart -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending || !isRunning"
            :icon="RotateCcw"
            class="h-8 w-8 text-zinc-400 hover:text-zinc-200 hover:bg-transparent"
            @click="emit('restart')"
          />
        </TooltipTrigger>
        <TooltipContent>Restart</TooltipContent>
      </Tooltip>

      <!-- Remove -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending"
            :icon="Trash2"
            class="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-transparent"
            @click="emit('remove')"
          />
        </TooltipTrigger>
        <TooltipContent>Remove</TooltipContent>
      </Tooltip>
    </ItemActions>
  </Item>
</template>