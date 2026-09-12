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

<template lang="pug">
  //-
    rounded-xl → resta rounded-lg altrove nel progetto per le card
    (contenitore, 16px): qui era già rounded-xl ma con lo stesso intento
    "contenitore", quindi normalizzato per coerenza col resto.
    shadow con theme(colors.indigo...) usava sintassi Tailwind v3 non
    più valida in v4: color-mix() con var(--ring) è CSS nativo.
    Tutta la card è cliccabile (apre i log): prima nessun tabindex/
    tastiera, ora navigabile e attivabile con Enter/Space.
  Card(
    tabindex="0"
    role="button"
    :aria-pressed="selected"
    :aria-label="t('docker.openLogsFor', { name: container.name })"
    class="py-2 group cursor-pointer border-border bg-card transition-all duration-150 hover:bg-accent rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    :class="{ 'border-primary/40 bg-primary/5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ring)_20%,transparent)]': selected, 'border-warning/20 bg-warning/[0.03]': favorite && !selected }"
    @click="emit('logs')"
    @keydown.enter="emit('logs')"
    @keydown.space.prevent="emit('logs')"
  )
    CardHeader(class="space-y-1.5")
      //- Name row
      div(class="flex items-start justify-between gap-2")
        CardTitle(class="truncate font-mono text-sm font-semibold leading-tight text-foreground") {{ container.name }}
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

      //- Status + image
      div(class="flex items-center gap-2")
        ContainerStatusBadge(:status="container.status")
        span(class="truncate font-mono text-xs text-muted-foreground") {{ container.image }}

    CardContent(class="space-y-3")
      //- Ports
      div(v-if="container.ports.length" class="flex flex-wrap gap-1")
        span(
          v-for="port in container.ports"
          :key="port"
          class="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground ring-1 ring-border"
        ) {{ port }}

      //- Stats bar
      div(v-if="isRunning && stats" class="grid grid-cols-2 gap-2")
        div(class="rounded-md bg-muted px-2.5 py-1.5 ring-1 ring-border")
          p(class="text-[10px] uppercase tracking-widest text-muted-foreground/70") CPU
          p(class="mt-0.5 font-mono text-xs font-medium tabular-nums text-foreground") {{ stats.cpuPercent.toFixed(1) }}%
        div(class="rounded-md bg-muted px-2.5 py-1.5 ring-1 ring-border")
          p(class="text-[10px] uppercase tracking-widest text-muted-foreground/70") MEM
          p(class="mt-0.5 font-mono text-xs font-medium tabular-nums text-foreground") {{ formatBytes(stats.memUsage) }}

    //- Footer actions
    div(class="flex items-center justify-end gap-0.5 border-t border-border px-3 py-1" @click.stop)
      Tooltip
        TooltipTrigger(as-child)
          SharedButton(
            variant="ghost"
            size="icon"
            class="h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150"
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
            class="h-7 w-7 rounded-md hover:bg-accent transition-all duration-150"
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
            class="h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150"
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
            class="h-7 w-7 rounded-md text-destructive hover:bg-destructive/15 hover:text-destructive transition-all duration-150"
            @click="emit('remove')"
          )
        TooltipContent {{ t('common.remove') }}
</template>
