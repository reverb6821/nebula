import { defineStore } from 'pinia'
import { ref, computed, watch, onScopeDispose } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { Process, ProcessStatus, SortKey, SortDir } from '@/types/process'
import type { CmdStream } from '@/composables/useNeutralinoCmd'
import { useAsyncState } from '@/composables/useAsyncState'
import { usePendingSet } from '@/composables/usePendingSet'
import {
  listProcesses,
  startProcessStream,
  killProcess,
  terminateProcess,
  reniceProcess,
} from './composables/useProcessApi'

const MIN_SEARCH = 3
const PAGE_SIZE_DEFAULT = 50

export const useProcessesStore = defineStore('processes', () => {
  const processes    = ref<Process[]>([])
  const search       = ref('')
  const statusFilter = ref<ProcessStatus[]>([])
  const sortKey      = ref<SortKey>('cpuPercent')
  const sortDir      = ref<SortDir>('desc')
  const autoRefresh  = ref(true)
  const selectedPid  = ref<number | null>(null)

  // Prima: loading/error/withPending scritti a mano, identici a
  // daemons/docker store. pendingPids è un fit 1:1 con usePendingSet.
  // loading/error restano ref semplici anche passando da
  // useAsyncState: lo stream di startAutoRefresh più sotto continua a
  // scriverci sopra direttamente nei suoi callback esattamente come
  // prima — run() li usa solo per il fetch() one-shot, non "possiede"
  // in modo esclusivo quello stato.
  const { loading, error, run } = useAsyncState('Failed to load processes')
  const { pending: pendingPids, withPending } = usePendingSet<number>()

  const searchDebounced = refDebounced(search, 250)

  // ─── Computed ───────────────────────────────────────────────────────────────

  const hasActiveFilters = computed(
    () => statusFilter.value.length > 0 || search.value.length >= MIN_SEARCH,
  )

  const filtered = computed(() => {
    const q = searchDebounced.value.toLowerCase().trim()
    const hasStatus = statusFilter.value.length > 0

    let list = processes.value.filter((p) => {
      if (q.length >= MIN_SEARCH) {
        const matchesText =
          p.name.toLowerCase().includes(q) ||
          p.user.toLowerCase().includes(q) ||
          String(p.pid).includes(q) ||
          p.cmd.toLowerCase().includes(q)
        if (!matchesText) return false
      }
      if (hasStatus && !statusFilter.value.includes(p.status)) return false
      return true
    })

    list.sort((a, b) => {
      const av = a[sortKey.value]
      const bv = b[sortKey.value]
      const cmp = typeof av === 'string'
        ? av.localeCompare(bv as string)
        : (av as number) - (bv as number)
      return sortDir.value === 'asc' ? cmp : -cmp
    })

    return list
  })

  const stats = computed(() => ({
    total:   processes.value.length,
    shown:   filtered.value.length,
    running: processes.value.filter((p) => p.status === 'R').length,
    cpuTop:  processes.value.reduce((max, p) => Math.max(max, p.cpuPercent), 0),
  }))

  // ─── Pagination ─────────────────────────────────────────────────────────────

  const page     = ref(1)
  const pageSize = ref(PAGE_SIZE_DEFAULT)

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(filtered.value.length / pageSize.value)),
  )

  const paginated = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return filtered.value.slice(start, start + pageSize.value)
  })

  function setPage(n: number) {
    page.value = Math.min(Math.max(1, n), totalPages.value)
  }

  function setPageSize(n: number) {
    pageSize.value = n
    page.value = 1
  }

  watch([searchDebounced, statusFilter], () => { page.value = 1 })
  watch(totalPages, (tp) => { if (page.value > tp) page.value = tp })

  // ─── Filters ────────────────────────────────────────────────────────────────

  function toggleStatusFilter(status: ProcessStatus) {
    const current = statusFilter.value
    statusFilter.value = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
  }

  function resetFilters() {
    search.value = ''
    statusFilter.value = []
  }

  // ─── Sort ───────────────────────────────────────────────────────────────────

  function setSort(key: SortKey) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'desc'
    }
  }

  // ─── Selezione riga (stile htop: seleziona, poi agisci con gli F-tasti) ────

  function select(pid: number) {
    selectedPid.value = selectedPid.value === pid ? null : pid
  }

  // ─── Fetch (caricamento iniziale / refresh manuale) ────────────────────────

  async function fetch() {
    const result = await run(() => listProcesses())
    if (result === undefined) return
    processes.value = result
  }

  // ─── Auto-refresh (stream) ──────────────────────────────────────────────────
  //
  // Non è un fetch one-shot: è una subscription push-based (callback
  // chiamato continuamente dal backend), un paradigma diverso da
  // quello che useAsyncState astrae. Resta gestito a mano, come prima.

  let stream: CmdStream | null = null

  async function startAutoRefresh() {
    if (stream) return
    stream = await startProcessStream(
      (snapshot) => {
        // SHR non viaggia sullo stream (costerebbe una lettura di
        // /proc/<pid>/statm per pid ogni secondo): resta "appiccicata"
        // dall'ultimo fetch/refresh manuale finché il pid esiste ancora.
        const prevByPid = new Map(processes.value.map((p) => [p.pid, p]))
        processes.value = snapshot.map((p) => ({
          ...p,
          shrBytes: prevByPid.get(p.pid)?.shrBytes ?? p.shrBytes,
        }))
        loading.value = false
        error.value = null
      },
      (message) => { error.value = message },
      1,
    )
  }

  async function stopAutoRefresh() {
    if (!stream) return
    const s = stream
    stream = null
    await s.stop()
  }

  watch(autoRefresh, (enabled) => {
    if (enabled) startAutoRefresh()
    else stopAutoRefresh()
  }, { immediate: true })

  onScopeDispose(stopAutoRefresh)

  // ─── Actions ────────────────────────────────────────────────────────────────

  async function kill(pid: number) {
    await withPending(pid, async () => {
      await killProcess(pid)
      processes.value = processes.value.filter((p) => p.pid !== pid)
      if (selectedPid.value === pid) selectedPid.value = null
    })
  }

  async function terminate(pid: number) {
    await withPending(pid, async () => {
      await terminateProcess(pid)
      await fetch()
    })
  }

  async function renice(pid: number, nice: number) {
    await withPending(pid, () => reniceProcess(pid, nice))
  }

  function niceStep(pid: number, delta: number) {
    const proc = processes.value.find((p) => p.pid === pid)
    if (!proc) return
    return renice(pid, proc.ni + delta)
  }

  return {
    processes, filtered, loading, error,
    search, statusFilter, hasActiveFilters,
    sortKey, sortDir, pendingPids, autoRefresh, stats,
    page, pageSize, totalPages, paginated, setPage, setPageSize,
    selectedPid, select,
    fetch, setSort, kill, terminate, renice, niceStep,
    toggleStatusFilter, resetFilters,
  }
})