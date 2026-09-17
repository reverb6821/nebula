import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { storage } from '@neutralinojs/lib'
import type { DockerImage, DockerContainer, ContainerStats, PullProgress } from '@/types/docker'
import { useAsyncState } from '@/composables/useAsyncState'
import { usePendingSet } from '@/composables/usePendingSet'
import {
  pingDocker,
  fetchImages,
  fetchContainers,
  fetchStats,
  fetchLogs,
  startContainer,
  stopContainer,
  restartContainer,
  removeContainer,
  removeImage,
  pullImage,
} from './composables/useDockerApi'

const STORAGE_KEY_VIEW = 'docker_view_mode'
const STORAGE_KEY_FAVS = 'docker_favorites'

// Persistenza via Neutralino.storage invece di localStorage: stessa
// motivazione e stesso pattern usati in modules/daemons/store.ts —
// dati su disco in .storage/, non nel profilo del webview.
async function loadFavorites(): Promise<Set<string>> {
  try {
    const raw = await storage.getData(STORAGE_KEY_FAVS)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
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

export const useDockerStore = defineStore('docker', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const connected = ref(false)

  // Prima: loading/error locali + un withPending scritto a mano quasi
  // identico a quello di daemons/processes store. Ora dai due
  // composable condivisi (vedi src/composables/).
  const { loading, error, run } = useAsyncState('Fetch failed')
  const { pending: pendingIds, withPending } = usePendingSet<string>()

  const images = ref<DockerImage[]>([])
  const containers = ref<DockerContainer[]>([])
  const stats = ref<Map<string, ContainerStats>>(new Map())
  const logs = ref<Map<string, string[]>>(new Map())

  const activeTab = ref<'containers' | 'images'>('containers')
  const search = ref('')
  const selectedContainerId = ref<string | null>(null)
  const pullProgress = ref<PullProgress | null>(null)
  const pulling = ref(false)
  const favorites = ref<Set<string>>(new Set())

  // Caricamento asincrono, stesso pattern di daemons/store.ts.
  loadFavorites().then((favs) => { favorites.value = favs })

  const viewMode = ref<'list' | 'grid'>('list')
  loadViewMode().then((v) => { viewMode.value = v })
  watch(viewMode, (v) => saveViewMode(v))

  // ─── Computed ─────────────────────────────────────────────────────────────
  const favoritesArray = computed(() => Array.from(favorites.value))

  const filteredContainers = computed(() => {
    const q = search.value.toLowerCase().trim()
    const all = q
      ? containers.value.filter((c) => c.name.includes(q) || c.image.includes(q))
      : containers.value
    const favs = all.filter((c) => favoritesArray.value.includes(c.id))
    const rest = all.filter((c) => !favoritesArray.value.includes(c.id))
    return [...favs, ...rest]
  })

  const filteredImages = computed(() => {
    const q = search.value.toLowerCase().trim()
    const all = q
      ? images.value.filter((img) => img.repoTags.some((t) => t.toLowerCase().includes(q)))
      : images.value
    const favs = all.filter((img) => favoritesArray.value.includes(img.id))
    const rest = all.filter((img) => !favoritesArray.value.includes(img.id))
    return [...favs, ...rest]
  })

  const runningCount = computed(
    () => containers.value.filter((c) => c.status === 'running').length,
  )

  const selectedContainer = computed(
    () => containers.value.find((c) => c.id === selectedContainerId.value) ?? null,
  )

  const selectedLogs = computed(
    () => (selectedContainerId.value ? (logs.value.get(selectedContainerId.value) ?? []) : []),
  )

  // ─── Favorites ────────────────────────────────────────────────────────────
  function toggleFavorite(id: string) {
    const next = new Set(favorites.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    favorites.value = next
    saveFavorites(next)
  }

  // Prima remove() e deleteImage() facevano favorites.value.delete(id)
  // direttamente sul Set esistente: nessuna reattività (Vue non
  // traccia le mutazioni interne di un Set) e nessuna persistenza
  // (saveFavorites non veniva mai chiamato) — un container/immagine
  // preferito e poi rimosso restava per sempre come voce orfana nello
  // storage. Stessa logica di riassegnazione già usata in
  // toggleFavorite, estratta qui per essere riusata da entrambi.
  function removeFavorite(id: string) {
    if (!favorites.value.has(id)) return
    const next = new Set(favorites.value)
    next.delete(id)
    favorites.value = next
    saveFavorites(next)
  }

  function isFavorite(id: string): boolean {
    return favoritesArray.value.includes(id)
  }

  // ─── Connect & fetch ──────────────────────────────────────────────────────
  async function connect() {
    const reachable = await run(() => pingDocker())
    connected.value = reachable === true
    if (!connected.value) {
      error.value = 'Docker not found. Make sure Docker is installed and running.'
      return
    }
    await refresh()
  }

  async function refresh() {
    if (!connected.value) return
    const result = await run(() => Promise.all([fetchImages(), fetchContainers()]))
    if (!result) return
    const [imgs, ctrs] = result
    images.value = imgs
    containers.value = ctrs
  }

  // ─── Stats polling ────────────────────────────────────────────────────────
  useIntervalFn(async () => {
    if (!connected.value) return
    const running = containers.value.filter((c) => c.status === 'running')
    const results = await Promise.allSettled(running.map((c) => fetchStats(c.id)))
    const next = new Map(stats.value)
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') next.set(running[i]!.id, r.value)
    })
    stats.value = next
  }, 3000)

  // ─── Logs polling ─────────────────────────────────────────────────────────
  useIntervalFn(async () => {
    if (!connected.value || !selectedContainerId.value) return
    try {
      const lines = await fetchLogs(selectedContainerId.value, 200)
      logs.value = new Map(logs.value).set(selectedContainerId.value, lines)
    } catch { /* ignore */ }
  }, 2000)

  // ─── Container actions ────────────────────────────────────────────────────
  async function start(id: string) {
    await withPending(id, async () => { await startContainer(id); await refresh() })
  }

  async function stop(id: string) {
    await withPending(id, async () => { await stopContainer(id); await refresh() })
  }

  async function restart(id: string) {
    await withPending(id, async () => { await restartContainer(id); await refresh() })
  }

  async function remove(id: string) {
    await withPending(id, async () => {
      await removeContainer(id)
      removeFavorite(id)
      if (selectedContainerId.value === id) selectedContainerId.value = null
      await refresh()
    })
  }

  // ─── Image actions ────────────────────────────────────────────────────────
  async function deleteImage(id: string) {
    await withPending(id, async () => {
      await removeImage(id)
      removeFavorite(id)
      await refresh()
    })
  }

  async function pull(name: string) {
    pulling.value = true
    pullProgress.value = null
    try {
      await pullImage(name, (p) => { pullProgress.value = p })
      await refresh()
    } finally {
      pulling.value = false
    }
  }

  // ─── Logs ─────────────────────────────────────────────────────────────────
  async function selectContainer(id: string | null) {
    selectedContainerId.value = id
    if (id && !logs.value.has(id)) {
      const lines = await fetchLogs(id, 200)
      logs.value = new Map(logs.value).set(id, lines)
    }
  }

  return {
    connected, loading, error,
    images, containers, stats,
    pendingIds, activeTab, search,
    selectedContainerId, selectedContainer,
    selectedLogs,
    filteredContainers, filteredImages,
    runningCount, pullProgress, pulling,
    favorites, favoritesArray,
    viewMode,
    connect, refresh,
    start, stop, restart, remove,
    deleteImage, pull, selectContainer,
    toggleFavorite, isFavorite,
  }
})