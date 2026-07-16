<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Play, Square, RotateCcw, Trash2, FileText, Star } from '@lucide/vue'
import type { DockerContainer, ContainerStats } from '@/types/docker'
import { SharedButton } from '@/components/shared'
import {
  Card,
  CardContent,
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
  <Card
    class="py-2 group cursor-pointer border-white/[0.06] bg-white/[0.02] transition-all duration-150 hover:border-white/[0.1] hover:bg-white/[0.04] rounded-xl"
    :class="{
      'border-indigo-500/40 bg-indigo-500/5 shadow-[inset_0_0_0_1px_theme(colors.indigo.500/0.2)]': selected,
      'border-amber-500/20 bg-amber-500/[0.03]': favorite && !selected,
    }"
    @click="emit('logs')"
  >
    <CardHeader class="space-y-1.5">
      <!-- Name row -->
      <div class="flex items-start justify-between gap-2">
        <CardTitle class="truncate font-mono text-sm font-semibold leading-tight text-zinc-100">
          {{ container.name }}
        </CardTitle>
        <!-- Favorite pin -->
        <Tooltip>
          <TooltipTrigger as-child>
            <SharedButton
              variant="ghost"
              size="icon"
              class="h-6 w-6 shrink-0 rounded-xl hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              :class="favorite ? 'text-amber-400 !opacity-100' : 'text-zinc-600 hover:text-amber-400'"
              @click.stop="emit('toggleFavorite')"
            >
              <Star class="h-3 w-3" :class="{ 'fill-current': favorite }" />
            </SharedButton>
          </TooltipTrigger>
          <TooltipContent>{{ favorite ? t('docker.unpin') : t('docker.pin') }}</TooltipContent>
        </Tooltip>
      </div>

      <!-- Status + image -->
      <div class="flex items-center gap-2">
        <ContainerStatusBadge :status="container.status" />
        <span class="truncate font-mono text-xs text-zinc-500">{{ container.image }}</span>
      </div>
    </CardHeader>

    <CardContent class="space-y-3">
      <!-- Ports -->
      <div v-if="container.ports.length" class="flex flex-wrap gap-1 rounded-xl">
        <span
          v-for="port in container.ports"
          :key="port"
          class="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 ring-1 ring-white/[0.06]"
        >
          {{ port }}
        </span>
      </div>

      <!-- Stats bar -->
      <div v-if="isRunning && stats" class="grid grid-cols-2 gap-2 rounded-xl">
        <div class="rounded-md bg-white/[0.03] px-2.5 py-1.5 ring-1 ring-white/[0.05]">
          <p class="text-[10px] uppercase tracking-widest text-zinc-600">CPU</p>
          <p class="mt-0.5 font-mono text-xs font-medium tabular-nums text-zinc-300">
            {{ stats.cpuPercent.toFixed(1) }}%
          </p>
        </div>
        <div class="rounded-md bg-white/[0.03] px-2.5 py-1.5 ring-1 ring-white/[0.05]">
          <p class="text-[10px] uppercase tracking-widest text-zinc-600">MEM</p>
          <p class="mt-0.5 font-mono text-xs font-medium tabular-nums text-zinc-300">
            {{ formatBytes(stats.memUsage) }}
          </p>
        </div>
      </div>
    </CardContent>

    <!-- Footer actions -->
    <div
      class="flex items-center justify-end gap-0.5 border-t border-white/[0.05] px-3 py-1"
      @click.stop
    >
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            class="h-7 w-7 rounded-xl text-zinc-500 hover:bg-white/5 hover:text-zinc-200 transition-all duration-150"
            @click="emit('logs')"
          >
            <FileText class="h-3.5 w-3.5" />
          </SharedButton>
        </TooltipTrigger>
        <TooltipContent>{{ t('docker.logs') }}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :loading="pending"
            :disabled="pending"
            :icon="isRunning ? Square : Play"
            class="h-7 w-7 rounded-xl hover:bg-white/5 transition-all duration-150"
            :class="isRunning ? 'text-red-400 hover:text-red-400' : 'text-emerald-500 hover:text-emerald-400'"
            @click="isRunning ? emit('stop') : emit('start')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ isRunning ? t('common.stop') : t('common.start') }}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending || !isRunning"
            :icon="RotateCcw"
            class="h-7 w-7 rounded-xl text-zinc-500 hover:bg-white/5 text-emerald-300 hover:text-emerald-300 transition-all duration-150"
            @click="emit('restart')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ t('common.restart') }}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending"
            :icon="Trash2"
            class="h-7 w-7 rounded-xl text-red-400  hover:bg-red-500/20 hover:text-red-400 transition-all duration-150"
            @click="emit('remove')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ t('common.remove') }}</TooltipContent>
      </Tooltip>
    </div>
  </Card>
</template>