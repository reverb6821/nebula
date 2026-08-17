import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useIntervalFn, refDebounced } from '@vueuse/core'
import type { Process, ProcessStatus, SortKey, SortDir } from '@/types/process'
import {
  listProcesses,
  killProcess,
  terminateProcess,
  reniceProcess,
} from './composables/useProcessApi'

const MIN_SEARCH = 2

export const useProcessesStore = defineStore('processes', () => {
  const processes    = ref<Process[]>([])
  const loading      = ref(false)
  const error        = ref<string | null>(null)
  const search       = ref('')
  const statusFilter = ref<ProcessStatus[]>([])
  const sortKey      = ref<SortKey>('cpuPercent')
  const sortDir      = ref<SortDir>('desc')
  const pendingPids  = ref<Set<number>>(new Set())
  const autoRefresh  = ref(true)

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

    // Sort
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

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  async function fetch() {
    loading.value = true
    error.value = null
    try {
      processes.value = await listProcesses()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load processes'
    } finally {
      loading.value = false
    }
  }

  // Auto-refresh ogni 3s
  useIntervalFn(() => {
    if (autoRefresh.value) fetch()
  }, 3000)

  // ─── Actions ────────────────────────────────────────────────────────────────

  async function withPending<T>(pid: number, fn: () => Promise<T>): Promise<T> {
    pendingPids.value = new Set([...pendingPids.value, pid])
    try { return await fn() }
    finally {
      const next = new Set(pendingPids.value)
      next.delete(pid)
      pendingPids.value = next
    }
  }

  async function kill(pid: number) {
    await withPending(pid, async () => {
      await killProcess(pid)
      processes.value = processes.value.filter((p) => p.pid !== pid)
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

  return {
    processes, filtered, loading, error,
    search, statusFilter, hasActiveFilters,
    sortKey, sortDir, pendingPids, autoRefresh, stats,
    fetch, setSort, kill, terminate, renice,
    toggleStatusFilter, resetFilters,
  }
})