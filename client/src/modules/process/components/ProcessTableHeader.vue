<script setup lang="ts">
import { computed } from 'vue'
import { ChevronUp, ChevronDown, ChevronsUpDown } from '@lucide/vue'
import type { SortKey, SortDir } from '@/types/process'

const props = defineProps<{
  label: string
  sortKey?: SortKey
  activeSortKey: SortKey
  sortDir: SortDir
  align?: 'left' | 'right'
}>()

const emit = defineEmits<{ sort: [key: SortKey] }>()

const isActive = computed(() => !!props.sortKey && props.activeSortKey === props.sortKey)

// aria-sort va sul <th>, per convenzione ARIA per intestazioni ordinabili.
const ariaSort = computed<'ascending' | 'descending' | 'none' | undefined>(() => {
  if (!props.sortKey) return undefined
  if (!isActive.value) return 'none'
  return props.sortDir === 'asc' ? 'ascending' : 'descending'
})

function onSort() {
  if (props.sortKey) emit('sort', props.sortKey)
}
</script>

<template lang="pug">
th(
  class="cyber-label select-none py-2"
  :class="align === 'right' ? 'text-right' : 'text-left'"
  :aria-sort="ariaSort"
)
  button(
    v-if="sortKey"
    type="button"
    class="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
    :class="[align === 'right' && 'flex-row-reverse']"
    @click="onSort"
  )
    | {{ label }}
    ChevronUp(v-if="isActive && sortDir === 'asc'" class="h-3 w-3 text-primary" aria-hidden="true")
    ChevronDown(v-else-if="isActive && sortDir === 'desc'" class="h-3 w-3 text-primary" aria-hidden="true")
    ChevronsUpDown(v-else class="h-3 w-3 opacity-30" aria-hidden="true")

  div(v-else class="inline-flex items-center gap-1 text-muted-foreground/70" :class="align === 'right' && 'flex-row-reverse'") {{ label }}
</template>