<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'

defineProps<{ title: string }>()
</script>

<template>
  <div class="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
    <header class="mb-3 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
      <ChevronDown class="h-3.5 w-3.5" />
      {{ title }}
    </header>
    <slot />
  </div>
</template>