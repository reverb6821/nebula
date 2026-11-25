<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// La label e' sempre presente: lo stato non si distingue solo dal colore.
export type StatusBadgeTone =
  | 'active'
  | 'running'
  | 'inactive'
  | 'exited'
  | 'unknown'
  | 'failed'
  | 'triggered'
  | 'acknowledged'
  | 'resolved'
  | 'info'

const props = defineProps<{
  tone: StatusBadgeTone
  label: string
  class?: HTMLAttributes['class']
}>()

const toneClass = computed(() => ({
  active: 'bg-success/12 text-success',
  running: 'bg-success/12 text-success',
  resolved: 'bg-success/12 text-success',
  inactive: 'bg-white/8 text-muted-foreground',
  exited: 'bg-white/8 text-muted-foreground',
  unknown: 'bg-warning/12 text-warning',
  acknowledged: 'bg-warning/12 text-warning',
  failed: 'bg-destructive/25 text-destructive-text',
  triggered: 'bg-destructive/25 text-destructive-text',
  info: 'bg-primary-soft text-primary-text',
}[props.tone]))
</script>

<template lang="pug">
Badge(:class="cn('border-transparent', toneClass, props.class)") {{ label }}
</template>
