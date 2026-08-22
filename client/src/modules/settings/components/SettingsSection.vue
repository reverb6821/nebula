<script setup lang="ts">
import { Separator } from '@/components/ui/separator'

defineProps<{ title: string }>()
</script>

<template>
  <section class="space-y-6">
    <div>
      <h2 class="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {{ title }}
      </h2>
      <Separator class="mt-2 bg-border" />
    </div>
    <slot />
  </section>
</template>