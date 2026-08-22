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

// Nebula è dark-only, quindi niente varianti dark:. Ogni stato usa il
// token semantico corrispondente (destructive/success/warning) definito
// in main.css — nessun colore hardcoded qui.
const variantClass = computed(() => {
  switch (props.variant) {
    case 'destructive':
      return 'border-destructive/40 text-destructive [&>svg]:text-destructive'
    case 'success':
      return 'border-success/40 text-success [&>svg]:text-success'
    case 'warning':
      return 'border-warning/40 text-warning [&>svg]:text-warning'
    case 'default':
    default:
      return 'border-border text-foreground [&>svg]:text-primary'
  }
})
</script>

<template>
  <Alert
    :variant="variant === 'destructive' ? 'destructive' : 'default'"
    :class="[
      variantClass,
      // Contenitore → rounded-lg = 16px (DESIGN.md rounded.lg)
      'rounded-lg bg-card',
    ]"
  >
    <!-- Icona di stato: ridondante col colore/testo, quindi decorativa -->
    <component :is="icon" class="h-4 w-4" aria-hidden="true" />

    <AlertTitle v-if="title || $slots.title" class="text-foreground">
      <slot name="title">{{ title }}</slot>
    </AlertTitle>

    <AlertDescription
      v-if="description || $slots.default"
      class="text-muted-foreground"
    >
      <slot>{{ description }}</slot>
    </AlertDescription>
  </Alert>
</template>