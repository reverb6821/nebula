<script setup lang="ts">
import { type Component } from 'vue'
import { Button, type ButtonVariants } from '@/components/ui/button'
import { Loader2 } from '@lucide/vue'

interface Props {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  disabled?: boolean
  loading?: boolean
  label?: string
  icon?: Component
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  disabled: false,
  loading: false,
})
</script>

<template lang="pug">
Button(
  :variant="variant"
  :size="size"
  :disabled="disabled || loading"
  :aria-busy="loading"
  class="relative inline-flex items-center justify-center gap-2 rounded-md focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
)
  Loader2(v-if="loading" class="h-4 w-4 animate-spin" aria-hidden="true")

  component(
    v-else-if="icon"
    :is="icon"
    class="h-4 w-4 shrink-0"
    aria-hidden="true"
  )

  slot
    span(v-if="label") {{ label }}
</template>