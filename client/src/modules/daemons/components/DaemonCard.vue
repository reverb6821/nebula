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
    rounded-lg = 16px, livello "contenitore" del DESIGN.md. Niente
    ombre (DESIGN.md: "Nessuna ombra tradizionale — separazione
    visiva basata sul contrasto di luminosità"): l'elevazione viene
    solo da bg-card vs bg-accent in hover e dal pannello bg-muted/50
    per la riga boot, mai da un box-shadow.

    Preferito: un bordo sinistro sottile invece del tint diffuso su
    tutta la card di prima (troppo debole per notarsi davvero) — un
    segnale netto, unico accento oltre alla stella piena.
  -->
  <Card
    class="group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-ring/30 hover:bg-accent"
    :class="favorite ? 'border-l-2 border-l-warning' : ''"
  >
    <!-- Pin: angolo in alto a destra, visibile in hover o se già attivo -->
    <Tooltip>
      <TooltipTrigger as-child>
        <SharedButton
          variant="ghost"
          size="icon"
          class="absolute right-3 top-3 h-6 w-6 rounded-md opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
          :class="favorite ? 'text-warning !opacity-100' : 'text-muted-foreground hover:text-warning'"
          :aria-label="favorite ? t('daemons.unpin') : t('daemons.pin')"
          @click="emit('toggleFavorite')"
        >
          <Star class="h-3 w-3" :class="{ 'fill-current': favorite }" aria-hidden="true" />
        </SharedButton>
      </TooltipTrigger>
      <TooltipContent>{{ favorite ? t('daemons.unpin') : t('daemons.pin') }}</TooltipContent>
    </Tooltip>

    <!-- Header: nome + stato, unico fuoco visivo in alto -->
    <CardHeader class="gap-1.5 p-0 pr-7">
      <CardTitle class="truncate font-mono text-sm font-semibold leading-tight text-foreground">
        {{ daemon.name }}
      </CardTitle>
      <DaemonStatusBadge :status="daemon.status" />
    </CardHeader>

    <!-- Descrizione -->
    <CardContent class="p-0">
      <CardDescription
        v-if="daemon.description && daemon.description !== daemon.name"
        class="line-clamp-2 text-xs text-muted-foreground"
      >
        {{ daemon.description }}
      </CardDescription>
      <span v-else class="text-xs text-muted-foreground/70">{{ t('daemons.noDescription') }}</span>
    </CardContent>

    <!--
      Riga boot: prima accalcata nell'header insieme a badge e stella,
      ora una riga propria con un pannello leggero (bg-muted/50) — lo
      stesso linguaggio delle righe in Settings, invece di reinventarne
      uno nuovo qui.
    -->
    <div class="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
      <Tooltip>
        <TooltipTrigger as-child>
          <span class="text-[10px] uppercase tracking-widest text-muted-foreground">{{ t('daemons.bootLabel') }}</span>
        </TooltipTrigger>
        <TooltipContent>{{ bootTooltip }}</TooltipContent>
      </Tooltip>
      <SharedSwitch
        :model-value="isEnabled"
        :disabled="pending || isStatic"
        :aria-label="bootTooltip"
        @update:model-value="emit('toggleEnabled')"
      />
    </div>

    <!--
      Footer: Start/Stop è l'azione primaria e ora si vede — pillola
      con tinta semantica morbida invece di un'icona nuda uguale alle
      altre. Restart resta icona neutra, spinta a destra: secondaria,
      non compete visivamente con l'azione principale.
    -->
    <div class="-mx-4 -mb-4 mt-1 flex items-center gap-1.5 border-t border-border px-4 py-2.5">
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="sm"
            :loading="pending"
            :disabled="pending"
            :aria-label="isRunning ? t('common.stop') : t('common.start')"
            class="h-7 gap-1.5 rounded-md px-2.5 text-xs font-medium"
            :class="isRunning
              ? 'bg-destructive/10 text-destructive hover:bg-destructive/15'
              : 'bg-success/10 text-success hover:bg-success/15'"
            @click="isRunning ? emit('stop') : emit('start')"
          >
            <component :is="isRunning ? Square : Play" class="h-3 w-3" aria-hidden="true" />
            {{ isRunning ? t('common.stop') : t('common.start') }}
          </SharedButton>
        </TooltipTrigger>
        <TooltipContent>{{ isRunning ? t('common.stop') : t('common.start') }}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending || !isRunning"
            :icon="RotateCcw"
            :aria-label="t('common.restart')"
            class="ml-auto h-7 w-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-150"
            @click="emit('restart')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ t('common.restart') }}</TooltipContent>
      </Tooltip>
    </div>
  </Card>
</template>