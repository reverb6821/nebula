<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

// Lista "boxed" stile GNOME Settings: card arrotondata, righe separate
// da border-t (gestito da BoxedListRow). Titolo di gruppo opzionale sopra.
const props = defineProps<{
  title?: string
  description?: string
  class?: HTMLAttributes['class']
  as?: string
}>()
</script>

<template lang="pug">
section(class="flex flex-col gap-2.5" :aria-label="title")
  div(v-if="title || $slots.header" class="flex items-center gap-3 px-0.5")
    div(class="flex min-w-0 flex-1 flex-col")
      h2(v-if="title" class="text-sm font-bold text-group-foreground") {{ title }}
      p(v-if="description" class="text-13 text-muted-foreground") {{ description }}
    slot(name="header")
  component(
    :is="as ?? 'div'"
    :class="cn('overflow-hidden rounded-lg border border-border bg-card [&>*+*]:border-t [&>*+*]:border-border', props.class)"
  )
    slot
</template>
