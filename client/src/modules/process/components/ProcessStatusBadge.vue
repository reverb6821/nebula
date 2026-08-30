<script setup lang="ts">
import type { ProcessStatus } from '@/types/process'
import { PROCESS_STATUS_LABELS, PROCESS_STATUS_DOT } from '../utils/processStatus'

defineProps<{ status: ProcessStatus }>()
</script>

<template>
  <div class="flex items-center gap-1.5">
    <span :class="['h-1.5 w-1.5 shrink-0 rounded-full', PROCESS_STATUS_DOT[status]]" aria-hidden="true" />
    <span class="text-xs text-muted-foreground">{{ PROCESS_STATUS_LABELS[status] }}</span>
  </div>
</template>