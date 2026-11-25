import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, type VNode } from 'vue'
import { mount } from '@vue/test-utils'
import { ArrowDown } from '@lucide/vue'
import { createProcessColumns } from '../../utils/processColumns'
import ProcessIcon from '../../components/ProcessIcon.vue'
import type { Process } from '../../../../types/process.ts'

function makeProcess(overrides: Partial<Process> = {}): Process {
  return {
    pid: 100, ppid: 1, user: 'giuseppe', pri: 20, ni: 0, status: 'R',
    cpuPercent: 10, memPercent: 5, cpuTime: '0:01', name: 'bash', cmd: '/bin/bash',
    virtBytes: 0, resBytes: 0, shrBytes: 0,
    ...overrides,
  }
}

// I cell/header renderer di processColumns.ts sono funzioni `h(...)` pure,
// non componenti SFC: per testarle basta invocarle e montare il VNode
// risultante dentro un wrapper minimale, senza bisogno di un'istanza
// reale di @tanstack/vue-table.
function renderVNode(vnode: VNode) {
  const Wrapper = defineComponent({ render: () => vnode })
  return mount(Wrapper)
}

// Vista minima di una colonna: i test invocano header/cell a mano.
interface TestColumn {
  accessorKey?: string
  id?: string
  header: () => VNode
  cell: (context: { row: { original: Process } }) => VNode
}

function columnKey(column: unknown): string | undefined {
  const { accessorKey, id } = column as { accessorKey?: string; id?: string }
  return accessorKey ?? id
}

function getColumn(columns: ReturnType<typeof createProcessColumns>, key: string): TestColumn {
  const col = columns.find((c) => columnKey(c) === key)
  if (!col) throw new Error(`colonna "${key}" non trovata`)
  return col as unknown as TestColumn
}

describe('createProcessColumns', () => {
  const onSort = vi.fn<(key: string) => void>()

  beforeEach(() => {
    onSort.mockClear()
  })

  it('definisce una colonna per ogni campo atteso, nell\'ordine giusto', () => {
    const columns = createProcessColumns('cpuPercent', 'desc', onSort)
    const keys = columns.map(columnKey)
    expect(keys).toEqual([
      'pid', 'user', 'pri', 'ni', 'virtBytes', 'resBytes', 'shrBytes',
      'status', 'cpuPercent', 'memPercent', 'cpuTime', 'name',
    ])
  })

  describe('formattazione byte (VIRT/RES/SHR condividono formatKb)', () => {
    it.each([
      [512_000, '500K'],       // < 1000 KB → K
      [2_621_440, '2.5M'],     // 2560 KB → M
      [2_621_440_000, '2.4G'], // 2500 MB → G
    ])('%i byte → %s', (bytes, expected) => {
      const columns = createProcessColumns('cpuPercent', 'desc', onSort)
      const col = getColumn(columns, 'virtBytes')
      const wrapper = renderVNode(col.cell({ row: { original: makeProcess({ virtBytes: bytes }) } }))
      expect(wrapper.text()).toBe(expected)
    })
  })

  describe('colore CPU% in base alle soglie', () => {
    it.each([
      [0, 'text-foreground'],
      [14.9, 'text-foreground'],
      [15, 'text-caution'],
      [49.9, 'text-caution'],
      [50, 'text-caution'],
      [99, 'text-caution'],
    ])('%s%% → %s', (percent, expectedClass) => {
      const columns = createProcessColumns('cpuPercent', 'desc', onSort)
      const col = getColumn(columns, 'cpuPercent')
      const wrapper = renderVNode(col.cell({ row: { original: makeProcess({ cpuPercent: percent }) } }))
      expect(wrapper.classes()).toContain(expectedClass)
    })
  })

  describe('colonna status', () => {
    it.each([
      ['R', 'text-success'],
      ['D', 'text-destructive-text'],
      ['Z', 'text-destructive-text'],
      ['T', 'text-caution'],
      ['S', 'text-foreground'],
    ] as const)('status %s → classe %s', (status, expectedClass) => {
      const columns = createProcessColumns('cpuPercent', 'desc', onSort)
      const col = getColumn(columns, 'status')
      const wrapper = renderVNode(col.cell({ row: { original: makeProcess({ status }) } }))
      expect(wrapper.classes()).toContain(expectedClass)
      expect(wrapper.text()).toBe(status)
    })

    it('usa un colore di fallback (muted-foreground) per uno stato non mappato in STATUS_COLOR', () => {
      const columns = createProcessColumns('cpuPercent', 'desc', onSort)
      const col = getColumn(columns, 'status')
      // '?' è un ProcessStatus legittimo (vedi processStatus.ts) ma non
      // compare nella mappa STATUS_COLOR di questo file, che copre solo R/S/D/Z/T.
      const wrapper = renderVNode(col.cell({ row: { original: makeProcess({ status: '?' }) } }))
      expect(wrapper.classes()).toContain('text-muted-foreground')
    })
  })

  describe('colonna ni (nice)', () => {
    it('evidenzia in rosso i valori negativi (priorità alta)', () => {
      const columns = createProcessColumns('cpuPercent', 'desc', onSort)
      const col = getColumn(columns, 'ni')
      const wrapper = renderVNode(col.cell({ row: { original: makeProcess({ ni: -5 }) } }))
      expect(wrapper.classes()).toContain('text-destructive-text')
    })

    it('nessuna classe di evidenza per valori >= 0', () => {
      const columns = createProcessColumns('cpuPercent', 'desc', onSort)
      const col = getColumn(columns, 'ni')
      const wrapper = renderVNode(col.cell({ row: { original: makeProcess({ ni: 0 }) } }))
      expect(wrapper.classes()).not.toContain('text-destructive-text')
    })
  })

  describe('colonna name (icona + comando)', () => {
    it('mostra il nome e gli argomenti del comando', () => {
      const columns = createProcessColumns('cpuPercent', 'desc', onSort)
      const col = getColumn(columns, 'name')
      const wrapper = renderVNode(col.cell({
        row: { original: makeProcess({ name: 'bash', cmd: '/bin/bash -l' }) },
      }))
      expect(wrapper.text()).toBe('bash-l')
      expect(wrapper.attributes('title')).toBe('/bin/bash -l')
    })

    it('mostra solo il nome se cmd è vuoto', () => {
      const columns = createProcessColumns('cpuPercent', 'desc', onSort)
      const col = getColumn(columns, 'name')
      const wrapper = renderVNode(col.cell({
        row: { original: makeProcess({ name: 'kworker', cmd: '' }) },
      }))
      expect(wrapper.text()).toBe('kworker')
    })

    it('renderizza ProcessIcon passandogli il processo della riga', () => {
      const columns = createProcessColumns('cpuPercent', 'desc', onSort)
      const col = getColumn(columns, 'name')
      const process = makeProcess({ name: 'firefox', cmd: 'firefox' })
      const wrapper = renderVNode(col.cell({ row: { original: process } }))

      const icon = wrapper.findComponent(ProcessIcon)
      expect(icon.exists()).toBe(true)
      expect(icon.props('process')).toEqual(process)
    })
  })

  describe('header ordinabile', () => {
    it('il click sul bottone chiama onSort con la chiave della colonna', async () => {
      const columns = createProcessColumns('cpuPercent', 'desc', onSort)
      const col = getColumn(columns, 'pid')
      const wrapper = renderVNode(col.header())

      await wrapper.find('button').trigger('click')

      expect(onSort).toHaveBeenCalledWith('pid')
    })

    it('mostra l\'icona di ordinamento solo sulla colonna attualmente attiva', () => {
      const columns = createProcessColumns('cpuPercent', 'desc', onSort)

      const activeHeader = renderVNode(getColumn(columns, 'cpuPercent').header())
      const inactiveHeader = renderVNode(getColumn(columns, 'pid').header())

      expect(activeHeader.findComponent(ArrowDown).exists()).toBe(true)
      expect(inactiveHeader.findComponent(ArrowDown).exists()).toBe(false)
    })

    it('ruota l\'icona quando la direzione è ascendente, non quando è discendente', () => {
      const ascColumns = createProcessColumns('cpuPercent', 'asc', onSort)
      const descColumns = createProcessColumns('cpuPercent', 'desc', onSort)

      const ascHeader = renderVNode(getColumn(ascColumns, 'cpuPercent').header())
      const descHeader = renderVNode(getColumn(descColumns, 'cpuPercent').header())

      expect(ascHeader.findComponent(ArrowDown).classes()).toContain('rotate-180')
      expect(descHeader.findComponent(ArrowDown).classes()).not.toContain('rotate-180')
    })

    it('allinea a destra di default, a sinistra per user e name', () => {
      const columns = createProcessColumns('cpuPercent', 'desc', onSort)

      const pidHeader = renderVNode(getColumn(columns, 'pid').header())
      const userHeader = renderVNode(getColumn(columns, 'user').header())
      const nameHeader = renderVNode(getColumn(columns, 'name').header())

      expect(pidHeader.find('button').classes()).toContain('ml-auto')
      expect(userHeader.find('button').classes()).not.toContain('ml-auto')
      expect(nameHeader.find('button').classes()).not.toContain('ml-auto')
    })
  })
})