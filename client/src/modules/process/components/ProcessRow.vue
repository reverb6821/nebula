<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { SharedButton } from '@/components/shared'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
  totalPages: number
}>()

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [size: number]
}>()

const pageSizeOptions = [25, 50, 100, 200]

const rangeLabel = computed(() => {
  if (props.total === 0) return '0 of 0'
  const start = (props.page - 1) * props.pageSize + 1
  const end = Math.min(props.page * props.pageSize, props.total)
  return `${start}–${end} of ${props.total}`
})
</script>

<template>
  <div class="flex items-center justify-between border-t border-zinc-800 bg-zinc-950 px-2 py-1.5 font-mono text-[11px]">
    <div class="flex items-center gap-2">
      <span class="text-[10px] uppercase tracking-widest text-zinc-600">Rows</span>
      <select
        :value="pageSize"
        class="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-zinc-300 outline-none focus:border-zinc-600"
        @change="emit('update:pageSize', Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>

    <div class="flex items-center gap-3">
      <span class="text-zinc-600 tabular-nums">{{ rangeLabel }}</span>

      <div class="flex items-center gap-1">
        <SharedButton
          variant="ghost"
          size="icon"
          class="h-6 w-6"
          :disabled="page <= 1"
          @click="emit('update:page', page - 1)"
        >
          <ChevronLeft class="h-3.5 w-3.5 text-zinc-500" />
        </SharedButton>

        <span class="min-w-[3.5rem] text-center text-zinc-400 tabular-nums">
          {{ page }} / {{ totalPages }}
        </span>

        <SharedButton
          variant="ghost"
          size="icon"
          class="h-6 w-6"
          :disabled="page >= totalPages"
          @click="emit('update:page', page + 1)"
        >
          <ChevronRight class="h-3.5 w-3.5 text-zinc-500" />
        </SharedButton>
      </div>
    </div>
  </div>
</template>