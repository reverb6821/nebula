import { h } from 'vue'
import { tableFeatures } from '@tanstack/vue-table'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown } from '@lucide/vue'
import type { Process, SortKey, SortDir } from '@/types/process'
import ProcessIcon from '../components/ProcessIcon.vue'

// v9 richiede di dichiarare esplicitamente le feature usate dalla tabella.
// Qui è vuoto apposta: sort, filtri e paginazione restano nello store
// Pinia (vedi store.ts), la tabella serve solo a iterare righe/colonne.
// Va importato anche da ProcessDataTable.vue: stesso riferimento, non
// ricrearlo lì con un secondo tableFeatures({}) o i generici non combaciano.
export const processTableFeatures = tableFeatures({})

type Features = typeof processTableFeatures

const STATUS_COLOR: Record<string, string> = {
  R: 'text-emerald-400',
  D: 'text-red-400',
  Z: 'text-red-500',
  T: 'text-amber-400',
  S: 'text-zinc-500',
}

function formatKb(bytes: number): string {
  const kb = bytes / 1024
  if (kb < 1000) return `${Math.round(kb)}K`
  const mb = kb / 1024
  if (mb < 1000) return `${mb.toFixed(1)}M`
  return `${(mb / 1024).toFixed(1)}G`
}

function cpuColorClass(percent: number): string {
  if (percent >= 50) return 'text-red-400'
  if (percent >= 15) return 'text-amber-300'
  return 'text-zinc-300'
}

// L'ordinamento resta nello store (sortKey/sortDir) — è lo stesso stato che
// guida anche paginazione e filtri, quindi non usiamo rowSortingFeature di
// TanStack: gli header sono solo bottoni che notificano il click.
export function createProcessColumns(
  sortKey: SortKey,
  sortDir: SortDir,
  onSort: (key: SortKey) => void,
): ColumnDef<Features, Process, any>[] {
  function sortableHeader(label: string, key: SortKey, align: 'left' | 'right' = 'right') {
    return () =>
      h(
        'button',
        {
          type: 'button',
          class: `flex items-center gap-0.5 ${align === 'right' ? 'ml-auto' : ''}`,
          onClick: () => onSort(key),
        },
        [
          h('span', label),
          sortKey === key
            ? h(ArrowUpDown, { class: `h-2.5 w-2.5 ${sortDir === 'asc' ? 'rotate-180' : ''}` })
            : null,
        ],
      )
  }

  return [
    {
      accessorKey: 'pid',
      header: sortableHeader('PID', 'pid'),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, row.original.pid),
    },
    {
      accessorKey: 'user',
      header: sortableHeader('USER', 'user', 'left'),
      cell: ({ row }) => h('span', { class: 'truncate text-sky-300' }, row.original.user),
    },
    {
      accessorKey: 'pri',
      header: sortableHeader('PRI', 'pri'),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, row.original.pri),
    },
    {
      accessorKey: 'ni',
      header: sortableHeader('NI', 'ni'),
      cell: ({ row }) =>
        h(
          'span',
          { class: `tabular-nums ${row.original.ni < 0 ? 'text-red-400' : ''}` },
          row.original.ni,
        ),
    },
    {
      accessorKey: 'virtBytes',
      header: sortableHeader('VIRT', 'virtBytes'),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatKb(row.original.virtBytes)),
    },
    {
      accessorKey: 'resBytes',
      header: sortableHeader('RES', 'resBytes'),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatKb(row.original.resBytes)),
    },
    {
      accessorKey: 'shrBytes',
      header: sortableHeader('SHR', 'shrBytes'),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, formatKb(row.original.shrBytes)),
    },
    {
      id: 'status',
      header: () => h('span', { class: 'block text-center' }, 'S'),
      cell: ({ row }) =>
        h(
          'span',
          { class: `block text-center ${STATUS_COLOR[row.original.status] ?? 'text-zinc-500'}` },
          row.original.status,
        ),
    },
    {
      accessorKey: 'cpuPercent',
      header: sortableHeader('CPU%', 'cpuPercent'),
      cell: ({ row }) =>
        h(
          'span',
          { class: `tabular-nums ${cpuColorClass(row.original.cpuPercent)}` },
          row.original.cpuPercent.toFixed(1),
        ),
    },
    {
      accessorKey: 'memPercent',
      header: sortableHeader('MEM%', 'memPercent'),
      cell: ({ row }) => h('span', { class: 'tabular-nums' }, row.original.memPercent.toFixed(1)),
    },
    {
      id: 'cpuTime',
      header: () => h('span', { class: 'block text-right' }, 'TIME+'),
      cell: ({ row }) => h('span', { class: 'block text-right tabular-nums' }, row.original.cpuTime),
    },
    {
      accessorKey: 'name',
      header: sortableHeader('COMMAND', 'name', 'left'),
      cell: ({ row }) =>
        h('span', { class: 'flex min-w-0 items-center gap-1.5' }, [
          h(ProcessIcon, { process: row.original }),
          h('span', { class: 'truncate text-lime-400' }, row.original.cmd || row.original.name),
        ]),
    },
  ]
}