<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Play, Square, RotateCcw, Star } from '@lucide/vue'
import type { Daemon } from '@/types/daemon'
import { SharedButton, SharedSwitch } from '@/components/shared'
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
const isFailed = computed(() => props.daemon.status === 'failed')
const isStatic = computed(() => props.daemon.enabled === 'static')
const isEnabled = computed(() => props.daemon.enabled === 'enabled')

const dotClass = computed(() => {
  if (isRunning.value) return 'bg-emerald-400 shadow-[0_0_6px_theme(colors.emerald.400/0.8)] animate-pulse'
  if (isFailed.value) return 'bg-red-400'
  return 'bg-zinc-600'
})

const bootTooltip = computed(() => {
  if (isStatic.value) return t('daemons.staticUnit')
  return isEnabled.value ? t('daemons.disableAtBoot') : t('daemons.enableAtBoot')
})
</script>

<template>
  <Item variant="outline"
    class="group border-white/[0.06] rounded-xl bg-white/[0.02] transition-all duration-150 hover:border-white/[0.1] hover:bg-white/[0.04]"
    :class="{ 'border-amber-500/20 bg-amber-500/[0.03]': favorite }">
    <!-- Status dot -->
    <ItemMedia>
      <span class="h-1.5 w-1.5 rounded-full transition-colors" :class="dotClass" />
    </ItemMedia>

    <!-- Name + description -->
    <ItemContent>
      <ItemTitle class="font-mono text-sm font-medium text-zinc-100">
        {{ daemon.name }}
      </ItemTitle>
      <ItemDescription v-if="daemon.description && daemon.description !== daemon.name"
        class="mt-0.5 truncate text-xs text-zinc-500">
        {{ daemon.description }}
      </ItemDescription>
    </ItemContent>

    <!-- Actions -->
    <ItemActions class="gap-0.5">

      <!-- Boot toggle -->
      <Tooltip>
        <TooltipTrigger as-child>
          <div class="mr-1 flex items-center gap-1.5">
            <span class="text-[10px] uppercase tracking-widest text-zinc-700">{{ t('daemons.bootLabel') }}</span>
            <SharedSwitch :model-value="isEnabled" :disabled="pending || isStatic" class="scale-75"
              @update:model-value="emit('toggleEnabled')" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">{{ bootTooltip }}</TooltipContent>
      </Tooltip>

      <!-- Favorite -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton variant="ghost" size="icon" class="h-7 w-7 hover:bg-white/5 rounded-xl text-amber-400 hover:text-amber-400"
            :class="favorite ?? 'text-amber-400'"
            @click="emit('toggleFavorite')">
            <Star class="h-3 w-3" :class="{ 'fill-current': favorite }" />
          </SharedButton>
        </TooltipTrigger>
        <TooltipContent>{{ favorite ? t('daemons.unpin') : t('daemons.pin') }}</TooltipContent>
      </Tooltip>

      <!-- Start / Stop -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton variant="ghost" size="icon" :loading="pending" :disabled="pending"
            :icon="isRunning ? Square : Play" class="h-7 w-7 hover:bg-white/5 rounded-xl" :class="isRunning
              ? 'text-red-400 hover:text-red-400'
              : 'text-emerald-400 hover:text-emerald-400'" @click="isRunning ? emit('stop') : emit('start')" />
        </TooltipTrigger>
        <TooltipContent>{{ isRunning ? t('common.stop') : t('common.start') }}</TooltipContent>
      </Tooltip>

      <!-- Restart -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton variant="ghost" size="icon" :disabled="pending || !isRunning" :icon="RotateCcw"
            class="h-7 w-7 rounded-xl text-zinc-500 hover:bg-white/5 hover:text-zinc-200" @click="emit('restart')" />
        </TooltipTrigger>
        <TooltipContent>{{ t('common.restart') }}</TooltipContent>
      </Tooltip>

    </ItemActions>
  </Item>
</template>