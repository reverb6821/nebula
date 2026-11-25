import { h } from 'vue'
import { tableFeatures } from '@tanstack/vue-table'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowDown } from '@lucide/vue'
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
  R: 'text-success',
  D: 'text-destructive-text',
  Z: 'text-destructive-text',
  T: 'text-caution',
  S: 'text-foreground',
}

const STATUS_FALLBACK = 'text-muted-foreground'

function formatKb(bytes: number): string {
  const kb = bytes / 1024
  if (kb < 1000) return `${Math.round(kb)}K`
  const mb = kb / 1024
  if (mb < 1000) return `${mb.toFixed(1)}M`
  return `${(mb / 1024).toFixed(1)}G`
}

// Arancio (caution) da 15% in su, come nel design.
function cpuColorClass(percent: number): string {
  if (percent >= 15) return 'text-caution'
  return 'text-foreground'
}

// Argomenti del comando senza l'eseguibile, per la colonna Command.
function commandArgs(process: Process): string {
  const cmd = process.cmd.trim()
  if (!cmd) return ''
  const firstSpace = cmd.indexOf(' ')
  return firstSpace === -1 ? '' : cmd.slice(firstSpace + 1)
}

// L'ordinamento resta nello store (sortKey/sortDir) — è lo stesso stato che
// guida anche paginazione e filtri, quindi non usiamo rowSortingFeature di
// TanStack: gli header sono solo bottoni che notificano il click.
export function createProcessColumns(
  sortKey: SortKey,
  sortDir: SortDir,
  onSort: (key: SortKey) => void,
): ColumnDef<Features, Process, unknown>[] {
  function sortableHeader(label: string, key: SortKey, align: 'left' | 'right' = 'right') {
    return () => {
      const active = sortKey === key
      return h(
        'button',
        {
          type: 'button',
          class: `${align === 'right' ? 'ml-auto flex w-fit' : 'inline-flex'} items-center gap-1 ${active ? 'text-primary-text' : 'hover:text-foreground'}`,
          onClick: () => onSort(key),
        },
        [
          h('span', label),
          active
            ? h(ArrowDown, { class: `size-3 ${sortDir === 'asc' ? 'rotate-180' : ''}`, 'aria-hidden': 'true' })
            : null,
        ],
      )
    }
  }

  return [
    {
      accessorKey: 'pid',
      header: sortableHeader('PID', 'pid'),
      cell: ({ row }) => h('span', { class: 'block text-right text-group-foreground' }, row.original.pid),
    },
    {
      accessorKey: 'user',
      header: sortableHeader('User', 'user', 'left'),
      cell: ({ row }) => h('span', { class: 'truncate font-sans text-primary-text' }, row.original.user),
    },
    {
      accessorKey: 'pri',
      header: sortableHeader('PRI', 'pri'),
      cell: ({ row }) => h('span', { class: 'block text-right' }, row.original.pri),
    },
    {
      accessorKey: 'ni',
      header: sortableHeader('NI', 'ni'),
      cell: ({ row }) =>
        h(
          'span',
          { class: `block text-right ${row.original.ni < 0 ? 'text-destructive-text' : ''}` },
          row.original.ni,
        ),
    },
    {
      accessorKey: 'virtBytes',
      header: sortableHeader('VIRT', 'virtBytes'),
      cell: ({ row }) => h('span', { class: 'block text-right text-muted-foreground' }, formatKb(row.original.virtBytes)),
    },
    {
      accessorKey: 'resBytes',
      header: sortableHeader('RES', 'resBytes'),
      cell: ({ row }) => h('span', { class: 'block text-right' }, formatKb(row.original.resBytes)),
    },
    {
      accessorKey: 'shrBytes',
      header: sortableHeader('SHR', 'shrBytes'),
      cell: ({ row }) => h('span', { class: 'block text-right text-muted-foreground' }, formatKb(row.original.shrBytes)),
    },
    {
      id: 'status',
      header: () => h('span', { class: 'block' }, 'S'),
      cell: ({ row }) =>
        h(
          'span',
          { class: `block ${STATUS_COLOR[row.original.status] ?? STATUS_FALLBACK}` },
          row.original.status,
        ),
    },
    {
      accessorKey: 'cpuPercent',
      header: sortableHeader('CPU%', 'cpuPercent'),
      cell: ({ row }) =>
        h(
          'span',
          { class: `block text-right font-semibold ${cpuColorClass(row.original.cpuPercent)}` },
          row.original.cpuPercent.toFixed(1),
        ),
    },
    {
      accessorKey: 'memPercent',
      header: sortableHeader('MEM%', 'memPercent'),
      cell: ({ row }) => h('span', { class: 'block text-right' }, row.original.memPercent.toFixed(1)),
    },
    {
      id: 'cpuTime',
      header: () => h('span', { class: 'block text-right' }, 'TIME+'),
      cell: ({ row }) => h('span', { class: 'block text-right text-muted-foreground' }, row.original.cpuTime),
    },
    {
      accessorKey: 'name',
      header: sortableHeader('Command', 'name', 'left'),
      cell: ({ row }) =>
        h('span', { class: 'flex max-w-[520px] min-w-0 items-center gap-2.5', title: row.original.cmd || row.original.name }, [
          h('span', { class: 'inline-flex size-[22px] shrink-0 items-center justify-center rounded-[6px] bg-white/8' }, [
            h(ProcessIcon, { process: row.original }),
          ]),
          h('span', { class: 'shrink-0 font-sans font-semibold' }, row.original.name),
          h('span', { class: 'truncate text-xs text-muted-foreground' }, commandArgs(row.original)),
        ]),
    },
  ]
}