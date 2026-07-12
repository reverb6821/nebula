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
      <!-- Icona dinamica -->
      <EmptyMedia v-if="icon" variant="icon">
        <component :is="icon" />
      </EmptyMedia>
      
      <!-- Titolo -->
      <EmptyTitle v-if="title || $slots.title">
        <slot name="title">{{ title }}</slot>
      </EmptyTitle>
      
      <!-- Descrizione -->
      <EmptyDescription v-if="description || $slots.description">
        <slot name="description">{{ description }}</slot>
      </EmptyDescription>
    </EmptyHeader>

    <!-- Contenuto/Azione Opzionale -->
    <EmptyContent v-if="actionLabel || $slots.default">
      <slot>
        <SharedButton variant="outline" size="sm" @click="$emit('action')">
          {{ actionLabel }}
        </SharedButton>
      </slot>
    </EmptyContent>
  </Empty>
</template>