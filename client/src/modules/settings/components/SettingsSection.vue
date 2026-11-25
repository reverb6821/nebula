<script setup lang="ts">
// Gruppo preferenze GNOME: titolo 14px/700 + boxed list (righe separate).
defineProps<{ title: string }>()

const titleId = `settings-section-${Math.random().toString(36).slice(2, 9)}`
</script>

<template lang="pug">
section(:aria-labelledby="titleId" class="flex flex-col gap-2.5")
  h2(:id="titleId" class="pl-1 text-sm font-bold text-group-foreground") {{ title }}
  div(class="overflow-hidden rounded-lg border border-border bg-card [&>*+*]:border-t [&>*+*]:border-border")
    slot
</template>
