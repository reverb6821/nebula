<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'

// Conferma per azioni distruttive (End process, Remove container, Delete image).
defineProps<{
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
}>()

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ confirm: [] }>()
</script>

<template lang="pug">
AlertDialog(v-model:open="open")
  AlertDialogContent(class="rounded-lg border-border bg-popover")
    AlertDialogHeader
      AlertDialogTitle {{ title }}
      AlertDialogDescription {{ description }}
    AlertDialogFooter
      AlertDialogCancel(:class="buttonVariants({ variant: 'secondary' })") {{ cancelLabel }}
      AlertDialogAction(:class="buttonVariants({ variant: 'destructive' })" @click="emit('confirm')") {{ confirmLabel }}
</template>
