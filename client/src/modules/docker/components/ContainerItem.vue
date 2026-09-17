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

<template lang="pug">
  Item(
    variant="outline"
    tabindex="0"
    role="button"
    :aria-pressed="selected"
    :aria-label="t('docker.openLogsFor', { name: container.name })"
    class="group rounded-lg cyber-panel cursor-pointer transition-shadow duration-150 hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    :class="{ 'border-primary/40 bg-primary/5 shadow-cyber-signal': selected, 'border-warning/20 bg-warning/[0.03]': favorite && !selected }"
    @click="emit('logs')"
    @keydown.enter="emit('logs')"
    @keydown.space.prevent="emit('logs')"
  )
    //- Status dot
    ItemMedia
      span(
        class="h-1.5 w-1.5 rounded-full transition-colors duration-150"
        :class="{ 'bg-success shadow-[0_0_6px_color-mix(in_srgb,var(--success)_80%,transparent)] animate-pulse': container.status === 'running', 'bg-destructive': container.status === 'dead', 'bg-warning': container.status === 'paused', 'bg-primary animate-pulse': container.status === 'restarting', 'bg-muted-foreground/50': !['running','dead','paused','restarting'].includes(container.status) }"
        aria-hidden="true"
      )

    //- Name + image
    ItemContent
      ItemTitle(class="flex items-center gap-2 font-mono text-sm font-medium text-foreground")
        | {{ container.name }}
        ContainerStatusBadge(:status="container.status")
      ItemDescription(class="mt-0.5 truncate font-mono text-xs text-muted-foreground")
        | {{ container.image }}
        template(v-if="isRunning && stats")
          span(class="mx-1.5 text-muted-foreground/60") ·
          span(class="tabular-nums text-foreground/80") CPU {{ stats.cpuPercent.toFixed(1) }}%
          span(class="mx-1.5 text-muted-foreground/60") ·
          span(class="tabular-nums text-foreground/80") {{ formatBytes(stats.memUsage) }}

    //- Actions — stessa grammatica di DaemonItem: icone sempre visibili, colore
    //- ad indicare lo stato, nessun effetto opacity-on-hover.
    ItemActions(class="gap-0.5" @click.stop)
      //- Favorite
      Tooltip
        TooltipTrigger(as-child)
          SharedButton(
            variant="ghost"
            size="icon"
            class="h-7 w-7 rounded-md text-warning opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-accent hover:text-warning"
            :class="{ '!opacity-100': favorite }"
            :aria-label="favorite ? t('docker.unpin') : t('docker.pin')"
            @click="emit('toggleFavorite')"
          )
            Star(class="h-3 w-3" :class="{ 'fill-current': favorite }" aria-hidden="true")
        TooltipContent {{ favorite ? t('docker.unpin') : t('docker.pin') }}

      //- Logs
      Tooltip
        TooltipTrigger(as-child)
          SharedButton(
            variant="ghost"
            size="icon"
            class="h-7 w-7 text-muted-foreground hover:bg-accent hover:text-foreground rounded-md transition-all duration-150"
            :aria-label="t('docker.logs')"
            @click="emit('logs')"
          )
            FileText(class="h-3.5 w-3.5" aria-hidden="true")
        TooltipContent {{ t('docker.logs') }}

      //- Start / Stop
      Tooltip
        TooltipTrigger(as-child)
          SharedButton(
            variant="ghost"
            size="icon"
            :loading="pending"
            :disabled="pending"
            :icon="isRunning ? Square : Play"
            :aria-label="isRunning ? t('common.stop') : t('common.start')"
            class="h-7 w-7 hover:bg-accent rounded-md transition-all duration-150"
            :class="isRunning ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'"
            @click="isRunning ? emit('stop') : emit('start')"
          )
        TooltipContent {{ isRunning ? t('common.stop') : t('common.start') }}

      //- Restart
      Tooltip
        TooltipTrigger(as-child)
          SharedButton(
            variant="ghost"
            size="icon"
            :disabled="pending || !isRunning"
            :icon="RotateCcw"
            :aria-label="t('common.restart')"
            class="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-150"
            @click="emit('restart')"
          )
        TooltipContent {{ t('common.restart') }}

      //- Remove
      Tooltip
        TooltipTrigger(as-child)
          SharedButton(
            variant="ghost"
            size="icon"
            :disabled="pending"
            :icon="Trash2"
            :aria-label="t('common.remove')"
            class="h-7 w-7 text-destructive rounded-md hover:bg-destructive/15 hover:text-destructive transition-all duration-150"
            @click="emit('remove')"
          )
        TooltipContent {{ t('common.remove') }}
</template>