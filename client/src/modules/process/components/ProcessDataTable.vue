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

<template lang="pug">
Table(class="font-mono text-[11px]")
  TableHeader
    //-
      bg-lime-700 / text-zinc-950 → bg-muted / text-foreground: erano
      completamente fuori palette (probabilmente un residuo di
      template/demo), non un accento del tema Nebula.
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
    //-
      bg-cyan-800/70 → bg-primary/15: stessa convenzione di
      "selezionato" usata altrove nell'app (tab attivi, voci filtro
      attive). Aggiunto tabindex/keydown perché prima la riga era
      selezionabile solo col mouse (@click su <tr> senza alcun
      supporto tastiera).
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