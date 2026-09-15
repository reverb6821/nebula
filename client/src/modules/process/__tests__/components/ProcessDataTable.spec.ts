import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import type { ColumnDef } from '@tanstack/vue-table'
import ProcessDataTable from '../../components/ProcessDataTable.vue'
import { processTableFeatures } from '../../utils/processColumns.ts'
import type { Process } from '../../../../types/process.ts'

// NOTA: non ho visto processColumns.ts, quindi non conosco la vera forma
// di processTableFeatures (feature custom di TanStack Table v9) né le
// colonne reali create da createProcessColumns(). Le colonne qui sotto
// sono volutamente minimali (solo accessorKey) per verificare la logica
// di ProcessDataTable stessa (selezione, pending, empty state) restando
// il più possibile indipendenti dai dettagli di quel file. Se
// processTableFeatures richiede opzioni/plugin che queste colonne minime
// non soddisfano, questo test fallirà all'import/mount — mandami
// processColumns.ts e lo allineo.

type Features = typeof processTableFeatures
 
const columns: ColumnDef<Features, Process, any>[] = [
  { accessorKey: 'name', header: 'Nome' },
  { accessorKey: 'pid', header: 'PID' },
]
 
function makeProcess(overrides: Partial<Process> = {}): Process {
  return {
    pid: 1,
    ppid: 0,
    user: 'root',
    pri: 20,
    ni: 0,
    status: 'R',
    cpuPercent: 0,
    memPercent: 0,
    cpuTime: '0:00',
    name: 'test',
    cmd: 'test',
    virtBytes: 0,
    resBytes: 0,
    shrBytes: 0,
    ...overrides,
  }
}
 
function mountTable(props: {
  data: Process[]
  selectedPid?: number | null
  pendingPids?: Set<number>
}) {
  return mount(ProcessDataTable, {
    props: {
      columns,
      data: props.data,
      selectedPid: props.selectedPid ?? null,
      pendingPids: props.pendingPids ?? new Set<number>(),
    },
  })
}
 
describe('ProcessDataTable', () => {
  it('renderizza una riga per processo con i valori delle colonne', () => {
    const data = [makeProcess({ pid: 1, name: 'bash' }), makeProcess({ pid: 2, name: 'node' })]
    const wrapper = mountTable({ data })
 
    const rows = wrapper.findAll('tbody tr[role="row"]')
    expect(rows).toHaveLength(2)
    expect(wrapper.text()).toContain('bash')
    expect(wrapper.text()).toContain('node')
  })
 
  it('mostra il messaggio vuoto quando non ci sono processi', () => {
    const wrapper = mountTable({ data: [] })
 
    expect(wrapper.findAll('tbody tr[role="row"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('Nessun processo corrisponde alla ricerca.')
  })
 
  it('marca aria-selected e la classe evidenziata solo sulla riga selezionata', () => {
    const data = [makeProcess({ pid: 1 }), makeProcess({ pid: 2 })]
    const wrapper = mountTable({ data, selectedPid: 2 })
 
    const rows = wrapper.findAll('tbody tr[role="row"]')
    expect(rows[0]!.attributes('aria-selected')).toBe('false')
    expect(rows[1]!.attributes('aria-selected')).toBe('true')
    expect(rows[1]!.classes()).toContain('bg-primary/15')
    expect(rows[0]!.classes()).not.toContain('bg-primary/15')
  })
 
  it('applica opacity-50 solo alle righe con pid in pendingPids', () => {
    const data = [makeProcess({ pid: 1 }), makeProcess({ pid: 2 })]
    const wrapper = mountTable({ data, pendingPids: new Set([1]) })
 
    const rows = wrapper.findAll('tbody tr[role="row"]')
    expect(rows[0]!.classes()).toContain('opacity-50')
    expect(rows[1]!.classes()).not.toContain('opacity-50')
  })
 
  it('emette select al click e con Invio/Spazio sulla riga', async () => {
    const data = [makeProcess({ pid: 42 })]
    const wrapper = mountTable({ data })
    const row = wrapper.find('tbody tr[role="row"]')
 
    await row.trigger('click')
    await row.trigger('keydown.enter')
    await row.trigger('keydown.space')
 
    const emitted = wrapper.emitted('select')
    expect(emitted).toHaveLength(3)
    expect(emitted![0]).toEqual([42])
  })
})
 