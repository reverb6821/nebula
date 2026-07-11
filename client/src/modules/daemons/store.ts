import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { Daemon, DaemonStatus, DaemonEnabled } from '@/types/daemon'
import {
  listDaemons,
  startDaemon,
  stopDaemon,
  enableDaemon,
  disableDaemon,
  restartDaemon,
} from '@/modules/daemons/composables/useDaemonAction'

const MIN_SEARCH_CHARS = 3
const PAGE_SIZE = 12
const STORAGE_KEY = 'daemons_view_mode'

export interface DaemonFilters {
  status: DaemonStatus[]
  enabled: DaemonEnabled[]
}

export const useDaemonsStore = defineStore('daemons', () => {
  const daemons = ref<Daemon[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')
  const page = ref(1)
  const pendingNames = ref<Set<string>>(new Set())

  // Persistenza viewMode in localStorage
  const viewMode = ref<'list' | 'grid'>(
    (localStorage.getItem(STORAGE_KEY) as 'list' | 'grid') || 'list',
  )
  watch(viewMode, (newMode) => {
    localStorage.setItem(STORAGE_KEY, newMode)
  })

  // Filtri status e enabled
  const filters = ref<DaemonFilters>({
    status: [],
    enabled: [],
  })

  const searchDebounced = refDebounced(search, 300)

  // Reset pagina quando cambiano ricerca o filtri
  watch([searchDebounced, filters], () => { page.value = 1 }, { deep: true })

  const allFiltered = computed(() => {
    const q = searchDebounced.value.toLowerCase().trim()
    const hasStatusFilter  = filters.value.status.length > 0
    const hasEnabledFilter = filters.value.enabled.length > 0

    return daemons.value.filter((d) => {
      // Filtro testo (attivo solo con 3+ chars) — cerca anche per PID
      if (q.length >= MIN_SEARCH_CHARS) {
        const matchesText =
          d.name.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          (d.pid !== undefined && String(d.pid).includes(q))
        if (!matchesText) return false
      }

      // Filtro status
      if (hasStatusFilter && !filters.value.status.includes(d.status)) return false

      // Filtro enabled
      if (hasEnabledFilter && !filters.value.enabled.includes(d.enabled)) return false

      return true
    })
  })

  const filtered = computed(() =>
    allFiltered.value.slice(0, page.value * PAGE_SIZE),
  )

  const hasMore = computed(
    () => filtered.value.length < allFiltered.value.length,
  )

  const hasActiveFilters = computed(
    () =>
      filters.value.status.length > 0 ||
      filters.value.enabled.length > 0 ||
      search.value.length >= MIN_SEARCH_CHARS,
  )

  const stats = computed(() => ({
    active:   daemons.value.filter((d) => d.status === 'active').length,
    failed:   daemons.value.filter((d) => d.status === 'failed').length,
    total:    daemons.value.length,
    shown:    filtered.value.length,
    matching: allFiltered.value.length,
  }))

  function loadMore() { page.value++ }

  function resetFilters() {
    search.value = ''
    filters.value = { status: [], enabled: [] }
    page.value = 1
  }

function toggleStatusFilter(status: DaemonStatus) {
  const idx = filters.value.status.indexOf(status)
  let nextStatus = [...filters.value.status]
  
  if (idx === -1) {
    nextStatus.push(status)
  } else {
    nextStatus = nextStatus.filter(s => s !== status)
  }

  // Riassegna l'intero oggetto filters per forzare la reattività immediata
  filters.value = {
    ...filters.value,
    status: nextStatus
  }
}

function toggleEnabledFilter(enabled: DaemonEnabled) {
  const idx = filters.value.enabled.indexOf(enabled)
  let nextEnabled = [...filters.value.enabled]
  
  if (idx === -1) {
    nextEnabled.push(enabled)
  } else {
    nextEnabled = nextEnabled.filter(e => e !== enabled)
  }

  // Riassegna l'intero oggetto filters per forzare la reattività immediata
  filters.value = {
    ...filters.value,
    enabled: nextEnabled
  }
}
  // ─── Fetch ──────────────────────────────────────────────────────────────────

  async function fetch() {
    loading.value = true
    error.value = null
    try {
      daemons.value = await listDaemons()
      page.value = 1
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load daemons'
    } finally {
      loading.value = false
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function patchDaemon(name: string, patch: Partial<Daemon>) {
    const idx = daemons.value.findIndex((d) => d.name === name)
    if (idx !== -1) daemons.value[idx] = { ...daemons.value[idx]!, ...patch } as Daemon
  }

  async function withPending<T>(name: string, fn: () => Promise<T>): Promise<T> {
    pendingNames.value = new Set([...pendingNames.value, name])
    try {
      return await fn()
    } finally {
      const next = new Set(pendingNames.value)
      next.delete(name)
      pendingNames.value = next
    }
  }

  // ─── Actions ────────────────────────────────────────────────────────────────

  async function start(name: string) {
    await withPending(name, async () => {
      await startDaemon(name)
      patchDaemon(name, { status: 'active' })
    })
  }

  async function stop(name: string) {
    await withPending(name, async () => {
      await stopDaemon(name)
      patchDaemon(name, { status: 'inactive' })
    })
  }

  async function restart(name: string) {
    await withPending(name, async () => {
      await restartDaemon(name)
      const fresh = await listDaemons()
      const updated = fresh.find((d) => d.name === name)
      if (updated) patchDaemon(name, updated)
    })
  }

  async function enable(name: string) {
    await withPending(name, async () => {
      await enableDaemon(name)
      patchDaemon(name, { enabled: 'enabled' })
    })
  }

  async function disable(name: string) {
    await withPending(name, async () => {
      await disableDaemon(name)
      patchDaemon(name, { enabled: 'disabled' })
    })
  }

  async function toggleEnabled(name: string) {
    const daemon = daemons.value.find((d) => d.name === name)
    if (!daemon || daemon.enabled === 'static') return
    daemon.enabled === 'enabled' ? await disable(name) : await enable(name)
  }

  return {
    daemons, filtered, allFiltered, hasMore, hasActiveFilters,
    loading, error, search, searchDebounced,
    pendingNames, stats, filters, viewMode,
    fetch, loadMore, resetFilters, toggleStatusFilter, toggleEnabledFilter,
    start, stop, restart, enable, disable, toggleEnabled,
  }
})