<script setup lang="ts">
import { computed } from 'vue'
import type { Process } from '@/types/process'
import { resolveProcessIcon } from '../composables/useProcessIcon'

const props = defineProps<{ process: Process }>()

const icon = computed(() => resolveProcessIcon(props.process))
</script>

<template>
  <svg
    v-if="icon.kind === 'brand'"
    viewBox="0 0 24 24"
    class="h-3.5 w-3.5 shrink-0"
    :style="{ color: `#${icon.color}` }"
    role="img"
    :aria-label="icon.title"
  >
    <path :d="icon.path" fill="currentColor" />
  </svg>

  <component
    :is="icon.component"
    v-else
    class="h-3.5 w-3.5 shrink-0 text-muted-foreground"
    aria-hidden="true"
  />
</template>