<script setup lang="ts">
import { computed } from 'vue'
import { Play, Square, RotateCcw, Circle, Star } from '@lucide/vue'
import type { Daemon } from '@/types/daemon'
import { SharedSwitch, SharedButton } from '@/components/shared'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
const isFailed  = computed(() => props.daemon.status === 'failed')
const isStatic  = computed(() => props.daemon.enabled === 'static')
const isEnabled = computed(() => props.daemon.enabled === 'enabled')

const dotClass = computed(() => {
  if (isRunning.value) return 'text-emerald-400 animate-pulse'
  if (isFailed.value)  return 'text-red-400'
  return 'text-zinc-600'
})

const statusLabel = computed(() => {
  if (isRunning.value) return 'Running'
  if (isFailed.value)  return 'Failed'
  if (props.daemon.status === 'inactive') return 'Inactive'
  return 'Unknown'
})

const bootTooltip = computed(() => {
  if (isStatic.value) return 'Static unit — cannot change'
  return isEnabled.value ? 'Disable at boot' : 'Enable at boot'
})
</script>

<template>
  <Card
    class="group flex flex-col border-zinc-800 bg-zinc-900/60 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    :class="{ 'border-amber-500/30 bg-amber-500/5': favorite }"
  >
    <CardHeader class="pb-2">
      <!-- Status row -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Circle :class="['h-2 w-2 shrink-0 fill-current', dotClass]" />
          <span class="text-xs font-medium" :class="{
            'text-emerald-400': isRunning,
            'text-red-400': isFailed,
            'text-zinc-500': !isRunning && !isFailed,
          }">
            {{ statusLabel }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Favorite -->
          <Tooltip>
            <TooltipTrigger as-child>
              <SharedButton
                variant="ghost"
                size="icon"
                class="h-6 w-6 hover:bg-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                :class="favorite ? 'text-amber-400 opacity-100' : 'text-zinc-600 hover:text-amber-400'"
                @click="emit('toggleFavorite')"
              >
                <Star class="h-3 w-3" :class="{ 'fill-current': favorite }" />
              </SharedButton>
            </TooltipTrigger>
            <TooltipContent>{{ favorite ? 'Remove from favorites' : 'Add to favorites' }}</TooltipContent>
          </Tooltip>

          <!-- Boot toggle -->
          <Tooltip>
            <TooltipTrigger as-child>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] uppercase tracking-widest text-zinc-600">Boot</span>
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
      <CardTitle class="mt-2 truncate font-mono text-sm text-zinc-100">
        {{ daemon.name }}
      </CardTitle>
    </CardHeader>

    <CardContent class="flex-1 pb-3">
      <CardDescription
        v-if="daemon.description && daemon.description !== daemon.name"
        class="line-clamp-2 text-xs text-zinc-500"
      >
        {{ daemon.description }}
      </CardDescription>
      <span v-else class="text-xs text-zinc-700">No description</span>
    </CardContent>

    <CardFooter class="flex items-center justify-end gap-1 border-t border-zinc-800 pt-3">
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
            :class="isRunning
              ? 'text-zinc-400 hover:text-red-400'
              : 'text-emerald-400 hover:text-emerald-300'"
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
    </CardFooter>
  </Card>
</template>