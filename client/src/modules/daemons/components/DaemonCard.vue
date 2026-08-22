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

<template>
  <!--
    rounded-xl → rounded-lg: con i nuovi token del tema rounded-xl vale
    20px (troppo per una card di lista); rounded-lg (16px) è il livello
    "contenitore" del DESIGN.md. "Preferito" ora usa il token --warning
    invece di amber hardcoded (stesso ambra, ma tracciabile a un solo
    token se il tema cambia).
  -->
  <Card
    class="py-2 group flex flex-col border-border bg-card transition-all duration-200 hover:bg-accent rounded-lg"
    :class="{ 'border-warning/20 bg-warning/[0.03]': favorite }"
  >
    <CardHeader class="space-y-1.5">
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
                class="h-6 w-6 rounded-md text-warning hover:bg-accent hover:text-warning"
                :aria-label="favorite ? t('daemons.unpin') : t('daemons.pin')"
                @click="emit('toggleFavorite')"
              >
                <Star class="h-3 w-3" :class="{ 'fill-current': favorite }" aria-hidden="true" />
              </SharedButton>
            </TooltipTrigger>
            <TooltipContent>{{ favorite ? t('daemons.unpin') : t('daemons.pin') }}</TooltipContent>
          </Tooltip>

          <!-- Boot toggle -->
          <Tooltip>
            <TooltipTrigger as-child>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] uppercase tracking-widest text-muted-foreground">{{ t('daemons.bootLabel') }}</span>
                <SharedSwitch
                  :model-value="isEnabled"
                  :disabled="pending || isStatic"
                  :aria-label="bootTooltip"
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
      <CardTitle class="truncate font-mono text-sm font-semibold leading-tight text-foreground">
        {{ daemon.name }}
      </CardTitle>
    </CardHeader>

    <CardContent class="flex-1 px-4 pb-0">
      <CardDescription
        v-if="daemon.description && daemon.description !== daemon.name"
        class="line-clamp-2 text-xs text-muted-foreground"
      >
        {{ daemon.description }}
      </CardDescription>
      <span v-else class="text-xs text-muted-foreground/70">{{ t('daemons.noDescription') }}</span>
    </CardContent>

    <!-- Footer actions -->
    <div class="flex items-center justify-end gap-0.5 border-t border-border px-3 py-1">
      <!-- Start / Stop -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :loading="pending"
            :disabled="pending"
            :icon="isRunning ? Square : Play"
            :aria-label="isRunning ? t('common.stop') : t('common.start')"
            class="h-7 w-7 rounded-md hover:bg-accent"
            :class="isRunning
              ? 'text-destructive hover:text-destructive'
              : 'text-success hover:text-success'"
            @click="isRunning ? emit('stop') : emit('start')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ isRunning ? t('common.stop') : t('common.start') }}</TooltipContent>
      </Tooltip>

      <!-- Restart -->
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending || !isRunning"
            :icon="RotateCcw"
            :aria-label="t('common.restart')"
            class="h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150"
            @click="emit('restart')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ t('common.restart') }}</TooltipContent>
      </Tooltip>
    </div>
  </Card>
</template>