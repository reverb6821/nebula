<script setup lang="ts">
import type { Component } from 'vue'
import type { Severity } from '../utils/severity'

withDefaults(defineProps<{
  icon: Component
  label: string
  value: string
  sub?: string
  severity?: Severity
}>(), {
  severity: undefined,
})

const DOT_CLASS: Record<Severity, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
}

const NUMBER_CLASS: Record<Severity, string> = {
  success: 'text-foreground',
  warning: 'text-warning',
  destructive: 'text-destructive',
}
</script>

<template lang="pug">
div(class="cyber-panel rounded-lg p-3 transition-shadow hover:border-primary/35 hover:shadow-cyber-signal")
  div(class="cyber-label flex items-center gap-1.5")
    component(:is="icon" class="h-3 w-3 shrink-0" aria-hidden="true")
    span(class="truncate") {{ label }}
    span(
      v-if="severity"
      class="ml-auto h-1.5 w-1.5 shrink-0 rounded-full shadow-[0_0_8px_currentColor]"
      :class="DOT_CLASS[severity]"
      aria-hidden="true"
    )
  div(class="mt-1 font-mono text-xl" :class="severity ? NUMBER_CLASS[severity] : 'text-foreground'") {{ value }}
  div(v-if="sub" class="font-mono text-[10px] text-muted-foreground/70") {{ sub }}
</template>