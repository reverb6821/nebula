import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import type { DockerImage, DockerContainer, ContainerStats, PullProgress } from '@/types/docker'
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

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVS)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveFavorites(favs: Set<string>) {
  localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify([...favs]))
}

export const useDockerStore = defineStore('docker', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  const connected = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const images = ref<DockerImage[]>([])
  const containers = ref<DockerContainer[]>([])
  const stats = ref<Map<string, ContainerStats>>(new Map())
  const logs = ref<Map<string, string[]>>(new Map())
  const pendingIds = ref<Set<string>>(new Set())

  const activeTab = ref<'containers' | 'images'>('containers')
  const search = ref('')
  const selectedContainerId = ref<string | null>(null)
  const pullProgress = ref<PullProgress | null>(null)
  const pulling = ref(false)
  const favorites = ref<Set<string>>(loadFavorites())

  const viewMode = ref<'list' | 'grid'>(
    (localStorage.getItem(STORAGE_KEY_VIEW) as 'list' | 'grid') || 'list',
  )
  watch(viewMode, (v) => localStorage.setItem(STORAGE_KEY_VIEW, v))

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

  function isFavorite(id: string): boolean {
    return favoritesArray.value.includes(id)
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  async function withPending<T>(id: string, fn: () => Promise<T>): Promise<T> {
    pendingIds.value = new Set([...pendingIds.value, id])
    try { return await fn() }
    finally {
      const next = new Set(pendingIds.value)
      next.delete(id)
      pendingIds.value = next
    }
  }

  // ─── Connect & fetch ──────────────────────────────────────────────────────
  async function connect() {
    error.value = null
    connected.value = await pingDocker()
    if (!connected.value) {
      error.value = 'Docker not found. Make sure Docker is installed and running.'
      return
    }
    await refresh()
  }

  async function refresh() {
    if (!connected.value) return
    loading.value = true
    try {
      const [imgs, ctrs] = await Promise.all([fetchImages(), fetchContainers()])
      images.value = imgs
      containers.value = ctrs
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Fetch failed'
    } finally {
      loading.value = false
    }
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
      favorites.value.delete(id)
      if (selectedContainerId.value === id) selectedContainerId.value = null
      await refresh()
    })
  }

  // ─── Image actions ────────────────────────────────────────────────────────
  async function deleteImage(id: string) {
    await withPending(id, async () => {
      await removeImage(id)
      favorites.value.delete(id)
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