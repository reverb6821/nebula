<script setup lang="ts">
import { FlexRender, useTable } from '@tanstack/vue-table'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useI18n } from 'vue-i18n'
import type { Process, SortDir, SortKey } from '@/types/process'
import { processTableFeatures } from '../utils/processColumns'

type Features = typeof processTableFeatures

const props = defineProps<{
  columns: ColumnDef<Features, Process, unknown>[]
  data: Process[]
  selectedPid: number | null
  pendingPids: Set<number>
  sortKey?: SortKey
  sortDir?: SortDir
}>()

const { t } = useI18n()

// aria-sort sull'intestazione della colonna ordinata (accessorKey = SortKey)
function ariaSort(columnId: string): 'ascending' | 'descending' | undefined {
  if (!props.sortKey || columnId !== props.sortKey) return undefined
  return props.sortDir === 'asc' ? 'ascending' : 'descending'
}

const emit = defineEmits<{ select: [pid: number] }>()

const table = useTable<Features, Process>({
  features: processTableFeatures,
  get data() { return props.data },
  get columns() { return props.columns },
  getRowId: (row) => String(row.pid),
})
</script>

<template lang="pug">
Table(class="text-13 [&_td]:font-mono")
  TableHeader(class="[&_tr]:border-b-0")
    TableRow(
      v-for="headerGroup in table.getHeaderGroups()"
      :key="headerGroup.id"
      class="hover:bg-transparent"
    )
      TableHead(
        v-for="header in headerGroup.headers"
        :key="header.id"
        :aria-sort="ariaSort(header.column.id)"
        class="sticky top-0 z-10 h-auto border-b border-white/8 bg-card px-3 py-2.5 text-xs font-semibold whitespace-nowrap text-muted-foreground last:w-full"
      )
        FlexRender(v-if="!header.isPlaceholder" :header="header")

  TableBody
    TableRow(
      v-for="row in table.getRowModel().rows"
      :key="row.id"
      tabindex="0"
      role="row"
      :aria-selected="selectedPid === row.original.pid"
      class="cursor-pointer border-b-0 outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset"
      :class="[selectedPid === row.original.pid ? 'bg-primary/25 hover:bg-primary/25' : 'hover:bg-white/3', pendingPids.has(row.original.pid) ? 'opacity-50' : '']"
      @click="emit('select', row.original.pid)"
      @keydown.enter="emit('select', row.original.pid)"
      @keydown.space.prevent="emit('select', row.original.pid)"
    )
      TableCell(
        v-for="cell in row.getAllCells()"
        :key="cell.id"
        class="border-b border-white/4 px-3 py-[9px] whitespace-nowrap"
      )
        FlexRender(:cell="cell")

    TableRow(v-if="table.getRowModel().rows.length === 0" class="hover:bg-transparent")
      TableCell(:colspan="columns.length" class="h-24 text-center font-sans! text-muted-foreground") {{ t('processes.noMatch') }}
</template>
