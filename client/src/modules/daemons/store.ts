import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { storage } from '@neutralinojs/lib'
import type { Daemon, DaemonStatus, DaemonEnabled } from '@/types/daemon'
import { useAsyncState } from '@/composables/useAsyncState'
import { usePendingSet } from '@/composables/usePendingSet'
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
const STORAGE_KEY_VIEW  = 'daemons_view_mode'
const STORAGE_KEY_FAVS  = 'daemons_favorites'

export interface DaemonFilters {
  status: DaemonStatus[]
  enabled: DaemonEnabled[]
}

// Persistenza via Neutralino.storage invece di localStorage: i dati
// finiscono su disco in .storage/ nella cartella dell'app, non nel
// profilo del webview. Sopravvivono a pulizie cache/dati del sistema
// operativo che invece possono svuotare il localStorage, e funzionano
// identicamente sia in modalità finestra singola sia con più istanze.
// Richiede Neutralino.init() già chiamato all'avvio dell'app (fatto in
// main.ts).
async function loadFavorites(): Promise<Set<string>> {
  try {
    const raw = await storage.getData(STORAGE_KEY_FAVS)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    // NE_ST_NOSTKEY: chiave non ancora scritta (prima esecuzione) — set vuoto
    return new Set()
  }
}

function saveFavorites(favs: Set<string>) {
  storage.setData(STORAGE_KEY_FAVS, JSON.stringify([...favs])).catch(() => {})
}

async function loadViewMode(): Promise<'list' | 'grid'> {
  try {
    const raw = await storage.getData(STORAGE_KEY_VIEW)
    return raw === 'grid' ? 'grid' : 'list'
  } catch {
    return 'list'
  }
}

function saveViewMode(mode: 'list' | 'grid') {
  storage.setData(STORAGE_KEY_VIEW, mode).catch(() => {})
}

export const useDaemonsStore = defineStore('daemons', () => {
  const daemons = ref<Daemon[]>([])
  const search  = ref('')
  const page    = ref(1)
  const favorites = ref<Set<string>>(new Set())

  // Caricamento asincrono: il primo render parte con un set vuoto,
  // aggiornato non appena lo storage nativo risponde (di norma nello
  // stesso frame o giù di lì, essendo una lettura da disco locale).
  loadFavorites().then((favs) => { favorites.value = favs })

  // Prima: loading/error locali + un withPending scritto a mano quasi
  // identico a quello di docker/processes store. Ora dai due
  // composable condivisi (vedi src/composables/), stesso trattamento
  // già applicato a useDockerStore.
  const { loading, error, run } = useAsyncState('Failed to load daemons')
  const { pending: pendingNames, withPending } = usePendingSet<string>()

  // Persistenza viewMode
  const viewMode = ref<'list' | 'grid'>('list')
  loadViewMode().then((v) => { viewMode.value = v })
  watch(viewMode, (v) => saveViewMode(v))

  // Filtri
  const filters = ref<DaemonFilters>({ status: [], enabled: [] })

  const searchDebounced = refDebounced(search, 300)

  watch([searchDebounced, filters], () => { page.value = 1 }, { deep: true })

  // ─── Filtering ──────────────────────────────────────────────────────────────

  function matchesFilters(d: Daemon): boolean {
    const q = searchDebounced.value.toLowerCase().trim()

    if (q.length >= MIN_SEARCH_CHARS) {
      const ok =
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.pid !== undefined && String(d.pid).includes(q))
      if (!ok) return false
    }

    if (filters.value.status.length > 0 && !filters.value.status.includes(d.status))
      return false

    if (filters.value.enabled.length > 0 && !filters.value.enabled.includes(d.enabled))
      return false

    return true
  }

  // Converte Set in Array per forzare il tracking reattivo di Vue
  const favoritesArray = computed(() => Array.from(favorites.value))

  // Favoriti filtrati — sempre mostrati in cima, senza paginazione
  const filteredFavorites = computed(() =>
    daemons.value.filter((d) => favoritesArray.value.includes(d.name) && matchesFilters(d)),
  )

  // Non-favoriti filtrati — paginati
  const allFilteredNonFav = computed(() =>
    daemons.value.filter((d) => !favoritesArray.value.includes(d.name) && matchesFilters(d)),
  )

  const filteredNonFav = computed(() =>
    allFilteredNonFav.value.slice(0, page.value * PAGE_SIZE),
  )

  // Compatibilità con i componenti che usano `filtered`
  const filtered = computed(() => [
    ...filteredFavorites.value,
    ...filteredNonFav.value,
  ])

  const hasMore = computed(
    () => filteredNonFav.value.length < allFilteredNonFav.value.length,
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
    matching: filteredFavorites.value.length + allFilteredNonFav.value.length,
  }))

  // ─── Favorites ──────────────────────────────────────────────────────────────

  function toggleFavorite(name: string) {
    const next = new Set(favorites.value)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    favorites.value = next
    saveFavorites(next)
  }

  function isFavorite(name: string): boolean {
    return favoritesArray.value.includes(name)
  }

  // ─── Pagination ─────────────────────────────────────────────────────────────

  function loadMore() { page.value++ }

  function resetFilters() {
    search.value = ''
    filters.value = { status: [], enabled: [] }
    page.value = 1
  }

  function toggleStatusFilter(status: DaemonStatus) {
    const current = filters.value.status
    filters.value = {
      ...filters.value,
      status: current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status],
    }
  }

  function toggleEnabledFilter(enabled: DaemonEnabled) {
    const current = filters.value.enabled
    filters.value = {
      ...filters.value,
      enabled: current.includes(enabled)
        ? current.filter((e) => e !== enabled)
        : [...current, enabled],
    }
  }

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  async function fetch() {
    const result = await run(() => listDaemons())
    if (result === undefined) return
    daemons.value = result
    page.value = 1
  }

  function collectNow() {
    return listDaemons()
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function patchDaemon(name: string, patch: Partial<Daemon>) {
    const idx = daemons.value.findIndex((d) => d.name === name)
    if (idx !== -1) daemons.value[idx] = { ...daemons.value[idx]!, ...patch } as Daemon
  }

  // ─── Actions ────────────────────────────────────────────────────────────────

  // Azione privilegiata (start/stop/enable/disable): se il comando fallisce
  // (pkexec annullato, permessi negati...) niente patch ottimistica — lo
  // stato mostrato deve restare quello vero, non quello sperato.
  async function runAction(
    name: string,
    action: (name: string) => Promise<void>,
    patch: Partial<Daemon>,
  ) {
    await withPending(name, async () => {
      try {
        await action(name)
        patchDaemon(name, patch)
        error.value = null
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Failed to update daemon'
      }
    })
  }

  async function start(name: string) {
    await runAction(name, startDaemon, { status: 'active' })
  }

  async function stop(name: string) {
    await runAction(name, stopDaemon, { status: 'inactive' })
  }

  async function enable(name: string) {
    await runAction(name, enableDaemon, { enabled: 'enabled' })
  }

  async function disable(name: string) {
    await runAction(name, disableDaemon, { enabled: 'disabled' })
  }

  async function restart(name: string) {
    await withPending(name, async () => {
      try {
        await restartDaemon(name)
        const fresh = await listDaemons()
        const updated = fresh.find((d) => d.name === name)
        if (updated) patchDaemon(name, updated)
        error.value = null
      } catch (e) {
        error.value = e instanceof Error ? e.message : 'Failed to restart daemon'
      }
    })
  }

  async function toggleEnabled(name: string) {
    const daemon = daemons.value.find((d) => d.name === name)
    if (!daemon || daemon.enabled === 'static') return
    daemon.enabled === 'enabled' ? await disable(name) : await enable(name)
  }

  return {
    daemons, filtered, filteredFavorites, filteredNonFav, allFilteredNonFav,
    hasMore, hasActiveFilters, favorites, favoritesArray,
    loading, error, search, searchDebounced,
    pendingNames, stats, filters, viewMode,
    fetch, collectNow, loadMore, resetFilters,
    toggleStatusFilter, toggleEnabledFilter,
    toggleFavorite, isFavorite,
    start, stop, restart, enable, disable, toggleEnabled,
  }
})