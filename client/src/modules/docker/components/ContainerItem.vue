<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
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

const { t } = useI18n()

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
    class="group cursor-pointer border-white/[0.06] bg-white/[0.02] transition-all duration-150 hover:border-white/[0.1] hover:bg-white/[0.04]"
    :class="{
      'border-indigo-500/40 bg-indigo-500/5': selected,
      'border-amber-500/20 bg-amber-500/[0.03]': favorite && !selected,
    }"
    @click="emit('logs')"
  >
    <!-- Status dot -->
    <ItemMedia>
      <span
        class="h-1.5 w-1.5 rounded-full transition-colors"
        :class="{
          'bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400)] animate-pulse': container.status === 'running',
          'bg-red-400': container.status === 'dead',
          'bg-amber-400': container.status === 'paused',
          'bg-blue-400 animate-pulse': container.status === 'restarting',
          'bg-zinc-600': !['running','dead','paused','restarting'].includes(container.status),
        }"
      />
    </ItemMedia>

    <!-- Name + image -->
    <ItemContent>
      <ItemTitle class="flex items-center gap-2 font-mono text-sm font-medium text-zinc-100">
        {{ container.name }}
        <ContainerStatusBadge :status="container.status" />
      </ItemTitle>
      <ItemDescription class="mt-0.5 truncate font-mono text-xs text-zinc-500">
        {{ container.image }}
        <template v-if="isRunning && stats">
          <span class="mx-1.5 text-zinc-700">·</span>
          <span class="tabular-nums text-zinc-400">CPU {{ stats.cpuPercent.toFixed(1) }}%</span>
          <span class="mx-1.5 text-zinc-700">·</span>
          <span class="tabular-nums text-zinc-400">{{ formatBytes(stats.memUsage) }}</span>
        </template>
      </ItemDescription>
    </ItemContent>

    <!-- Actions -->
    <ItemActions class="gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100" @click.stop>
      <!-- Favorite -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            class="h-7 w-7 hover:bg-white/5"
            :class="favorite ? 'text-amber-400 opacity-100' : 'text-zinc-600 hover:text-amber-400'"
            @click="emit('toggleFavorite')"
          >
            <Star class="h-3 w-3" :class="{ 'fill-current': favorite }" />
          </SharedButton>
        </TooltipTrigger>
        <TooltipContent>{{ favorite ? t('docker.unpin') : t('docker.pin') }}</TooltipContent>
      </Tooltip>

      <!-- Logs -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            class="h-7 w-7 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            @click="emit('logs')"
          >
            <FileText class="h-3.5 w-3.5" />
          </SharedButton>
        </TooltipTrigger>
        <TooltipContent>{{ t('docker.logs') }}</TooltipContent>
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
            class="h-7 w-7 hover:bg-white/5"
            :class="isRunning ? 'text-zinc-500 hover:text-red-400' : 'text-emerald-500 hover:text-emerald-400'"
            @click="isRunning ? emit('stop') : emit('start')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ isRunning ? t('common.stop') : t('common.start') }}</TooltipContent>
      </Tooltip>

      <!-- Restart -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending || !isRunning"
            :icon="RotateCcw"
            class="h-7 w-7 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
            @click="emit('restart')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ t('common.restart') }}</TooltipContent>
      </Tooltip>

      <!-- Remove -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending"
            :icon="Trash2"
            class="h-7 w-7 text-zinc-600 hover:bg-red-500/10 hover:text-red-400"
            @click="emit('remove')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ t('common.remove') }}</TooltipContent>
      </Tooltip>
    </ItemActions>
  </Item>
</template>