<script setup lang="ts">
import { computed } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertCircle,
  CheckCircle2,
  Info,
  XCircle
} from '@lucide/vue'

type AlertVariant = 'default' | 'destructive' | 'success' | 'warning'

interface Props {
  variant?: AlertVariant
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

const icon = computed(() => {
  switch (props.variant) {
    case 'destructive':
      return XCircle
    case 'warning':
      return AlertCircle
    case 'success':
      return CheckCircle2
    case 'default':
    default:
      return Info
  }
})

const variantClass = computed(() => {
  switch (props.variant) {
    case 'destructive':
      return 'border-destructive/30 bg-destructive-surface text-destructive-text [&>svg]:text-destructive-text'
    case 'success':
      return 'border-success/20 bg-success/10 text-success [&>svg]:text-success'
    case 'warning':
      return 'border-warning/20 bg-warning-surface text-warning-text [&>svg]:text-warning'
    case 'default':
    default:
      return 'border-border bg-card text-foreground [&>svg]:text-primary-text'
  }
})
</script>

<template lang="pug">
Alert(
  :variant="variant === 'destructive' ? 'destructive' : 'default'"
  :class="[variantClass, 'rounded-lg border']"
)
  component(:is="icon" class="size-[18px]" aria-hidden="true")

  AlertTitle(v-if="title || $slots.title" class="text-sm font-bold")
    slot(name="title") {{ title }}

  AlertDescription(
    v-if="description || $slots.default"
    class="text-muted-foreground"
  )
    slot {{ description }}
</template>