<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DaemonStatus } from '@/types/daemon'
import { SharedStatusBadge } from '@/components/shared'
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from '@lucide/vue'

const props = defineProps<{ status: DaemonStatus }>()

const { t } = useI18n()

const statusConfig: Record<DaemonStatus, {
  tone: 'success' | 'neutral' | 'destructive' | 'warning'
  icon: typeof CheckCircle2
  pulse?: boolean
}> = {
  active: { tone: 'success', icon: CheckCircle2, pulse: true },
  inactive: { tone: 'neutral', icon: XCircle },
  failed: { tone: 'destructive', icon: AlertCircle },
  unknown: { tone: 'warning', icon: HelpCircle },
}

const statusLabel = computed(() => {
  const key: Record<DaemonStatus, string> = {
    active: 'daemons.statusActive',
    inactive: 'daemons.statusInactive',
    failed: 'daemons.statusFailed',
    unknown: 'daemons.statusUnknown',
  }
  return t(key[props.status])
})
</script>

<template lang="pug">
SharedStatusBadge(
  :label="statusLabel"
  :tone="statusConfig[status].tone"
  :icon="statusConfig[status].icon"
  :animation="statusConfig[status].pulse ? 'pulse' : undefined"
)
</template>