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

<template>
  <Empty>
    <EmptyHeader>
      <!-- Icona dinamica: puramente decorativa, il titolo porta il senso -->
      <EmptyMedia
        v-if="icon"
        variant="icon"
        class="rounded-md border border-border bg-card text-muted-foreground"
      >
        <component :is="icon" aria-hidden="true" />
      </EmptyMedia>

      <EmptyTitle v-if="title || $slots.title" class="text-foreground">
        <slot name="title">{{ title }}</slot>
      </EmptyTitle>

      <EmptyDescription
        v-if="description || $slots.description"
        class="text-muted-foreground"
      >
        <slot name="description">{{ description }}</slot>
      </EmptyDescription>
    </EmptyHeader>

    <EmptyContent v-if="actionLabel || $slots.default">
      <slot>
        <SharedButton variant="outline" size="sm" @click="$emit('action')">
          {{ actionLabel }}
        </SharedButton>
      </slot>
    </EmptyContent>
  </Empty>
</template>