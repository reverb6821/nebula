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
      return 'border-destructive/50 bg-destructive/10 text-destructive [&>svg]:text-destructive'
    case 'success':
      return 'border-success/40 bg-success/5 text-success [&>svg]:text-success'
    case 'warning':
      return 'border-warning/40 bg-warning/5 text-warning [&>svg]:text-warning'
    case 'default':
    default:
      return 'border-border text-foreground [&>svg]:text-primary'
  }
})
</script>

<template lang="pug">
Alert(
  :variant="variant === 'destructive' ? 'destructive' : 'default'"
  :class="[variantClass, 'rounded-lg bg-card']"
)
  component(:is="icon" class="h-4 w-4" aria-hidden="true")

  AlertTitle(v-if="title || $slots.title" class="text-foreground")
    slot(name="title") {{ title }}

  AlertDescription(
    v-if="description || $slots.default"
    class="text-muted-foreground"
  )
    slot {{ description }}
</template>