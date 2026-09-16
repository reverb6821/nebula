<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Play, Square, RotateCcw, Trash2, FileText, Star } from '@lucide/vue'
import type { DockerContainer, ContainerStats } from '@/types/docker'
import { SharedButton, SharedPanel } from '@/components/shared'
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

<template lang="pug">
  SharedPanel(
    tabindex="0"
    role="button"
    :aria-pressed="selected"
    :aria-label="t('docker.openLogsFor', { name: container.name })"
    :selected="selected"
    :favorite="favorite"
    class="group cursor-pointer transition-all duration-150 hover:border-primary/40 hover:bg-accent outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    @click="emit('logs')"
    @keydown.enter="emit('logs')"
    @keydown.space.prevent="emit('logs')"
  )
    template(#header)
      div(class="flex items-start justify-between gap-2")
        div(class="min-w-0")
          div(class="truncate font-mono text-sm font-semibold leading-tight text-foreground") {{ container.name }}
          div(class="mt-1 flex items-center gap-2")
            ContainerStatusBadge(:status="container.status")
            span(class="truncate font-mono text-xs text-muted-foreground") {{ container.image }}
        //- Favorite pin
        Tooltip
          TooltipTrigger(as-child)
            SharedButton(
              variant="ghost"
              size="icon"
              class="h-6 w-6 shrink-0 rounded-md hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              :class="favorite ? 'text-warning !opacity-100' : 'text-muted-foreground hover:text-warning'"
              :aria-label="favorite ? t('docker.unpin') : t('docker.pin')"
              @click.stop="emit('toggleFavorite')"
            )
              Star(class="h-3 w-3" :class="{ 'fill-current': favorite }" aria-hidden="true")
          TooltipContent {{ favorite ? t('docker.unpin') : t('docker.pin') }}

    template(#default)
      //- Ports
      div(v-if="container.ports.length" class="flex flex-wrap gap-1")
        span(
          v-for="port in container.ports"
          :key="port"
          class="rounded border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
        ) {{ port }}

      //- Stats bar
      div(v-if="isRunning && stats" class="grid grid-cols-2 gap-2")
        div(class="rounded-md border border-border/70 bg-muted px-2.5 py-1.5")
          p(class="text-[10px] uppercase tracking-widest text-muted-foreground/70") CPU
          p(class="mt-0.5 font-mono text-xs font-medium tabular-nums text-foreground") {{ stats.cpuPercent.toFixed(1) }}%
        div(class="rounded-md border border-border/70 bg-muted px-2.5 py-1.5")
          p(class="text-[10px] uppercase tracking-widest text-muted-foreground/70") MEM
          p(class="mt-0.5 font-mono text-xs font-medium tabular-nums text-foreground") {{ formatBytes(stats.memUsage) }}

    template(#footer)
      div(class="flex w-full items-center justify-end gap-0.5" @click.stop)
        Tooltip
          TooltipTrigger(as-child)
            SharedButton(
              variant="ghost"
              size="icon"
              class="h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              :aria-label="t('docker.logs')"
              @click="emit('logs')"
            )
              FileText(class="h-3.5 w-3.5" aria-hidden="true")
          TooltipContent {{ t('docker.logs') }}

        Tooltip
          TooltipTrigger(as-child)
            SharedButton(
              variant="ghost"
              size="icon"
              :loading="pending"
              :disabled="pending"
              :icon="isRunning ? Square : Play"
              :aria-label="isRunning ? t('common.stop') : t('common.start')"
              class="h-7 w-7 rounded-md hover:bg-accent"
              :class="isRunning ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'"
              @click="isRunning ? emit('stop') : emit('start')"
            )
          TooltipContent {{ isRunning ? t('common.stop') : t('common.start') }}

        Tooltip
          TooltipTrigger(as-child)
            SharedButton(
              variant="ghost"
              size="icon"
              :disabled="pending || !isRunning"
              :icon="RotateCcw"
              :aria-label="t('common.restart')"
              class="h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              @click="emit('restart')"
            )
          TooltipContent {{ t('common.restart') }}

        Tooltip
          TooltipTrigger(as-child)
            SharedButton(
              variant="ghost"
              size="icon"
              :disabled="pending"
              :icon="Trash2"
              :aria-label="t('common.remove')"
              class="h-7 w-7 rounded-md text-destructive hover:bg-destructive/15 hover:text-destructive"
              @click="emit('remove')"
            )
          TooltipContent {{ t('common.remove') }}
</template>
