<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

// Riga di BoxedList: prefix (icona/pallino), titolo + sottotitolo, suffix
// (azioni). min-height 64px, padding 12px 12px 12px 18px dal design.
const props = defineProps<{
  title?: string
  subtitle?: string
  mono?: boolean
  class?: HTMLAttributes['class']
}>()
</script>

<template lang="pug">
div(:class="cn('flex min-h-16 flex-wrap items-center gap-3.5 py-3 pr-3 pl-[18px]', props.class)")
  slot(name="prefix")
  div(class="flex min-w-0 flex-1 flex-col gap-0.5")
    slot(name="title")
      span(
        v-if="title"
        class="truncate font-semibold"
        :class="mono ? 'font-mono text-13' : undefined"
      ) {{ title }}
    slot(name="subtitle")
      span(v-if="subtitle" class="truncate text-xs text-muted-foreground") {{ subtitle }}
  slot
  div(v-if="$slots.suffix" class="flex shrink-0 items-center gap-1.5")
    slot(name="suffix")
</template>
