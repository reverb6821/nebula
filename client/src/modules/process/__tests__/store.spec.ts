import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { useProcessesStore } from '@/modules/process/store'
import type { Process } from '@/types/process'

// Mock del confine reale dello store: le funzioni di useProcessApi.ts,
// non runCmd/spawnStream sottostanti. Isola lo store dalla logica di
// parsing (già coperta a parte in useProcessApi.spec.ts).
vi.mock('@/modules/process/composables/useProcessApi', () => ({
  listProcesses: vi.fn(),
  startProcessStream: vi.fn(),
  killProcess: vi.fn(),
  terminateProcess: vi.fn(),
  reniceProcess: vi.fn(),
}))

import {
  listProcesses,
  startProcessStream,
  killProcess,
  terminateProcess,
  reniceProcess,
} from '@/modules/process/composables/useProcessApi'

const mockListProcesses = vi.mocked(listProcesses)
const mockStartProcessStream = vi.mocked(startProcessStream)
const mockKillProcess = vi.mocked(killProcess)
const mockTerminateProcess = vi.mocked(terminateProcess)
const mockReniceProcess = vi.mocked(reniceProcess)

function makeProcess(overrides: Partial<Process> = {}): Process {
  return {
    pid: 1, ppid: 0, user: 'root', pri: 20, ni: 0, status: 'R',
    cpuPercent: 0, memPercent: 0, cpuTime: '0:00', name: 'proc', cmd: 'proc',
    virtBytes: 0, resBytes: 0, shrBytes: 0,
    ...overrides,
  }
}

describe('useProcessesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // autoRefresh parte true e la watch immediate chiama subito
    // startAutoRefresh(): senza questo default, ogni test partirebbe
    // con uno stream "appeso" in attesa di una Promise mai risolta.
    mockStartProcessStream.mockResolvedValue({ id: 1, stop: vi.fn().mockResolvedValue(undefined) })
  })

  afterEach(() => {
    // Rete di sicurezza: se uno dei test con vi.useFakeTimers() fallisce
    // prima di raggiungere il proprio vi.useRealTimers(), questo evita che
    // i fake timer restino attivi e rompano flushPromises() nei test
    // successivi (flushPromises usa un setTimeout reale internamente).
    vi.useRealTimers()
  })

  describe('fetch', () => {
    it('popola processes con il risultato di listProcesses', async () => {
      mockListProcesses.mockResolvedValue([makeProcess({ pid: 1 }), makeProcess({ pid: 2 })])
      const store = useProcessesStore()

      await store.fetch()

      expect(store.processes.map((p) => p.pid)).toEqual([1, 2])
    })

    it('mantiene la lista e registra lerrore quando listProcesses fallisce', async () => {
      mockListProcesses.mockRejectedValue(new Error('process list failed'))
      const store = useProcessesStore()
      store.processes = [makeProcess({ pid: 7 })]

      await store.fetch()

      expect(store.processes.map((p) => p.pid)).toEqual([7])
      expect(store.error).toBe('process list failed')
      expect(store.loading).toBe(false)
    })
  })

  describe('filtered', () => {
    it('filtra per testo su nome/utente/pid/cmd dopo il debounce della ricerca', async () => {
      vi.useFakeTimers()
      const store = useProcessesStore()
      store.processes = [
        makeProcess({ pid: 1, name: 'bash', user: 'giuseppe', cmd: '/bin/bash' }),
        makeProcess({ pid: 2, name: 'node', user: 'root', cmd: '/usr/bin/node' }),
      ]

      store.search = 'bash'
      await vi.advanceTimersByTimeAsync(250)
      await nextTick()

      expect(store.filtered.map((p) => p.pid)).toEqual([1])
      vi.useRealTimers()
    })

    it('non filtra sotto la soglia minima di caratteri (MIN_SEARCH = 3)', async () => {
      vi.useFakeTimers()
      const store = useProcessesStore()
      store.processes = [makeProcess({ pid: 1, name: 'bash' }), makeProcess({ pid: 2, name: 'node' })]

      store.search = 'no' // 2 caratteri, sotto soglia
      await vi.advanceTimersByTimeAsync(250)
      await nextTick()

      expect(store.filtered).toHaveLength(2)
      vi.useRealTimers()
    })

    it('filtra per stato quando statusFilter non è vuoto', () => {
      const store = useProcessesStore()
      store.processes = [
        makeProcess({ pid: 1, status: 'R' }),
        makeProcess({ pid: 2, status: 'Z' }),
      ]

      store.toggleStatusFilter('Z')

      expect(store.filtered.map((p) => p.pid)).toEqual([2])
    })

    it('ordina secondo sortKey/sortDir correnti', () => {
      const store = useProcessesStore()
      store.processes = [
        makeProcess({ pid: 1, cpuPercent: 10 }),
        makeProcess({ pid: 2, cpuPercent: 50 }),
        makeProcess({ pid: 3, cpuPercent: 30 }),
      ]
      // default: sortKey='cpuPercent', sortDir='desc'
      expect(store.filtered.map((p) => p.pid)).toEqual([2, 3, 1])
    })
  })

  describe('setSort', () => {
    it('la prima chiamata su una nuova chiave ordina desc', () => {
      const store = useProcessesStore()
      store.setSort('memPercent')
      expect(store.sortKey).toBe('memPercent')
      expect(store.sortDir).toBe('desc')
    })

    it('richiamata sulla stessa chiave inverte la direzione', () => {
      const store = useProcessesStore()
      store.setSort('memPercent') // desc
      store.setSort('memPercent') // asc
      expect(store.sortDir).toBe('asc')
    })
  })

  describe('paginazione', () => {
    it('calcola totalPages arrotondando per eccesso', () => {
      const store = useProcessesStore()
      store.processes = Array.from({ length: 125 }, (_, i) => makeProcess({ pid: i + 1 }))
      store.setPageSize(50)
      expect(store.totalPages).toBe(3)
    })

    it('setPage clampa entro [1, totalPages]', () => {
      const store = useProcessesStore()
      store.processes = Array.from({ length: 10 }, (_, i) => makeProcess({ pid: i + 1 }))
      store.setPageSize(50) // totalPages = 1

      store.setPage(99)
      expect(store.page).toBe(1)

      store.setPage(-5)
      expect(store.page).toBe(1)
    })

    it('setPageSize riporta la pagina a 1', () => {
      const store = useProcessesStore()
      store.processes = Array.from({ length: 200 }, (_, i) => makeProcess({ pid: i + 1 }))
      store.setPageSize(50)
      store.setPage(3)

      store.setPageSize(100)

      expect(store.page).toBe(1)
    })

    it('cambiare la ricerca riporta la pagina a 1', async () => {
      vi.useFakeTimers()
      const store = useProcessesStore()
      store.processes = Array.from({ length: 200 }, (_, i) => makeProcess({ pid: i + 1, name: `p${i}` }))
      store.setPageSize(50)
      store.setPage(3)

      store.search = 'p1'
      await vi.advanceTimersByTimeAsync(250)
      await nextTick()

      expect(store.page).toBe(1)
      vi.useRealTimers()
    })
  })

  describe('resetFilters', () => {
    it('svuota search e statusFilter', () => {
      const store = useProcessesStore()
      store.search = 'qualcosa'
      store.toggleStatusFilter('Z')

      store.resetFilters()

      expect(store.search).toBe('')
      expect(store.statusFilter).toEqual([])
    })
  })

  describe('select', () => {
    it('selezionare un pid non selezionato lo imposta', () => {
      const store = useProcessesStore()
      store.select(42)
      expect(store.selectedPid).toBe(42)
    })

    it('riselezionare lo stesso pid lo deseleziona (toggle)', () => {
      const store = useProcessesStore()
      store.select(42)
      store.select(42)
      expect(store.selectedPid).toBeNull()
    })
  })

  describe('azioni: kill / terminate / renice', () => {
    it('kill rimuove il processo dalla lista e deseleziona se era selezionato', async () => {
      mockKillProcess.mockResolvedValue(undefined)
      const store = useProcessesStore()
      store.processes = [makeProcess({ pid: 1 }), makeProcess({ pid: 2 })]
      store.select(1)

      await store.kill(1)

      expect(mockKillProcess).toHaveBeenCalledWith(1)
      expect(store.processes.map((p) => p.pid)).toEqual([2])
      expect(store.selectedPid).toBeNull()
    })

    it('terminate richiama terminateProcess e poi rifà un fetch completo', async () => {
      mockTerminateProcess.mockResolvedValue(undefined)
      mockListProcesses.mockResolvedValue([makeProcess({ pid: 1 })])
      const store = useProcessesStore()

      await store.terminate(1)

      expect(mockTerminateProcess).toHaveBeenCalledWith(1)
      expect(mockListProcesses).toHaveBeenCalled()
      expect(store.processes.map((p) => p.pid)).toEqual([1])
    })

    it('renice chiama reniceProcess col valore passato', async () => {
      mockReniceProcess.mockResolvedValue(undefined)
      const store = useProcessesStore()

      await store.renice(5, 10)

      expect(mockReniceProcess).toHaveBeenCalledWith(5, 10)
    })

    it('niceStep somma il delta al ni corrente del processo', async () => {
      mockReniceProcess.mockResolvedValue(undefined)
      const store = useProcessesStore()
      store.processes = [makeProcess({ pid: 1, ni: 0 })]

      await store.niceStep(1, 5)

      expect(mockReniceProcess).toHaveBeenCalledWith(1, 5)
    })

    it('niceStep non fa nulla se il pid non esiste', async () => {
      const store = useProcessesStore()
      store.processes = []

      await store.niceStep(999, 5)

      expect(mockReniceProcess).not.toHaveBeenCalled()
    })

    it('rimuove il pid dal pending set dopo un errore di kill', async () => {
      mockKillProcess.mockRejectedValue(new Error('permission denied'))
      const store = useProcessesStore()

      await expect(store.kill(1)).rejects.toThrow('permission denied')

      expect(store.pendingPids.has(1)).toBe(false)
    })
  })

  describe('auto-refresh', () => {
    it('alla creazione (autoRefresh=true di default) avvia subito lo stream', () => {
      useProcessesStore()
      expect(mockStartProcessStream).toHaveBeenCalledTimes(1)
    })

    it('disattivare autoRefresh ferma lo stream attivo', async () => {
      const stop = vi.fn().mockResolvedValue(undefined)
      mockStartProcessStream.mockResolvedValue({ id: 1, stop })
      const store = useProcessesStore()
      // flushPromises, non solo nextTick: la Promise interna di
      // startAutoRefresh() (stream = await startProcessStream(...)) deve
      // essere risolta PRIMA di disattivare autoRefresh, altrimenti
      // stopAutoRefresh() trova `stream` ancora null e non chiama stop
      // — stessa race condition vista in settings/store.spec.ts.
      await flushPromises()

      store.autoRefresh = false
      await nextTick()

      expect(stop).toHaveBeenCalledTimes(1)
    })

    it('riattivare autoRefresh dopo averlo fermato avvia un nuovo stream', async () => {
      const store = useProcessesStore()
      await flushPromises()

      store.autoRefresh = false
      await nextTick()
      store.autoRefresh = true
      await nextTick()

      expect(mockStartProcessStream).toHaveBeenCalledTimes(2)
    })

    it('stopAutoRefresh (esposta per il cleanup in main.ts) ferma lo stream', async () => {
      const stop = vi.fn().mockResolvedValue(undefined)
      mockStartProcessStream.mockResolvedValue({ id: 1, stop })
      const store = useProcessesStore()
      await flushPromises()

      await store.stopAutoRefresh()

      expect(stop).toHaveBeenCalledTimes(1)
    })

    it('lo snapshot dello stream aggiorna processes preservando shrBytes dal fetch precedente', async () => {
      let onSnapshot: ((p: Process[]) => void) | undefined
      mockStartProcessStream.mockImplementation(async (cb) => {
        onSnapshot = cb
        return { id: 1, stop: vi.fn().mockResolvedValue(undefined) }
      })
      const store = useProcessesStore()
      await flushPromises()

      // Fetch iniziale con shrBytes "vero"
      store.processes = [makeProcess({ pid: 1, shrBytes: 12345 })]

      // Lo stream manda un nuovo snapshot senza SHR (comportamento reale:
      // lo stream non lo calcola mai, per non appesantire ogni tick)
      onSnapshot?.([makeProcess({ pid: 1, shrBytes: 0, cpuPercent: 99 })])

      expect(store.processes[0]).toMatchObject({ cpuPercent: 99, shrBytes: 12345 })
    })
  })

  describe('stats', () => {
    it('conta processi in running e il picco di cpuPercent', () => {
      const store = useProcessesStore()
      store.processes = [
        makeProcess({ pid: 1, status: 'R', cpuPercent: 10 }),
        makeProcess({ pid: 2, status: 'S', cpuPercent: 80 }),
        makeProcess({ pid: 3, status: 'R', cpuPercent: 5 }),
      ]

      expect(store.stats.total).toBe(3)
      expect(store.stats.running).toBe(2)
      expect(store.stats.cpuTop).toBe(80)
    })
  })
})