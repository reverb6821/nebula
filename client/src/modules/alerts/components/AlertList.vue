<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircleAlert } from '@lucide/vue'
import type { AlertEvent } from '@/types/alert'
import { ALERT_PRESETS } from '@/modules/alerts/utils/alertPresets'

// Lista master (source/Alerts.dc.html, classe .arow): righe button,
// selezionata bg-primary/25.
defineProps<{
  events: AlertEvent[]
  selectedId?: string | null
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{ select: [event: AlertEvent] }>()

const { t } = useI18n()

function title(event: AlertEvent) {
  const preset = ALERT_PRESETS.find((item) => item.key === event.presetKey)
  return preset ? t(`alerts.messages.${preset.messageKey}`) : t('alerts.unknownAlert')
}

function stateLabel(state: AlertEvent['state']) {
  return t(`alerts.state${state.charAt(0).toUpperCase()}${state.slice(1)}`)
}

function stateClass(state: AlertEvent['state']) {
  if (state === 'triggered') return 'text-destructive-text'
  if (state === 'acknowledged') return 'text-warning'
  if (state === 'resolved') return 'text-success'
  return 'text-muted-foreground'
}

function iconClass(event: AlertEvent) {
  if (event.state === 'resolved') return 'bg-success/12 text-success'
  if (event.state === 'acknowledged') return 'bg-warning/12 text-warning'
  return 'bg-destructive/25 text-destructive-text'
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(timestamp)
}
</script>

<template lang="pug">
section(
  :aria-label="t('alerts.eventListTitle')"
  class="flex min-w-0 flex-[1_1_380px] flex-col gap-0.5 rounded-lg border border-border bg-card p-1.5"
)
  p(v-if="error" role="alert" class="px-4 py-3 text-13 text-destructive-text") {{ error }}
  p(v-if="loading && events.length === 0" class="px-4 py-6 text-center text-13 text-muted-foreground") {{ t('alerts.loading') }}
  div(v-else-if="events.length === 0" class="flex flex-col items-center gap-1 px-4 py-8 text-center")
    span(class="font-semibold") {{ t('alerts.emptyTitle') }}
    span(class="text-13 text-muted-foreground") {{ t('alerts.emptyDescription') }}
  button(
    v-for="event in events"
    :key="event.id"
    type="button"
    :aria-pressed="selectedId === event.id"
    class="flex w-full items-center gap-3.5 rounded-[10px] px-4 py-3.5 text-left transition-colors duration-150"
    :class="selectedId === event.id ? 'bg-primary/25' : 'hover:bg-white/4'"
    @click="emit('select', event)"
  )
    span(class="inline-flex size-9 shrink-0 items-center justify-center rounded-[9px]" :class="iconClass(event)" aria-hidden="true")
      CircleAlert(class="size-[18px]")
    span(class="flex min-w-0 flex-1 flex-col gap-[3px]")
      span(class="font-semibold") {{ title(event) }}
      span(class="truncate font-mono text-xs text-group-foreground") {{ event.resourceKey }}
    span(class="flex flex-col items-end gap-1")
      span(class="text-xs font-semibold" :class="stateClass(event.state)") {{ stateLabel(event.state) }}
      span(class="font-mono text-xs text-muted-foreground") {{ formatTime(event.lastUpdatedAt) }}
</template>
