<script setup lang="ts">
import { computed } from 'vue'
import { Play, Square, RotateCcw, Circle } from '@lucide/vue'
import type { Daemon } from '@/types/daemon'
import SharedButton from '@/components/shared/SharedButton.vue'
import SharedSwitch from '@/components/shared/SharedSwitch.vue'
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
const isFailed  = computed(() => props.daemon.status === 'failed')
const isStatic  = computed(() => props.daemon.enabled === 'static')
const isEnabled = computed(() => props.daemon.enabled === 'enabled')

const dotClass = computed(() => {
  if (isRunning.value) return 'text-emerald-400 animate-pulse'
  if (isFailed.value)  return 'text-red-400'
  return 'text-zinc-600'
})

const bootTooltip = computed(() => {
  if (isStatic.value) return 'Static unit — cannot change'
  return isEnabled.value ? 'Disable at boot' : 'Enable at boot'
})
</script>

<template>
  <Item variant="outline" size="sm" class="group transition-colors hover:border-zinc-700 hover:bg-zinc-900/80">

    <!-- Status dot -->
    <ItemMedia>
      <Circle :class="['h-2 w-2 fill-current', dotClass]" />
    </ItemMedia>

    <!-- Name + description -->
    <ItemContent>
      <ItemTitle class="font-mono text-sm text-zinc-100">
        {{ daemon.name }}
      </ItemTitle>
      <ItemDescription
        v-if="daemon.description && daemon.description !== daemon.name"
        class="truncate text-xs text-zinc-500"
      >
        {{ daemon.description }}
      </ItemDescription>
    </ItemContent>

    <!-- Actions -->
    <ItemActions class="gap-3">

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
        <TooltipContent side="left">{{ bootTooltip }}</TooltipContent>
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
            class="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
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
            class="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 text-zinc-400 hover:text-zinc-200"
            @click="emit('restart')"
          />
        </TooltipTrigger>
        <TooltipContent>Restart</TooltipContent>
      </Tooltip>

    </ItemActions>
  </Item>
</template>