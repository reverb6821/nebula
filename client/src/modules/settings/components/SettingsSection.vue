<script setup lang="ts">
import { Separator } from '@/components/ui/separator'

defineProps<{ title: string }>()
</script>

<template>
  <section class="space-y-6">
    <div>
      <h2 class="text-xs font-semibold uppercase tracking-widest text-zinc-600">
        {{ title }}
      </h2>
      <Separator class="mt-2 bg-zinc-800" />
    </div>
    <slot />
  </section>
</template>