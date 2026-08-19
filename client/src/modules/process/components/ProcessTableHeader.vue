<script setup lang="ts">
import { ChevronUp, ChevronDown, ChevronsUpDown } from '@lucide/vue'
import type { SortKey, SortDir } from '@/types/process'

defineProps<{
  label: string
  sortKey?: SortKey
  activeSortKey: SortKey
  sortDir: SortDir
  align?: 'left' | 'right'
}>()

const emit = defineEmits<{ sort: [key: SortKey] }>()
</script>

<template>
  <th
    :class="[
      'select-none py-2 text-[10px] font-semibold uppercase tracking-widest',
      align === 'right' ? 'text-right' : 'text-left',
      sortKey ? 'cursor-pointer text-zinc-500 hover:text-zinc-300' : 'text-zinc-700',
    ]"
    @click="sortKey && emit('sort', sortKey)"
  >
    <div :class="['inline-flex items-center gap-1', align === 'right' && 'flex-row-reverse']">
      {{ label }}
      <template v-if="sortKey">
        <ChevronUp
          v-if="activeSortKey === sortKey && sortDir === 'asc'"
          class="h-3 w-3 text-indigo-400"
        />
        <ChevronDown
          v-else-if="activeSortKey === sortKey && sortDir === 'desc'"
          class="h-3 w-3 text-indigo-400"
        />
        <ChevronsUpDown v-else class="h-3 w-3 opacity-30" />
      </template>
    </div>
  </th>
</template>