<script setup lang="ts">
import type { Component } from 'vue'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { SharedButton } from '@/components/shared'

interface Props {
  icon?: Component
  title?: string
  description?: string
  actionLabel?: string
}

defineProps<Props>()
defineEmits<{
  (e: 'action'): void
}>()
</script>

<template lang="pug">
Empty
  EmptyHeader
    EmptyMedia(
      v-if="icon"
      variant="icon"
      class="rounded-full border border-dashed border-primary/30 bg-card text-muted-foreground shadow-cyber-panel"
    )
      component(:is="icon" aria-hidden="true")

    span(class="cyber-label mb-1 block") No signal // 0 results

    EmptyTitle(v-if="title || $slots.title" class="text-foreground")
      slot(name="title") {{ title }}

    EmptyDescription(
      v-if="description || $slots.description"
      class="text-muted-foreground"
    )
      slot(name="description") {{ description }}

  EmptyContent(v-if="actionLabel || $slots.default")
    slot
      SharedButton(variant="outline" size="sm" @click="$emit('action')") {{ actionLabel }}
</template>