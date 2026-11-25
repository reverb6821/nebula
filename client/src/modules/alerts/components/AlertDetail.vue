<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared'
import type { StatusBadgeTone } from '@/components/shared/StatusBadge.vue'
import type { AlertEvent } from '@/types/alert'
import { ALERT_PRESETS } from '@/modules/alerts/utils/alertPresets'

// Dettaglio alert (source/Alerts.dc.html): badge stato e sorgente, titolo
// 20px, risorsa in accent mono, tabella proprieta', timeline, azioni.
const props = defineProps<{
  event?: AlertEvent | null
  restartPending?: boolean
}>()

const emit = defineEmits<{
  acknowledge: [event: AlertEvent]
  export: [event: AlertEvent]
  restartUnit: [event: AlertEvent]
}>()

const { t } = useI18n()

const preset = computed(() => props.event ? ALERT_PRESETS.find((item) => item.key === props.event?.presetKey) : undefined)
const title = computed(() => preset.value ? t(`alerts.messages.${preset.value.messageKey}`) : t('alerts.unknownAlert'))
const canAcknowledge = computed(() => props.event?.state === 'triggered')
const isService = computed(() => props.event?.category === 'services')
const occurrences = computed(() => props.event?.transitions.filter((tr) => tr.state === 'triggered').length ?? 0)

const stateTone = computed<StatusBadgeTone>(() => {
  const state = props.event?.state
  if (state === 'resolved') return 'resolved'
  if (state === 'acknowledged') return 'acknowledged'
  return 'triggered'
})

function stateLabel(state: AlertEvent['state']) {
  return t(`alerts.state${state.charAt(0).toUpperCase()}${state.slice(1)}`)
}

function dotClass(state: AlertEvent['state']) {
  if (state === 'resolved') return 'bg-success'
  if (state === 'acknowledged') return 'bg-warning'
  return 'bg-[#ff7b63]'
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(timestamp)
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(timestamp)
}
</script>

<template lang="pug">
section(
  :aria-label="t('alerts.detailTitle')"
  class="flex min-w-0 flex-[1.4_1_440px] flex-col gap-5 rounded-lg border border-border bg-card px-6 py-[22px]"
)
  template(v-if="event")
    div(class="flex flex-col gap-2")
      span(class="flex flex-wrap gap-2")
        StatusBadge(:tone="stateTone" :label="stateLabel(event.state)" class="px-[9px] py-[3px]")
        StatusBadge(tone="inactive" :label="t('alerts.sourceLabel', { name: t(`alerts.category.${event.category}`) })" class="px-[9px] py-[3px] text-group-foreground")
      h2(class="text-xl font-bold") {{ title }}
      span(class="font-mono text-sm break-all text-primary-text") {{ event.resourceKey }}{{ isService ? '.service' : '' }}

    dl(class="overflow-hidden rounded-[10px] bg-white/3 [&>div+div]:border-t [&>div+div]:border-border")
      div(class="flex justify-between gap-3 px-4 py-3")
        dt(class="text-muted-foreground") {{ t('alerts.firstDetected') }}
        dd(class="font-mono") {{ formatDate(event.firstDetectedAt) }}
      div(class="flex justify-between gap-3 px-4 py-3")
        dt(class="text-muted-foreground") {{ t('alerts.lastUpdated') }}
        dd(class="font-mono") {{ formatDate(event.lastUpdatedAt) }}
      div(class="flex justify-between gap-3 px-4 py-3")
        dt(class="text-muted-foreground") {{ t('alerts.observed') }}
        dd(class="font-mono" :class="event.state === 'triggered' ? 'text-destructive-text' : undefined")
          | {{ event.observedValue ?? t('alerts.notAvailable') }} / {{ event.threshold }}
      div(class="flex justify-between gap-3 px-4 py-3")
        dt(class="text-muted-foreground") {{ t('alerts.occurrences') }}
        dd(class="font-mono") {{ occurrences }}

    div(class="flex flex-col gap-3")
      h3(class="text-sm font-bold text-group-foreground") {{ t('alerts.timeline') }}
      ol(class="flex flex-col gap-3")
        li(
          v-for="transition in event.transitions"
          :key="`${transition.state}-${transition.at}`"
          class="flex gap-3.5"
        )
          span(class="mt-1 size-2.5 shrink-0 rounded-full" :class="dotClass(transition.state)" aria-hidden="true")
          span(class="flex flex-col gap-0.5")
            span(class="font-semibold") {{ t('alerts.timelineEntry', { state: stateLabel(transition.state) }) }}
            span(class="font-mono text-xs text-muted-foreground")
              | {{ formatTime(transition.at) }}
              template(v-if="transition.observedValue !== null")  · {{ t('alerts.observedShort', { value: transition.observedValue }) }}

    div(class="flex flex-wrap gap-2 border-t border-border pt-4")
      Button(:disabled="!canAcknowledge" @click="emit('acknowledge', event)") {{ t('alerts.acknowledge') }}
      Button(
        v-if="isService"
        variant="secondary"
        :disabled="restartPending"
        @click="emit('restartUnit', event)"
      ) {{ t('alerts.restartUnit') }}
      Button(v-if="isService" variant="secondary" as-child)
        RouterLink(to="/services") {{ t('alerts.openInServices') }}
      div(class="flex-1")
      Button(variant="ghost" class="text-group-foreground" @click="emit('export', event)")
        Download(class="size-4" aria-hidden="true")
        | {{ t('alerts.export') }}

  div(v-else class="flex flex-1 flex-col items-center justify-center gap-1 py-10 text-center")
    span(class="font-semibold") {{ t('alerts.detailEmptyTitle') }}
    span(class="text-13 text-muted-foreground") {{ t('alerts.detailEmptyDescription') }}
</template>
