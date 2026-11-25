<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue'
import { Button } from '@/components/ui/button'

// Banner salute in cima a Overview: giallo se degradato, rosso se ci sono
// alert critici. Valori da source/Main.dc.html (padding 14/18, raggio 12).
defineProps<{
  title: string
  description?: string
  actionLabel: string
  to: string
  critical?: boolean
}>()
</script>

<template lang="pug">
section(
  role="status"
  class="flex flex-wrap items-center gap-4 rounded-lg border px-[18px] py-3.5"
  :class="critical ? 'border-destructive/40 bg-destructive-surface' : 'border-warning/20 bg-warning-surface'"
)
  TriangleAlert(
    class="size-[22px] shrink-0"
    :class="critical ? 'text-destructive-text' : 'text-warning'"
    aria-hidden="true"
  )
  div(class="flex min-w-[220px] flex-1 flex-col gap-0.5")
    strong(class="text-sm" :class="critical ? 'text-destructive-text' : 'text-warning-text'") {{ title }}
    span(v-if="description" :class="critical ? 'text-[#f3c9c6]' : 'text-[#e6dfb3]'") {{ description }}
  Button(as-child :variant="critical ? 'destructive' : 'warning'")
    RouterLink(:to="to") {{ actionLabel }}
</template>
