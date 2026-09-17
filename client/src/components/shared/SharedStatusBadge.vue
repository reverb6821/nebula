<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusTone = 'success' | 'warning' | 'destructive' | 'neutral' | 'primary'
type StatusMode = 'badge' | 'dot'

const props = withDefaults(defineProps<{
  label: string
  tone: StatusTone
  icon?: Component
  mode?: StatusMode
  animation?: 'pulse' | 'spin'
  dotClass?: string
  class?: HTMLAttributes['class']
}>(), {
  mode: 'badge',
})

const toneClass = computed(() => ({
  success: 'border-success/40 bg-success/10 text-success',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  destructive: 'border-destructive/40 bg-destructive/10 text-destructive',
  neutral: 'border-border bg-muted text-muted-foreground',
  primary: 'border-primary/40 bg-primary/10 text-primary',
}[props.tone]))

const toneDotClass = computed(() => ({
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  neutral: 'bg-muted-foreground',
  primary: 'bg-primary',
}[props.tone]))
</script>

<template lang="pug">
Badge(
  v-if="mode === 'badge'"
  variant="outline"
  :class="cn('gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide', toneClass, props.class)"
)
  component(
    v-if="icon"
    :is="icon"
    class="h-3 w-3"
    :class="animation === 'spin' ? 'animate-spin' : animation === 'pulse' ? 'animate-pulse' : undefined"
    aria-hidden="true"
  )
  span {{ label }}

div(
  v-else
  :class="cn('flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wide', toneClass, props.class)"
)
  span(
    class="h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_0_7px_currentColor]"
    :class="[dotClass || toneDotClass, animation === 'pulse' ? 'animate-pulse' : undefined]"
    aria-hidden="true"
  )
  span {{ label }}
</template>