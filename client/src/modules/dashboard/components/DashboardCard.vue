<script setup lang="ts">
import { SharedPanel } from '@/components/shared'

defineProps<{ title: string }>()
</script>

<template lang="pug">
SharedPanel(class="hover:border-primary/35")
  template(#header)
    div(class="cyber-label") {{ title }}
  slot
</template>