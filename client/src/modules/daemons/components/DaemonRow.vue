<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Play, RotateCcw, Square, Star } from '@lucide/vue'
import type { Daemon } from '@/types/daemon'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { StatusBadge, StatusDot } from '@/components/shared'
import type { StatusBadgeTone } from '@/components/shared/StatusBadge.vue'
import type { StatusDotTone } from '@/components/shared/StatusDot.vue'

// Riga unit di Services (source/Daemons.dc.html, classe .row).
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
const isStatic = computed(() => props.daemon.enabled === 'static')
const isEnabled = computed(() => props.daemon.enabled === 'enabled')

const dotTone = computed<StatusDotTone>(() => ({
  active: 'running',
  failed: 'failed',
  inactive: 'idle',
  unknown: 'unknown',
} as const)[props.daemon.status])

const badgeTone = computed<StatusBadgeTone>(() => ({
  active: 'active',
  failed: 'failed',
  inactive: 'inactive',
  unknown: 'unknown',
} as const)[props.daemon.status])

const statusLabel = computed(() => ({
  active: t('daemons.statusActive'),
  failed: t('daemons.statusFailed'),
  inactive: t('daemons.statusInactive'),
  unknown: t('daemons.statusUnknown'),
})[props.daemon.status])

const bootLabel = computed(() => isStatic.value
  ? t('services.staticUnit', { name: props.daemon.name })
  : t('services.bootAria', { name: props.daemon.name }))
</script>

<template lang="pug">
div(class="flex min-h-16 flex-wrap items-center gap-3.5 py-3 pr-3 pl-[18px]")
  StatusDot(:tone="dotTone" size="md")
  div(class="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5")
    span(class="flex flex-wrap items-center gap-2.5")
      span(class="font-mono font-semibold break-all")
        | {{ daemon.name }}
        span(class="text-muted-foreground") .service
      StatusBadge(:tone="badgeTone" :label="statusLabel")
    span(
      v-if="daemon.description && daemon.description !== daemon.name"
      class="truncate text-13 text-muted-foreground"
    ) {{ daemon.description }}
  Button(
    variant="ghost"
    size="icon"
    :class="favorite ? 'text-warning hover:text-warning' : 'text-muted-foreground'"
    :aria-label="favorite ? t('services.unpin', { name: daemon.name }) : t('services.pin', { name: daemon.name })"
    :aria-pressed="favorite"
    @click="emit('toggleFavorite')"
  )
    Star(:class="favorite ? 'fill-current' : undefined" aria-hidden="true")
  label(class="flex min-h-11 items-center gap-2 text-13 text-group-foreground")
    | {{ t('daemons.bootLabel') }}
    Switch(
      :model-value="isEnabled"
      :disabled="pending || isStatic"
      :aria-label="bootLabel"
      @update:model-value="emit('toggleEnabled')"
    )
  Button(
    variant="ghost"
    size="icon"
    :disabled="pending"
    :aria-label="isRunning ? t('services.stopUnit', { name: daemon.name }) : t('services.startUnit', { name: daemon.name })"
    @click="isRunning ? emit('stop') : emit('start')"
  )
    Square(v-if="isRunning" class="size-4" aria-hidden="true")
    Play(v-else class="size-4" aria-hidden="true")
  Button(
    variant="ghost"
    size="icon"
    :disabled="pending"
    :aria-label="t('services.restartUnit', { name: daemon.name })"
    @click="emit('restart')"
  )
    RotateCcw(class="size-4" :class="{ 'animate-spin': pending }" aria-hidden="true")
</template>
