<script setup lang="ts">
// Riga preferenza (classe .prow del design): label + hint a sinistra,
// controllo a destra; min-height 60px, padding 12px 16px.
defineProps<{
  label: string
  hint?: string
}>()

const labelId = `settings-row-${Math.random().toString(36).slice(2, 9)}`
</script>

<template lang="pug">
div(class="flex min-h-[60px] flex-wrap items-center gap-4 px-4 py-3")
  div(class="flex min-w-0 flex-[1_1_200px] flex-col gap-0.5")
    span(:id="labelId" class="font-medium") {{ label }}
    span(v-if="hint" class="text-13 text-muted-foreground") {{ hint }}
  slot(:label-id="labelId")
</template>
