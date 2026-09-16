<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Play, Square, RotateCcw, Star } from '@lucide/vue'
import type { Daemon } from '@/types/daemon'
import { SharedPanel, SharedSwitch, SharedButton } from '@/components/shared'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import DaemonStatusBadge from './DaemonStatusBadge.vue'

const props = defineProps<{
  daemon: Daemon
  pending: boolean
  favorite: boolean
}>()

const emit = defineEmits<{
  start: []
  stop: []
  restart: []
  toggleEnabled: []
  toggleFavorite: []
}>()

const { t } = useI18n()

const isRunning = computed(() => props.daemon.status === 'active')
const isStatic  = computed(() => props.daemon.enabled === 'static')
const isEnabled = computed(() => props.daemon.enabled === 'enabled')

const bootTooltip = computed(() => {
  if (isStatic.value) return t('daemons.staticUnit')
  return isEnabled.value ? t('daemons.disableAtBoot') : t('daemons.enableAtBoot')
})
</script>

<template lang="pug">
SharedPanel(
  class="group relative transition-all duration-200 hover:border-primary/40 hover:bg-accent"
  :favorite="favorite"
)
  template(#header)
    div(class="min-w-0")
      div(class="flex items-center gap-2")
        span(class="h-2 w-2 shrink-0 rounded-full shadow-[0_0_8px_currentColor]" :class="isRunning ? 'bg-success text-success' : 'bg-muted-foreground text-muted-foreground'" aria-hidden="true")
        div(class="min-w-0")
          div(class="truncate font-mono text-sm font-semibold leading-tight text-foreground") {{ daemon.name }}
          div(class="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground") {{ t('daemons.bootLabel') }}
    div(class="flex items-center gap-2")
    DaemonStatusBadge(:status="daemon.status")
      Tooltip
        TooltipTrigger(as-child)
          SharedButton(
            variant="ghost"
            size="icon"
            class="h-6 w-6 rounded-md"
            :class="favorite ? 'text-warning' : 'text-muted-foreground hover:text-warning'"
            :aria-label="favorite ? t('daemons.unpin') : t('daemons.pin')"
            @click="emit('toggleFavorite')"
          )
            Star(class="h-3 w-3" :class="{ 'fill-current': favorite }" aria-hidden="true")
        TooltipContent {{ favorite ? t('daemons.unpin') : t('daemons.pin') }}

  template(#meta)
    div(class="flex items-center justify-between gap-3")
      div(
        v-if="daemon.description && daemon.description !== daemon.name"
        class="line-clamp-2 text-xs text-muted-foreground"
      ) {{ daemon.description }}
      span(v-else class="text-xs text-muted-foreground/70") {{ t('daemons.noDescription') }}
      SharedSwitch(
        :model-value="isEnabled"
        :disabled="pending || isStatic"
        :aria-label="bootTooltip"
        @update:model-value="emit('toggleEnabled')"
      )

  template(#default)
    div(class="flex items-center justify-between rounded-md border border-border/70 bg-muted/50 px-3 py-2")
      span(class="cyber-label") {{ t('daemons.bootLabel') }}
      span(class="font-mono text-xs text-foreground") {{ isStatic ? 'STATIC' : isEnabled ? 'ENABLED' : 'DISABLED' }}

  template(#footer)
    Tooltip
      TooltipTrigger(as-child)
        SharedButton(
          variant="ghost"
          size="sm"
          :loading="pending"
          :disabled="pending"
          :aria-label="isRunning ? t('common.stop') : t('common.start')"
          class="h-7 gap-1.5 rounded-md px-2.5 text-xs font-medium"
          :class="isRunning ? 'bg-destructive/10 text-destructive hover:bg-destructive/15' : 'bg-success/10 text-success hover:bg-success/15'"
          @click="isRunning ? emit('stop') : emit('start')"
        )
          component(:is="isRunning ? Square : Play" class="h-3 w-3" aria-hidden="true")
          | {{ isRunning ? t('common.stop') : t('common.start') }}
      TooltipContent {{ isRunning ? t('common.stop') : t('common.start') }}

    Tooltip
      TooltipTrigger(as-child)
        SharedButton(
          variant="ghost"
          size="icon"
          :disabled="pending || !isRunning"
          :icon="RotateCcw"
          :aria-label="t('common.restart')"
          class="ml-auto h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          @click="emit('restart')"
        )
      TooltipContent {{ t('common.restart') }}
</template>