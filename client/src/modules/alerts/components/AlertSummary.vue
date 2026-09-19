<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Activity, AlertTriangle, CheckCircle2, CircleDot } from '@lucide/vue'
import { SharedPanel, SharedStatusBadge } from '@/components/shared'
import type { MonitoringStatus } from '@/modules/alerts/store'

const props = withDefaults(defineProps<{
  monitoringStatus: MonitoringStatus
  degradedSources?: string[]
  activeCount?: number
  acknowledgedCount?: number
  resolvedCount?: number
}>(), {
  degradedSources: () => [],
  activeCount: 0,
  acknowledgedCount: 0,
  resolvedCount: 0,
})

const { t } = useI18n()
const isDegraded = computed(() => props.monitoringStatus === 'degraded')
const statusTone = computed(() => isDegraded.value ? 'warning' : 'success')
const statusLabel = computed(() => t(isDegraded.value ? 'alerts.monitoringDegraded' : 'alerts.monitoringHealthy'))
</script>

<template lang="pug">
SharedPanel(class="border-primary/15")
  template(#header)
    div(class="flex min-w-0 items-center gap-3")
      div(class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/5 text-primary" aria-hidden="true")
        Activity(class="h-4 w-4")
      div(class="min-w-0")
        h2(class="font-heading text-sm font-semibold uppercase tracking-wide text-foreground") {{ t('alerts.monitoringTitle') }}
        p(class="cyber-label mt-1") {{ t('alerts.monitoringSubtitle') }}
    SharedStatusBadge(:label="statusLabel" :tone="statusTone" :icon="isDegraded ? AlertTriangle : CheckCircle2")
  div(class="grid gap-3 p-4 sm:grid-cols-3")
    div(class="rounded-md border border-border/70 bg-background/35 p-3")
      div(class="flex items-center gap-2 text-muted-foreground")
        CircleDot(class="h-3.5 w-3.5 text-destructive" aria-hidden="true")
        span(class="cyber-label") {{ t('alerts.active') }}
      p(class="mt-2 font-mono text-2xl font-semibold text-foreground") {{ activeCount }}
    div(class="rounded-md border border-border/70 bg-background/35 p-3")
      span(class="cyber-label text-muted-foreground") {{ t('alerts.acknowledged') }}
      p(class="mt-2 font-mono text-2xl font-semibold text-foreground") {{ acknowledgedCount }}
    div(class="rounded-md border border-border/70 bg-background/35 p-3")
      span(class="cyber-label text-muted-foreground") {{ t('alerts.resolved') }}
      p(class="mt-2 font-mono text-2xl font-semibold text-foreground") {{ resolvedCount }}
  div(v-if="isDegraded" class="border-t border-warning/20 bg-warning/5 px-4 py-3" role="status")
    p(class="text-xs font-medium text-warning") {{ t('alerts.degradedSources') }}
    p(class="mt-1 text-sm text-foreground") {{ degradedSources.length ? degradedSources.join(', ') : t('alerts.unknownSource') }}
</template>
