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

<template>
  <Button
    :variant="variant"
    :size="size"
    :disabled="disabled || loading"
    class="relative inline-flex items-center justify-center gap-2 rounded-xl"
  >
    <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />

    <component
      :is="icon"
      v-else-if="icon"
      class="h-4 w-4 shrink-0"
    />

    <slot>
      <span v-if="label">{{ label }}</span>
    </slot>
  </Button>
</template>