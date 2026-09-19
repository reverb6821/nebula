<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, ExternalLink, ShieldCheck, Siren } from '@lucide/vue'
import { SharedButton, SharedEmpty, SharedPanel, SharedStatusBadge } from '@/components/shared'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { AlertEvent } from '@/types/alert'
import { ALERT_PRESETS } from '@/modules/alerts/utils/alertPresets'

const props = defineProps<{
  event?: AlertEvent | null
}>()
const emit = defineEmits<{
  acknowledge: [event: AlertEvent]
  export: [event: AlertEvent]
}>()
const { t } = useI18n()

function stateKey(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
const preset = computed(() => props.event ? ALERT_PRESETS.find((item) => item.key === props.event?.presetKey) : undefined)
const canAcknowledge = computed(() => props.event?.state === 'triggered')
function stateLabel(state: AlertEvent['state']) {
  return t(`alerts.state${stateKey(state)}`)
}
function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)
}
</script>

<template lang="pug">
SharedPanel(v-if="event" class="flex h-full flex-col")
  template(#header)
    div(class="flex min-w-0 items-center gap-3")
      div(class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-destructive/25 bg-destructive/10 text-destructive" aria-hidden="true")
        Siren(class="h-4 w-4")
      div(class="min-w-0")
        h2(class="truncate font-heading text-sm font-semibold uppercase tracking-wide text-foreground") {{ t('alerts.detailTitle') }}
        p(class="cyber-label mt-1 truncate") {{ event.resourceKey }}
    SharedStatusBadge(:label="stateLabel(event.state)" :tone="event.severity === 'critical' ? 'destructive' : event.severity === 'warning' ? 'warning' : 'primary'")
  ScrollArea(class="flex-1")
    div(class="space-y-5 p-4")
      div
        p(class="text-base font-medium leading-relaxed text-foreground") {{ preset ? t(`alerts.messages.${preset.messageKey}`) : t('alerts.unknownAlert') }}
        p(class="mt-2 text-sm text-muted-foreground") {{ t('alerts.observedValue', { value: event.observedValue ?? t('alerts.notAvailable'), threshold: event.threshold }) }}
      dl(class="grid gap-3 text-sm sm:grid-cols-2")
        div(class="rounded-md border border-border/70 bg-background/35 p-3")
          dt(class="cyber-label") {{ t('alerts.firstDetected') }}
          dd(class="mt-1 font-mono text-xs text-foreground") {{ formatDate(event.firstDetectedAt) }}
        div(class="rounded-md border border-border/70 bg-background/35 p-3")
          dt(class="cyber-label") {{ t('alerts.lastUpdated') }}
          dd(class="mt-1 font-mono text-xs text-foreground") {{ formatDate(event.lastUpdatedAt) }}
      div
        h3(class="cyber-label mb-2") {{ t('alerts.timeline') }}
        ol(class="space-y-2 border-l border-primary/20 pl-4")
          li(v-for="transition in event.transitions" :key="`${transition.state}-${transition.at}`" class="relative")
            span(class="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true")
            p(class="text-xs text-foreground") {{ stateLabel(transition.state) }}
            p(class="font-mono text-[11px] text-muted-foreground") {{ formatDate(transition.at) }}
  div(class="flex flex-wrap gap-2 border-t border-border/70 p-4")
    SharedButton(
      variant="outline"
      size="sm"
      :disabled="!canAcknowledge"
      :aria-label="t('alerts.acknowledge')"
      @click="emit('acknowledge', event)"
    )
      ShieldCheck(class="h-3.5 w-3.5" aria-hidden="true")
      | {{ t('alerts.acknowledge') }}
    SharedButton(variant="ghost" size="sm" @click="emit('export', event)")
      Download(class="h-3.5 w-3.5" aria-hidden="true")
      | {{ t('alerts.export') }}
    span(v-if="event.resolvedAt" class="ml-auto flex items-center gap-1 font-mono text-[11px] text-success")
      ExternalLink(class="h-3 w-3" aria-hidden="true")
      | {{ t('alerts.resolvedAt', { value: formatDate(event.resolvedAt) }) }}
SharedEmpty(v-else :icon="Siren" :title="t('alerts.detailEmptyTitle')" :description="t('alerts.detailEmptyDescription')")
</template>