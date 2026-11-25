<script setup lang="ts">
// Voce di legenda inline: trattino colorato 10x3, label, valore mono.
defineProps<{
  label: string
  value: string
  colorClass: string
}>()
</script>

<template lang="pug">
span(class="flex items-center gap-1.5 text-13")
  span(class="h-[3px] w-2.5 rounded-sm" :class="colorClass" aria-hidden="true")
  | {{ label }}
  span(class="font-mono") {{ value }}
</template>
