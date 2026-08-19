<script setup lang="ts">
import { FlexRender, useTable } from '@tanstack/vue-table'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { Process } from '@/types/process'
import { processTableFeatures } from '../utils/processColumns'

// Stesso riferimento usato in processColumns.ts per tipare le ColumnDef:
// deve essere lo stesso oggetto, non un secondo tableFeatures({}) locale,
// altrimenti i generici Features non combaciano e torna l'errore di prima.
type Features = typeof processTableFeatures

const props = defineProps<{
  columns: ColumnDef<Features, Process, any>[]
  data: Process[]
  selectedPid: number | null
  pendingPids: Set<number>
}>()

const emit = defineEmits<{ select: [pid: number] }>()

// Generici espliciti: senza <Features, Process>, v9 a volte non riesce a
// inferire TFeatures dall'oggetto opzioni e ripiega su tipi deboli (è
// documentato anche nel loro blog sulle performance del type-checking) —
// sintomo tipico: Row_Core<{}, Process> invece di Row<Features, Process>,
// con getVisibleCells() che sparisce e i parametri diventano impliciti any.
const table = useTable<Features, Process>({
  features: processTableFeatures,
  get data() { return props.data },
  get columns() { return props.columns },
  getRowId: (row) => String(row.pid),
})
</script>

<template>
  <Table class="font-mono text-[11px]">
    <TableHeader>
      <TableRow
        v-for="headerGroup in table.getHeaderGroups()"
        :key="headerGroup.id"
        class="bg-lime-700 hover:bg-lime-700"
      >
        <TableHead
          v-for="header in headerGroup.headers"
          :key="header.id"
          class="h-7 px-2 py-1 font-semibold text-zinc-950"
        >
          <FlexRender v-if="!header.isPlaceholder" :header="header" />
        </TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      <TableRow
        v-for="row in table.getRowModel().rows"
        :key="row.id"
        class="cursor-pointer border-zinc-900/60"
        :class="[
          selectedPid === row.original.pid
            ? 'bg-cyan-800/70 text-zinc-100 hover:bg-cyan-800/70'
            : 'hover:bg-white/[0.03]',
          pendingPids.has(row.original.pid) ? 'opacity-50' : '',
        ]"
        @click="emit('select', row.original.pid)"
      >
        <TableCell v-for="cell in row.getAllCells()" :key="cell.id" class="px-2 py-1">
          <FlexRender :cell="cell" />
        </TableCell>
      </TableRow>

      <TableRow v-if="table.getRowModel().rows.length === 0">
        <TableCell :colspan="columns.length" class="h-24 text-center text-zinc-600">
          Nessun processo corrisponde alla ricerca.
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>