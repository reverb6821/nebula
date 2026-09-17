<script setup lang="ts">
const props = defineProps<{
  label: string
  hint?: string
}>()

const labelId = `settings-row-${Math.random().toString(36).slice(2, 9)}`
</script>

<template lang="pug">
div(class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8")
  div(class="min-w-0")
    p(:id="labelId" class="text-sm font-medium text-foreground") {{ label }}
    p(v-if="hint" class="text-xs text-muted-foreground") {{ hint }}
  div(class="w-full shrink-0 sm:w-auto")
    slot(:label-id="labelId")
</template>