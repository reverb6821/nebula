<script setup lang="ts">
import { computed } from 'vue'
import { Play, Square, RotateCcw } from '@lucide/vue'
import type { Daemon } from '@/types/daemon'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import DaemonStatusBadge from './DaemonStatusBadge.vue'

const props = defineProps<{
  daemon: Daemon
  pending: boolean
}>()

const emit = defineEmits<{
  start: []
  stop: []
  restart: []
  toggleEnabled: []
}>()

const isRunning = computed(() => props.daemon.status === 'active')
const isEnabled = computed(() => props.daemon.enabled === 'enabled')
const isStatic  = computed(() => props.daemon.enabled === 'static')

const bootTooltip = computed(() => {
  if (isStatic.value) return 'Cannot change a static unit'
  return isEnabled.value ? 'Disable at boot' : 'Enable at boot'
})
</script>

<template>
  <div
    class="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 transition-colors hover:bg-zinc-900"
  >
    <!-- Name + description -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="truncate font-mono text-sm font-medium text-zinc-100">
          {{ daemon.name }}
        </span>
        <DaemonStatusBadge :status="daemon.status" />
      </div>
      <p class="mt-0.5 truncate text-xs text-zinc-500">
        {{ daemon.description || '—' }}
      </p>
    </div>

    <!-- Boot autostart toggle -->
    <Tooltip>
      <TooltipTrigger as-child>
        <div class="flex items-center gap-2">
          <span class="text-xs text-zinc-500">Boot</span>
          <Switch
            :checked="isEnabled"
            :disabled="pending || isStatic"
            @update:checked="emit('toggleEnabled')"
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>{{ bootTooltip }}</TooltipContent>
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
          <RotateCcw
            class="h-3.5 w-3.5"
            :class="{ 'animate-spin': pending }"
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Restart</TooltipContent>
    </Tooltip>
  </div>
</template>