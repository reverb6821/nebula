<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template lang="pug">
div(class="rounded-lg border border-border bg-card p-4")
  header(class="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground") {{ title }}
  slot
</template>