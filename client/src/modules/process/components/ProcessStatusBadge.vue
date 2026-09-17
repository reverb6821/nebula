<script setup lang="ts">
import type { ProcessStatus } from '@/types/process'
import { SharedStatusBadge } from '@/components/shared'
import { PROCESS_STATUS_LABELS, PROCESS_STATUS_DOT } from '../utils/processStatus'

defineProps<{ status: ProcessStatus }>()
</script>

<template lang="pug">
SharedStatusBadge(
  mode="dot"
  :label="PROCESS_STATUS_LABELS[status]"
  tone="neutral"
  :dot-class="PROCESS_STATUS_DOT[status].replace(' animate-pulse', '')"
  :animation="PROCESS_STATUS_DOT[status].includes('animate-pulse') ? 'pulse' : undefined"
)
</template>