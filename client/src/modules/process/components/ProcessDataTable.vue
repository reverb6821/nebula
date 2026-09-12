<script setup lang="ts">
import { FlexRender, useTable } from '@tanstack/vue-table'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { Process } from '@/types/process'
import { processTableFeatures } from '../utils/processColumns'

type Features = typeof processTableFeatures

const props = defineProps<{
  columns: ColumnDef<Features, Process, any>[]
  data: Process[]
  selectedPid: number | null
  pendingPids: Set<number>
}>()

const emit = defineEmits<{ select: [pid: number] }>()

const table = useTable<Features, Process>({
  features: processTableFeatures,
  get data() { return props.data },
  get columns() { return props.columns },
  getRowId: (row) => String(row.pid),
})
</script>

<template lang="pug">
Table(class="font-mono text-[11px]")
  TableHeader
    TableRow(
      v-for="headerGroup in table.getHeaderGroups()"
      :key="headerGroup.id"
      class="bg-muted hover:bg-muted"
    )
      TableHead(
        v-for="header in headerGroup.headers"
        :key="header.id"
        class="h-7 px-2 py-1 font-semibold text-foreground"
      )
        FlexRender(v-if="!header.isPlaceholder" :header="header")

  TableBody
    TableRow(
      v-for="row in table.getRowModel().rows"
      :key="row.id"
      tabindex="0"
      role="row"
      :aria-selected="selectedPid === row.original.pid"
      class="cursor-pointer border-border/60 outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset"
      :class="[selectedPid === row.original.pid ? 'bg-primary/15 text-foreground hover:bg-primary/15' : 'hover:bg-accent', pendingPids.has(row.original.pid) ? 'opacity-50' : '']"
      @click="emit('select', row.original.pid)"
      @keydown.enter="emit('select', row.original.pid)"
      @keydown.space.prevent="emit('select', row.original.pid)"
    )
      TableCell(v-for="cell in row.getAllCells()" :key="cell.id" class="px-2 py-1")
        FlexRender(:cell="cell")

    TableRow(v-if="table.getRowModel().rows.length === 0")
      TableCell(:colspan="columns.length" class="h-24 text-center text-muted-foreground") Nessun processo corrisponde alla ricerca.
</template>