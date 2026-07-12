<script setup lang="ts">
import { computed } from 'vue'
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

const isRunning = computed(() => props.daemon.status === 'active')
const isStatic  = computed(() => props.daemon.enabled === 'static')
const isEnabled = computed(() => props.daemon.enabled === 'enabled')

const bootTooltip = computed(() => {
  if (isStatic.value) return 'Static unit — cannot change'
  return isEnabled.value ? 'Disable at boot' : 'Enable at boot'
})
</script>

<template>
  <Card
    class="group flex flex-col border-white/[0.06] bg-white/[0.02] transition-all duration-200 hover:border-white/[0.1] hover:bg-white/[0.04]"
    :class="{ 'border-amber-500/20 bg-amber-500/[0.03]': favorite }"
  >
    <CardHeader class="space-y-2 p-4 pb-3">
      <!-- Top row: status badge + controls -->
      <div class="flex items-center justify-between gap-2">
        <DaemonStatusBadge :status="daemon.status" />

        <div class="flex items-center gap-1">
          <!-- Favorite -->
          <Tooltip>
            <TooltipTrigger as-child>
              <SharedButton
                variant="ghost"
                size="icon"
                class="h-6 w-6 hover:bg-white/5 opacity-0 transition-opacity group-hover:opacity-100"
                :class="favorite ? 'text-amber-400 !opacity-100' : 'text-zinc-600 hover:text-amber-400'"
                @click="emit('toggleFavorite')"
              >
                <Star class="h-3 w-3" :class="{ 'fill-current': favorite }" />
              </SharedButton>
            </TooltipTrigger>
            <TooltipContent>{{ favorite ? 'Unpin' : 'Pin' }}</TooltipContent>
          </Tooltip>

          <!-- Boot toggle -->
          <Tooltip>
            <TooltipTrigger as-child>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] uppercase tracking-widest text-zinc-700">Boot</span>
                <SharedSwitch
                  :model-value="isEnabled"
                  :disabled="pending || isStatic"
                  class="scale-75"
                  @update:model-value="emit('toggleEnabled')"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>{{ bootTooltip }}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <!-- Name -->
      <CardTitle class="truncate font-mono text-sm font-semibold leading-tight text-zinc-100">
        {{ daemon.name }}
      </CardTitle>
    </CardHeader>

    <CardContent class="flex-1 px-4 pb-0">
      <CardDescription
        v-if="daemon.description && daemon.description !== daemon.name"
        class="line-clamp-2 text-xs text-zinc-500"
      >
        {{ daemon.description }}
      </CardDescription>
      <span v-else class="text-xs text-zinc-700">No description</span>
    </CardContent>

    <!-- Footer actions -->
    <div class="mt-3 flex items-center justify-end gap-0.5 border-t border-white/[0.05] px-3 py-2">
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :loading="pending"
            :disabled="pending"
            :icon="isRunning ? Square : Play"
            class="h-7 w-7 hover:bg-white/5"
            :class="isRunning
              ? 'text-zinc-500 hover:text-red-400'
              : 'text-emerald-500 hover:text-emerald-400'"
            @click="isRunning ? emit('stop') : emit('start')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ isRunning ? 'Stop' : 'Start' }}</TooltipContent>
      </Tooltip>

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
        <TooltipContent>Restart</TooltipContent>
      </Tooltip>
    </div>
  </Card>
</template>