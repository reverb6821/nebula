<script setup lang="ts">
import { SharedPanel } from '@/components/shared'

defineProps<{ title: string }>()
</script>

<template lang="pug">
SharedPanel(class="transition-shadow hover:border-primary/35 hover:shadow-cyber-signal")
  template(#header)
    div(class="cyber-label") {{ title }}
  slot
</template>