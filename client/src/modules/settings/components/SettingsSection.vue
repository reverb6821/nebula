<script setup lang="ts">
import { Separator } from '@/components/ui/separator'

defineProps<{ title: string }>()
</script>

<template lang="pug">
section(class="space-y-6")
  div
    h2(class="cyber-label") {{ title }}
    Separator(class="mt-2 bg-border")
  slot
</template>