<script setup lang="ts">
defineProps<{
  label: string
  hint?: string
}>()
</script>

<template>
  <div class="flex items-center justify-between gap-8">
    <div>
      <p class="text-sm font-medium text-zinc-200">{{ label }}</p>
      <p v-if="hint" class="text-xs text-zinc-500">{{ hint }}</p>
    </div>
    <slot />
  </div>
</template>