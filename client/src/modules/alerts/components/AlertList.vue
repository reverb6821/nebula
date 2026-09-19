<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AlertCircle, Bell, CheckCircle2, ChevronRight, Clock3 } from '@lucide/vue'
import { SharedAlert, SharedButton, SharedEmpty, SharedPanel, SharedStatusBadge } from '@/components/shared'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { AlertEvent } from '@/types/alert'
import { ALERT_PRESETS } from '@/modules/alerts/utils/alertPresets'

withDefaults(defineProps<{
  events: AlertEvent[]
  loading?: boolean
  error?: string | null
  selectedId?: string | null
}>(), {
  loading: false,
  error: null,
  selectedId: null,
})

const emit = defineEmits<{ select: [event: AlertEvent] }>()
const { t } = useI18n()

function stateKey(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function presetFor(event: AlertEvent) {
  return ALERT_PRESETS.find((preset) => preset.key === event.presetKey)
}
function labelFor(event: AlertEvent) {
  const preset = presetFor(event)
  return preset ? t(`alerts.messages.${preset.messageKey}`) : t('alerts.unknownAlert')
}
function toneFor(severity: AlertEvent['severity']) {
  return severity === 'critical' ? 'destructive' : severity === 'warning' ? 'warning' : 'primary'
}
function iconFor(state: AlertEvent['state']) {
  return state === 'resolved' ? CheckCircle2 : state === 'acknowledged' ? Clock3 : AlertCircle
}
function stateLabel(state: AlertEvent['state']) {
  return t(`alerts.state${stateKey(state)}`)
}
function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(timestamp)
}
</script>

<template lang="pug">
SharedPanel(class="min-h-[18rem]")
  template(#header)
    div(class="flex items-center gap-3")
      Bell(class="h-4 w-4 text-primary" aria-hidden="true")
      div
        h2(class="font-heading text-sm font-semibold uppercase tracking-wide text-foreground") {{ t('alerts.eventListTitle') }}
        p(class="cyber-label mt-1") {{ t('alerts.eventListSubtitle') }}
    span(class="font-mono text-xs text-muted-foreground") {{ events.length }}

  SharedAlert(v-if="error" variant="destructive" :title="t('common.error')" :description="error" class="m-4")
  div(v-else-if="loading && events.length === 0" class="divide-y divide-border/70" :aria-label="t('alerts.loading')" aria-busy="true")
    div(v-for="i in 4" :key="i" class="flex items-start justify-between gap-3 px-4 py-3")
      div(class="flex min-w-0 flex-1 items-start gap-3")
        Skeleton(class="mt-0.5 h-4 w-4 shrink-0 rounded-full")
        div(class="min-w-0 flex-1 space-y-2")
          Skeleton(class="h-3.5 w-3/4")
          Skeleton(class="h-3 w-1/2")
      div(class="flex shrink-0 items-center gap-2")
        Skeleton(class="h-5 w-16 rounded-full")
  SharedEmpty(
    v-else-if="events.length === 0"
    :icon="Bell"
    :title="t('alerts.emptyTitle')"
    :description="t('alerts.emptyDescription')"
  )
  ScrollArea(v-else class="h-[28rem]")
    div(class="divide-y divide-border/70")
      SharedButton(
        v-for="event in events"
        :key="event.id"
        variant="ghost"
        class="group flex h-auto w-full items-start justify-between gap-3 rounded-none px-4 py-3 text-left hover:bg-accent/60"
        :class="selectedId === event.id ? 'bg-primary/5' : ''"
        @click="emit('select', event)"
      )
        div(class="flex min-w-0 items-start gap-3")
          component(:is="iconFor(event.state)" class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true")
          div(class="min-w-0")
            p(class="truncate text-sm font-medium text-foreground") {{ labelFor(event) }}
            p(class="mt-1 truncate font-mono text-[11px] text-muted-foreground") {{ event.resourceKey }} · {{ formatDate(event.lastUpdatedAt) }}
        div(class="flex shrink-0 items-center gap-2")
          SharedStatusBadge(:label="stateLabel(event.state)" :tone="toneFor(event.severity)" :icon="iconFor(event.state)")
          ChevronRight(class="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true")
</template>