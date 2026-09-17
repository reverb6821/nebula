<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { SharedButton } from '@/components/shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

<template lang="pug">
div(class="flex items-center justify-between border-t border-border bg-background px-2 py-1.5 font-mono text-[11px]")
  div(class="flex items-center gap-2")
    span(id="process-page-size-label" class="cyber-label") Rows
    Select(
      :model-value="String(pageSize)"
      @update:model-value="emit('update:pageSize', Number($event))"
    )
      SelectTrigger(
        size="sm"
        aria-labelledby="process-page-size-label"
        class="h-6 w-16 rounded border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground focus:border-ring focus:ring-ring"
      )
        SelectValue
      SelectContent
        SelectItem(v-for="n in pageSizeOptions" :key="n" :value="String(n)" class="font-mono text-[11px]") {{ n }}

  div(class="flex items-center gap-3")
    span(class="text-muted-foreground tabular-nums") {{ rangeLabel }}

    div(class="flex items-center gap-1")
      SharedButton(
        variant="ghost"
        size="icon"
        class="h-6 w-6"
        :disabled="page <= 1"
        aria-label="Pagina precedente"
        @click="emit('update:page', page - 1)"
      )
        ChevronLeft(class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true")

      span(class="min-w-[3.5rem] text-center text-muted-foreground tabular-nums") {{ page }} / {{ totalPages }}

      SharedButton(
        variant="ghost"
        size="icon"
        class="h-6 w-6"
        :disabled="page >= totalPages"
        aria-label="Pagina successiva"
        @click="emit('update:page', page + 1)"
      )
        ChevronRight(class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true")
</template>