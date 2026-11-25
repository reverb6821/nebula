<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

// Barra di utilizzo (Progress semplificato senza animazione d'ingresso).
const props = withDefaults(defineProps<{
  value: number
  max?: number
  height?: number
  barClass?: HTMLAttributes['class']
  class?: HTMLAttributes['class']
  label?: string
  radius?: number
}>(), { max: 100, height: 8 })

const borderRadius = computed(() => `${props.radius ?? props.height / 2}px`)

const percent = computed(() => Math.max(0, Math.min(100, (props.value / (props.max || 1)) * 100)))
</script>

<template lang="pug">
div(
  role="progressbar"
  :aria-valuenow="Math.round(percent)"
  aria-valuemin="0"
  aria-valuemax="100"
  :aria-label="label"
  :class="cn('w-full overflow-hidden bg-white/8', props.class)"
  :style="{ height: `${height}px`, borderRadius }"
)
  div(
    :class="cn('h-full bg-primary-text transition-[width] duration-150', barClass)"
    :style="{ width: `${percent}%`, borderRadius }"
  )
</template>
