<script setup lang="ts">
import { computed } from 'vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  XCircle 
} from '@lucide/vue'

// Definiamo i tipi accettati da shadcn-vue per l'alert
type AlertVariant = 'default' | 'destructive' | 'success' | 'warning'

interface Props {
  variant?: AlertVariant
  title?: string
  description?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})

// Mappatura delle icone in base allo stato
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
</script>

<template>
  <Alert :variant="variant === 'success' || variant === 'warning' ? 'default' : variant" :class="[
    // Classi custom per gestire gli stati non nativi di shadcn (success e warning)
    variant === 'success' && 'border-emerald-500/50 text-emerald-600 dark:border-emerald-500 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-500',
    variant === 'warning' && 'border-amber-500/50 text-amber-600 dark:border-amber-500 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-500'
  ]">
    <!-- Icona dinamica -->
    <component :is="icon" class="h-4 w-4" />
    
    <!-- Titolo -->
    <AlertTitle v-if="title || $slots.title">
      <slot name="title">{{ title }}</slot>
    </AlertTitle>
    
    <!-- Descrizione -->
    <AlertDescription v-if="description || $slots.default">
      <slot>{{ description }}</slot>
    </AlertDescription>
  </Alert>
</template>