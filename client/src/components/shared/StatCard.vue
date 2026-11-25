<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

// Card KPI: header (icona + label + meta mono), valore 34px/800 con unita'
// 16px/600 muted, slot default per sparkline/progress, footer testuale.
const props = defineProps<{
  label: string
  value: string | number
  unit?: string
  meta?: string
  metaClass?: HTMLAttributes['class']
  valueClass?: HTMLAttributes['class']
  icon?: Component
  footnote?: string
  class?: HTMLAttributes['class']
}>()
</script>

<template lang="pug">
div(:class="cn('flex flex-col gap-2.5 rounded-lg border border-border bg-card p-[18px]', props.class)")
  div(class="flex items-center gap-2 font-semibold text-group-foreground")
    component(v-if="icon" :is="icon" class="size-4 shrink-0" aria-hidden="true")
    span(class="min-w-0 flex-1 truncate")
      slot(name="label") {{ label }}
    span(v-if="meta" :class="cn('font-mono text-xs font-normal text-muted-foreground', metaClass)") {{ meta }}
  div(class="flex items-baseline gap-2")
    span(:class="cn('text-kpi leading-tight font-extrabold tracking-tight', valueClass)") {{ value }}
    span(v-if="unit" class="text-base font-semibold text-muted-foreground") {{ unit }}
  slot
  span(v-if="footnote" class="text-xs text-muted-foreground") {{ footnote }}
</template>
