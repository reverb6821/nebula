<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Play, Square, RotateCcw, Star } from '@lucide/vue'
import type { Daemon } from '@/types/daemon'
import { SharedSwitch, SharedButton } from '@/components/shared'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
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
Card(
  class="group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-ring/30 hover:bg-accent"
  :class="favorite ? 'border-l-2 border-l-warning' : ''"
)
  Tooltip
    TooltipTrigger(as-child)
      SharedButton(
        variant="ghost"
        size="icon"
        class="absolute right-3 top-3 h-6 w-6 rounded-md opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
        :class="favorite ? 'text-warning !opacity-100' : 'text-muted-foreground hover:text-warning'"
        :aria-label="favorite ? t('daemons.unpin') : t('daemons.pin')"
        @click="emit('toggleFavorite')"
      )
        Star(class="h-3 w-3" :class="{ 'fill-current': favorite }" aria-hidden="true")
    TooltipContent {{ favorite ? t('daemons.unpin') : t('daemons.pin') }}

  CardHeader(class="gap-1.5 p-0 pr-7")
    CardTitle(class="truncate font-mono text-sm font-semibold leading-tight text-foreground") {{ daemon.name }}
    DaemonStatusBadge(:status="daemon.status")

  CardContent(class="p-0")
    CardDescription(
      v-if="daemon.description && daemon.description !== daemon.name"
      class="line-clamp-2 text-xs text-muted-foreground"
    ) {{ daemon.description }}
    span(v-else class="text-xs text-muted-foreground/70") {{ t('daemons.noDescription') }}

  div(class="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2")
    Tooltip
      TooltipTrigger(as-child)
        span(class="text-[10px] uppercase tracking-widest text-muted-foreground") {{ t('daemons.bootLabel') }}
      TooltipContent {{ bootTooltip }}
    SharedSwitch(
      :model-value="isEnabled"
      :disabled="pending || isStatic"
      :aria-label="bootTooltip"
      @update:model-value="emit('toggleEnabled')"
    )

  div(class="-mx-4 -mb-4 mt-1 flex items-center gap-1.5 border-t border-border px-4 py-2.5")
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
          class="ml-auto h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150"
          @click="emit('restart')"
        )
      TooltipContent {{ t('common.restart') }}
</template>