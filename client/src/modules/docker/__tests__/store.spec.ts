import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { useDockerStore } from '@/modules/docker/store'
import type { DockerContainer, DockerImage } from '@/types/docker'

vi.mock('@neutralinojs/lib', () => ({
  storage: {
    getData: vi.fn().mockRejectedValue(new Error('NE_ST_NOSTKEY')),
    setData: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/modules/docker/composables/useDockerApi', () => ({
  pingDocker: vi.fn(),
  fetchImages: vi.fn(),
  fetchContainers: vi.fn(),
  fetchStats: vi.fn(),
  fetchLogs: vi.fn(),
  startContainer: vi.fn(),
  stopContainer: vi.fn(),
  restartContainer: vi.fn(),
  removeContainer: vi.fn(),
  removeImage: vi.fn(),
  pullImage: vi.fn(),
}))

import {
  pingDocker,
  fetchImages,
  fetchContainers,
  fetchLogs,
  startContainer,
  stopContainer,
  restartContainer,
  removeContainer,
  removeImage,
  pullImage,
} from '@/modules/docker/composables/useDockerApi'

const mockPingDocker = vi.mocked(pingDocker)
const mockFetchImages = vi.mocked(fetchImages)
const mockFetchContainers = vi.mocked(fetchContainers)
const mockFetchLogs = vi.mocked(fetchLogs)
const mockStartContainer = vi.mocked(startContainer)
const mockStopContainer = vi.mocked(stopContainer)
const mockRestartContainer = vi.mocked(restartContainer)
const mockRemoveContainer = vi.mocked(removeContainer)
const mockRemoveImage = vi.mocked(removeImage)
const mockPullImage = vi.mocked(pullImage)

function makeContainer(overrides: Partial<DockerContainer> = {}): DockerContainer {
  return {
    id: 'c1', shortId: 'c1', name: 'app', image: 'nginx:latest',
    status: 'running', state: 'Up 1 hour', ports: [], created: 0,
    ...overrides,
  }
}

function makeImage(overrides: Partial<DockerImage> = {}): DockerImage {
  return { id: 'img1', repoTags: ['nginx:latest'], size: 0, created: 0, ...overrides }
}

describe('useDockerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockFetchImages.mockResolvedValue([])
    mockFetchContainers.mockResolvedValue([])
  })

  describe('connect', () => {
    it('se pingDocker fallisce, imposta connected=false e un messaggio di errore, senza fare refresh', async () => {
      mockPingDocker.mockResolvedValue(false)
      const store = useDockerStore()

      await store.connect()

      expect(store.connected).toBe(false)
      expect(store.error).toContain('Docker not found')
      expect(mockFetchContainers).not.toHaveBeenCalled()
    })

    it('se pingDocker riesce, imposta connected=true e fa il refresh (immagini + container)', async () => {
      mockPingDocker.mockResolvedValue(true)
      mockFetchContainers.mockResolvedValue([makeContainer()])
      mockFetchImages.mockResolvedValue([makeImage()])
      const store = useDockerStore()

      await store.connect()

      expect(store.connected).toBe(true)
      expect(store.error).toBeNull()
      expect(store.containers).toHaveLength(1)
      expect(store.images).toHaveLength(1)
    })
  })

  describe('refresh', () => {
    it('non fa nulla se non connesso', async () => {
      const store = useDockerStore()
      await store.refresh()
      expect(mockFetchContainers).not.toHaveBeenCalled()
    })

    it('mantiene i dati precedenti e registra lerrore se il refresh fallisce', async () => {
      mockFetchContainers.mockRejectedValue(new Error('refresh failed'))
      const store = useDockerStore()
      store.connected = true
      store.containers = [makeContainer({ id: 'existing' })]

      await store.refresh()

      expect(store.containers.map((container) => container.id)).toEqual(['existing'])
      expect(store.error).toBe('refresh failed')
      expect(store.loading).toBe(false)
    })
  })

  describe('filteredContainers / filteredImages', () => {
    it('mette sempre i preferiti in cima, indipendentemente dall\'ordine originale', async () => {
      const store = useDockerStore()
      store.containers = [
        makeContainer({ id: 'a', name: 'alpha' }),
        makeContainer({ id: 'b', name: 'beta' }),
        makeContainer({ id: 'c', name: 'gamma' }),
      ]
      store.toggleFavorite('c')

      expect(store.filteredContainers.map((c) => c.id)).toEqual(['c', 'a', 'b'])
    })

    it('filtra i container per nome o immagine (case-insensitive)', () => {
      const store = useDockerStore()
      store.containers = [
        makeContainer({ id: 'a', name: 'my-nginx', image: 'nginx:latest' }),
        makeContainer({ id: 'b', name: 'redis', image: 'redis:7' }),
      ]

      store.search = 'nginx'
      expect(store.filteredContainers.map((c) => c.id)).toEqual(['a'])
    })

    it('filtra le immagini per repoTags', () => {
      const store = useDockerStore()
      store.images = [
        makeImage({ id: 'a', repoTags: ['nginx:latest'] }),
        makeImage({ id: 'b', repoTags: ['redis:7'] }),
      ]

      store.search = 'redis'
      expect(store.filteredImages.map((i) => i.id)).toEqual(['b'])
    })
  })

  describe('runningCount / selectedContainer / selectedLogs', () => {
    it('conta solo i container con status running', () => {
      const store = useDockerStore()
      store.containers = [
        makeContainer({ id: 'a', status: 'running' }),
        makeContainer({ id: 'b', status: 'exited' }),
        makeContainer({ id: 'c', status: 'running' }),
      ]
      expect(store.runningCount).toBe(2)
    })

    it('selectedContainer torna null se nessun container corrisponde', () => {
      const store = useDockerStore()
      store.containers = [makeContainer({ id: 'a' })]
      store.selectedContainerId = 'inesistente'
      expect(store.selectedContainer).toBeNull()
    })

    it('selectedLogs torna [] se non c\'è un container selezionato', () => {
      const store = useDockerStore()
      expect(store.selectedLogs).toEqual([])
    })
  })

  describe('favorites', () => {
    it('toggleFavorite aggiunge e rimuove dal set in modo reattivo', () => {
      const store = useDockerStore()
      store.toggleFavorite('a')
      expect(store.isFavorite('a')).toBe(true)
      store.toggleFavorite('a')
      expect(store.isFavorite('a')).toBe(false)
    })

    describe('logs', () => {
      it('selectContainer carica i log una sola volta e li espone', async () => {
        mockFetchLogs.mockResolvedValue(['line 1', 'line 2'])
        const store = useDockerStore()

        await store.selectContainer('a')
        await store.selectContainer('a')

        expect(mockFetchLogs).toHaveBeenCalledTimes(1)
        expect(store.selectedContainerId).toBe('a')
        expect(store.selectedLogs).toEqual(['line 1', 'line 2'])
      })

      it('selectContainer mantiene il container selezionato se il caricamento log fallisce', async () => {
        mockFetchLogs.mockRejectedValue(new Error('logs failed'))
        const store = useDockerStore()

        await expect(store.selectContainer('a')).rejects.toThrow('logs failed')

        expect(store.selectedContainerId).toBe('a')
        expect(store.selectedLogs).toEqual([])
      })
    })

    it('remove() pulisce anche il preferito orfano, non solo il container', async () => {
      mockRemoveContainer.mockResolvedValue(undefined)
      const store = useDockerStore()
      store.containers = [makeContainer({ id: 'a' })]
      store.toggleFavorite('a')
      expect(store.isFavorite('a')).toBe(true)

      await store.remove('a')

      expect(store.isFavorite('a')).toBe(false)
    })

    it('remove() deseleziona il container se era quello selezionato', async () => {
      mockRemoveContainer.mockResolvedValue(undefined)
      const store = useDockerStore()
      store.selectedContainerId = 'a'

      await store.remove('a')

      expect(store.selectedContainerId).toBeNull()
    })
  })

  describe('azioni container', () => {
    it('start/stop/restart chiamano la rispettiva API e poi rifanno il refresh', async () => {
      mockStartContainer.mockResolvedValue(undefined)
      mockStopContainer.mockResolvedValue(undefined)
      mockRestartContainer.mockResolvedValue(undefined)
      const store = useDockerStore()
      store.connected = true

      await store.start('a')
      expect(mockStartContainer).toHaveBeenCalledWith('a')

      await store.stop('a')
      expect(mockStopContainer).toHaveBeenCalledWith('a')

      await store.restart('a')
      expect(mockRestartContainer).toHaveBeenCalledWith('a')

      expect(mockFetchContainers).toHaveBeenCalledTimes(3)
    })

    it('deleteImage rimuove l\'immagine, pulisce i preferiti e rifà il refresh', async () => {
      mockRemoveImage.mockResolvedValue(undefined)
      const store = useDockerStore()
      store.connected = true
      store.toggleFavorite('img1')

      await store.deleteImage('img1')

      expect(mockRemoveImage).toHaveBeenCalledWith('img1')
      expect(store.isFavorite('img1')).toBe(false)
    })
  })

  describe('pull', () => {
    it('imposta pulling=true durante l\'operazione e lo riporta a false alla fine', async () => {
      let resolvePull: () => void
      mockPullImage.mockImplementation(() => new Promise((res) => { resolvePull = () => res(undefined) }))
      const store = useDockerStore()

      const promise = store.pull('nginx:latest')
      await nextTick()
      expect(store.pulling).toBe(true)

      resolvePull!()
      await promise

      expect(store.pulling).toBe(false)
    })

    it('inoltra i progressi di pullImage a pullProgress', async () => {
      mockPullImage.mockImplementation(async (_name, onProgress) => {
        onProgress({ status: 'downloading', done: false })
        onProgress({ status: 'done', done: true })
      })
      const store = useDockerStore()

      await store.pull('nginx:latest')

      expect(store.pullProgress).toEqual({ status: 'done', done: true })
    })

    it('pulling torna false anche se pullImage lancia un errore', async () => {
      mockPullImage.mockRejectedValue(new Error('pull failed'))
      const store = useDockerStore()

      await expect(store.pull('bad:tag')).rejects.toThrow()
      expect(store.pulling).toBe(false)
    })
  })

  describe('viewMode', () => {
    it('è persistito su Neutralino.storage al cambio', async () => {
      const { storage } = await import('@neutralinojs/lib')
      const store = useDockerStore()
      await flushPromises()

      store.viewMode = 'grid'
      await nextTick()

      expect(vi.mocked(storage.setData)).toHaveBeenCalledWith('docker_view_mode', 'grid')
    })
  })
})