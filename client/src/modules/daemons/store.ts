import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { Daemon } from '@/types/daemon'
import {
  listDaemons,
  startDaemon,
  stopDaemon,
  enableDaemon,
  disableDaemon,
  restartDaemon,
} from '@/modules/daemons/composables/useDaemonAction'

const MIN_SEARCH_CHARS = 3
const PAGE_SIZE = 50

export const useDaemonsStore = defineStore('daemons', () => {
  const daemons = ref<Daemon[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')
  const page = ref(1)
  const pendingNames = ref<Set<string>>(new Set())

  const searchDebounced = refDebounced(search, 300)

  // Reset pagina quando cambia la ricerca
  watch(searchDebounced, () => { page.value = 1 })

  const allFiltered = computed(() => {
    const q = searchDebounced.value.toLowerCase().trim()
    if (q.length < MIN_SEARCH_CHARS) return daemons.value
    return daemons.value.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q),
    )
  })

  const filtered = computed(() =>
    allFiltered.value.slice(0, page.value * PAGE_SIZE),
  )

  const hasMore = computed(
    () => filtered.value.length < allFiltered.value.length,
  )

  const stats = computed(() => ({
    active: daemons.value.filter((d) => d.status === 'active').length,
    failed: daemons.value.filter((d) => d.status === 'failed').length,
    total: daemons.value.length,
    shown: filtered.value.length,
    matching: allFiltered.value.length,
  }))

  function loadMore() {
    page.value++
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
    daemons, filtered, allFiltered, hasMore,
    loading, error, search, searchDebounced,
    pendingNames, stats,
    fetch, loadMore,
    start, stop, restart, enable, disable, toggleEnabled,
  }
})