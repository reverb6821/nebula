<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(defineProps<{
  icon: Component
  label: string
  value: string
  sub?: string
  accent?: string
}>(), {
  accent: 'text-zinc-100',
})
</script>

<template>
  <div class="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3">
    <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
      <component :is="icon" class="h-3 w-3" />
      {{ label }}
    </div>
    <div class="mt-1 font-mono text-xl" :class="accent">{{ value }}</div>
    <div v-if="sub" class="text-[10px] text-zinc-600">{{ sub }}</div>
  </div>
</template>