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
  // shadow-[...theme(colors.emerald.400/0.8)] usava la sintassi
  // theme() di Tailwind v3 dentro un valore arbitrario: in v4 non è
  // più il modo previsto per leggere i colori del tema e può non
  // risolversi. color-mix() con var(--success) è CSS nativo e legge
  // il token direttamente, quindi resta corretto anche se il tema
  // cambia.
  if (isRunning.value) return 'bg-success shadow-[0_0_6px_color-mix(in_srgb,var(--success)_80%,transparent)] animate-pulse'
  if (isFailed.value) return 'bg-destructive'
  return 'bg-muted-foreground/50'
})

const bootTooltip = computed(() => {
  if (isStatic.value) return t('daemons.staticUnit')
  return isEnabled.value ? t('daemons.disableAtBoot') : t('daemons.enableAtBoot')
})
</script>

<template>
  <!-- rounded-xl → rounded-lg: vedi nota in DaemonCard.vue -->
  <Item variant="outline"
    class="group border-border rounded-lg bg-card transition-all duration-150 hover:bg-accent"
    :class="{ 'border-warning/20 bg-warning/[0.03]': favorite }">
    <!-- Status dot -->
    <ItemMedia>
      <span class="h-1.5 w-1.5 rounded-full transition-colors" :class="dotClass" aria-hidden="true" />
    </ItemMedia>

    <!-- Name + description -->
    <ItemContent>
      <ItemTitle class="font-mono text-sm font-medium text-foreground">
        {{ daemon.name }}
      </ItemTitle>
      <ItemDescription v-if="daemon.description && daemon.description !== daemon.name"
        class="mt-0.5 truncate text-xs text-muted-foreground">
        {{ daemon.description }}
      </ItemDescription>
    </ItemContent>

    <!-- Actions -->
    <ItemActions class="gap-0.5">

      <!-- Boot toggle -->
      <Tooltip>
        <TooltipTrigger as-child>
          <div class="mr-1 flex items-center gap-1.5">
            <span class="text-[10px] uppercase tracking-widest text-muted-foreground">{{ t('daemons.bootLabel') }}</span>
            <SharedSwitch :model-value="isEnabled" :disabled="pending || isStatic" :aria-label="bootTooltip" class="scale-75"
              @update:model-value="emit('toggleEnabled')" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">{{ bootTooltip }}</TooltipContent>
      </Tooltip>

      <!-- Favorite -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton variant="ghost" size="icon" class="h-7 w-7 rounded-md text-warning hover:bg-accent hover:text-warning"
            :aria-label="favorite ? t('daemons.unpin') : t('daemons.pin')"
            @click="emit('toggleFavorite')">
            <Star class="h-3 w-3" :class="{ 'fill-current': favorite }" aria-hidden="true" />
          </SharedButton>
        </TooltipTrigger>
        <TooltipContent>{{ favorite ? t('daemons.unpin') : t('daemons.pin') }}</TooltipContent>
      </Tooltip>

      <!-- Start / Stop -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton variant="ghost" size="icon" :loading="pending" :disabled="pending"
            :icon="isRunning ? Square : Play" :aria-label="isRunning ? t('common.stop') : t('common.start')"
            class="h-7 w-7 rounded-md hover:bg-accent" :class="isRunning
              ? 'text-destructive hover:text-destructive'
              : 'text-success hover:text-success'" @click="isRunning ? emit('stop') : emit('start')" />
        </TooltipTrigger>
        <TooltipContent>{{ isRunning ? t('common.stop') : t('common.start') }}</TooltipContent>
      </Tooltip>

      <!-- Restart -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton variant="ghost" size="icon" :disabled="pending || !isRunning" :icon="RotateCcw"
            :aria-label="t('common.restart')"
            class="h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150" @click="emit('restart')" />
        </TooltipTrigger>
        <TooltipContent>{{ t('common.restart') }}</TooltipContent>
      </Tooltip>

    </ItemActions>
  </Item>
</template>