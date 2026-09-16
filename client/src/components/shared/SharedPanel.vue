<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  selected?: boolean
  favorite?: boolean
  class?: HTMLAttributes['class']
}>(), {
  selected: false,
  favorite: false,
})

const panelClass = computed(() => cn(
  'cyber-panel rounded-lg transition-all duration-150',
  props.selected && 'border-primary/50 bg-primary/5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_20%,transparent)]',
  props.favorite && !props.selected && 'border-l-2 border-l-warning bg-warning/[0.03]',
  props.class,
))
</script>

<template lang="pug">
div(:class="panelClass")
  div(v-if="$slots.header" class="flex items-start justify-between gap-3 border-b border-primary/15 px-4 py-3")
    slot(name="header")
  div(v-if="$slots.meta" class="border-b border-border/60 px-4 py-2")
    slot(name="meta")
  div(:class="$slots.header || $slots.meta ? 'px-4 py-4' : ''")
    slot
  div(v-if="$slots.footer" class="flex items-center gap-2 border-t border-primary/15 px-4 py-2.5")
    slot(name="footer")
</template>
