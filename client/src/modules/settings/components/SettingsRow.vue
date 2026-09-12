<script setup lang="ts">
const props = defineProps<{
  label: string
  hint?: string
}>()

const labelId = `settings-row-${Math.random().toString(36).slice(2, 9)}`
</script>

<template lang="pug">
div(class="flex items-center justify-between gap-8")
  div
    p(:id="labelId" class="text-sm font-medium text-foreground") {{ label }}
    p(v-if="hint" class="text-xs text-muted-foreground") {{ hint }}
  slot(:label-id="labelId")
</template>