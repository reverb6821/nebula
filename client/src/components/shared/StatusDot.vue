<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

export type StatusDotTone = 'running' | 'idle' | 'failed' | 'warning' | 'unknown'

const props = withDefaults(defineProps<{
  tone: StatusDotTone
  size?: 'sm' | 'md'
}>(), { size: 'sm' })

const toneClass = computed(() => ({
  running: 'bg-success',
  idle: 'bg-idle',
  failed: 'bg-[#ff7b63]',
  warning: 'bg-caution',
  unknown: 'bg-warning',
}[props.tone]))
</script>

<template lang="pug">
span(
  :class="cn('inline-block shrink-0 rounded-full', size === 'sm' ? 'size-[9px]' : 'size-2.5', toneClass)"
  aria-hidden="true"
)
</template>
