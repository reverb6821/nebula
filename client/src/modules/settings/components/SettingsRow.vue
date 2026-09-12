<script setup lang="ts">
// Genera un id univoco per la label, esposto ai figli via scoped slot
// così ogni controllo (switch/select/gruppo bottoni) può collegarsi con
// aria-labelledby — prima l'etichetta era un <p> scollegato da
// qualunque cosa, uno screen reader in focus sul controllo non sentiva
// mai a cosa si riferisse.
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