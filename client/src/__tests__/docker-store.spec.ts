import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useDockerStore } from '@/modules/docker/store'
import * as dockerApi from '@/modules/docker/composables/useDockerApi'

const mockApi = {
    pingDocker: vi.spyOn(dockerApi, 'pingDocker'),
    fetchImages: vi.spyOn(dockerApi, 'fetchImages'),
    fetchContainers: vi.spyOn(dockerApi, 'fetchContainers'),
    fetchStats: vi.spyOn(dockerApi, 'fetchStats'),
    fetchLogs: vi.spyOn(dockerApi, 'fetchLogs'),
    startContainer: vi.spyOn(dockerApi, 'startContainer'),
    stopContainer: vi.spyOn(dockerApi, 'stopContainer'),
    restartContainer: vi.spyOn(dockerApi, 'restartContainer'),
    removeContainer: vi.spyOn(dockerApi, 'removeContainer'),
    removeImage: vi.spyOn(dockerApi, 'removeImage'),
    pullImage: vi.spyOn(dockerApi, 'pullImage'),
}

const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value },
        removeItem: (key: string) => { delete store[key] },
        clear: () => { store = {} },
    }
})()
vi.stubGlobal('localStorage', localStorageMock)

describe('useDockerStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        localStorageMock.clear()
        vi.clearAllMocks()
        vi.useFakeTimers()
    })

    // ─── Stato Iniziale e LocalStorage ────────────────────────────────────────
    describe('Stato Iniziale', () => {
        it('dovrebbe caricare il valore corretto di viewMode e preferiti da localStorage', () => {
            localStorageMock.setItem('docker_view_mode', 'grid')
            localStorageMock.setItem('docker_favorites', JSON.stringify(['id-1']))

            const store = useDockerStore()

            expect(store.viewMode).toBe('grid')
            expect(store.favoritesArray).toContain('id-1')
        })

        it('dovrebbe salvare viewMode su localStorage quando cambia', async () => {
            const store = useDockerStore()
            store.viewMode = 'grid'

            await nextTick()

            expect(localStorageMock.getItem('docker_view_mode')).toBe('grid')
        })
    })

    // ─── Connessione e Refresh ────────────────────────────────────────────────
    describe('Connessione e Refresh', () => {
        it('dovrebbe gestire la connessione fallita', async () => {
            mockApi.pingDocker.mockResolvedValue(false)
            const store = useDockerStore()

            await store.connect()

            expect(store.connected).toBe(false)
            expect(store.error).toContain('Docker not found')
        })

        it('dovrebbe connettersi con successo e caricare dati', async () => {
            mockApi.pingDocker.mockResolvedValue(true)
            mockApi.fetchImages.mockResolvedValue([
                {
                    id: 'img-1',
                    repoTags: ['nginx:latest'],
                    size: 100000,
                    created: 123456
                }
            ])
            mockApi.fetchContainers.mockResolvedValue([
                {
                    id: 'c-1',
                    shortId: 'c1',
                    name: 'web',
                    image: 'nginx',
                    status: 'running',
                    state: 'running',
                    ports: [],
                    created: 123456
                }
            ])

            const store = useDockerStore()
            await store.connect()

            expect(store.connected).toBe(true)
            expect(store.images).toHaveLength(1)
            expect(store.containers).toHaveLength(1)
            expect(store.runningCount).toBe(1)
        })
    })

    // ─── Preferiti e Filtri ───────────────────────────────────────────────────
    describe('Preferiti e Filtri', () => {
        it('dovrebbe alternare (toggle) lo stato di preferito di un elemento', () => {
            const store = useDockerStore()
            expect(store.isFavorite('c-1')).toBe(false)

            store.toggleFavorite('c-1')
            expect(store.isFavorite('c-1')).toBe(true)
            expect(JSON.parse(localStorageMock.getItem('docker_favorites')!)).toContain('c-1')

            store.toggleFavorite('c-1')
            expect(store.isFavorite('c-1')).toBe(false)
        })

        it('dovrebbe ordinare i container filtrati portando i preferiti in alto', () => {
            const store = useDockerStore()

            // Aggiungi le proprietà mancanti richieste dal tipo DockerContainer
            store.containers = [
                {
                    id: 'c-normal',
                    shortId: 'c-norm',
                    name: 'app-normal',
                    image: 'node',
                    status: 'exited',
                    state: 'exited',
                    ports: [],
                    created: 123456
                },
                {
                    id: 'c-fav',
                    shortId: 'c-fv',
                    name: 'app-fav',
                    image: 'redis',
                    status: 'running',
                    state: 'running',
                    ports: [],
                    created: 123456
                }
            ]
            store.toggleFavorite('c-fav')

            // Verifica prima che l'array non sia vuoto e che l'elemento esista
            expect(store.filteredContainers.length).toBe(2)
            expect(store.filteredContainers[0]?.id).toBe('c-fav')
        })

        it('dovrebbe filtrare i container tramite la stringa di ricerca', () => {
            const store = useDockerStore()
            store.containers = [
                {
                    id: 'c-1',
                    shortId: 'c1',
                    name: 'frontend',
                    image: 'nginx',
                    status: 'running',
                    state: 'running',
                    ports: [],
                    created: 123456
                },
                {
                    id: 'c-2',
                    shortId: 'c2',
                    name: 'backend',
                    image: 'node',
                    status: 'running',
                    state: 'running',
                    ports: [],
                    created: 123456
                }
            ]

            store.search = 'front'
            expect(store.filteredContainers).toHaveLength(1)
            expect(store.filteredContainers[0]?.id).toBe('c-1')
        })
    })

    // ─── Azioni sui Container ─────────────────────────────────────────────────
    describe('Azioni sui Container e Immagini', () => {
        beforeEach(() => {
            mockApi.pingDocker.mockResolvedValue(true)
            mockApi.fetchImages.mockResolvedValue([])
            mockApi.fetchContainers.mockResolvedValue([])
        })

        it('dovrebbe avviare un container aggiungendolo temporaneamente ai pendingIds', async () => {
            const store = useDockerStore()
            store.connected = true

            mockApi.startContainer.mockImplementation(async () => {
                expect(store.pendingIds.has('c-1')).toBe(true)
            })

            await store.start('c-1')
            expect(store.pendingIds.has('c-1')).toBe(false)
            expect(mockApi.startContainer).toHaveBeenCalledWith('c-1')
        })

        it('dovrebbe rimuovere un container, deselezionarlo e toglierlo dai preferiti', async () => {
            const store = useDockerStore()
            store.connected = true
            store.selectedContainerId = 'c-1'
            store.toggleFavorite('c-1')

            await store.remove('c-1')

            expect(store.selectedContainerId).toBeNull()
            expect(store.isFavorite('c-1')).toBe(false)
            expect(mockApi.removeContainer).toHaveBeenCalledWith('c-1')
        })

        it('dovrebbe eseguire il pull di un immagine aggiornando il progresso', async () => {
            const store = useDockerStore()

            mockApi.pullImage.mockImplementation(async (name, progressCb) => {
                // Modificato per allinearsi alle proprietà reali dell'interfaccia PullProgress
                progressCb({ status: 'Downloading', done: false })
            })

            const pullPromise = store.pull('ubuntu')
            expect(store.pulling).toBe(true)

            await pullPromise
            expect(store.pulling).toBe(false)
            expect(store.pullProgress).toEqual({ status: 'Downloading', done: false })
        })
    })

    // ─── Log e Selezione ──────────────────────────────────────────────────────
    describe('Log e Selezione', () => {
        it('dovrebbe recuperare i log quando si seleziona un container', async () => {
            mockApi.fetchLogs.mockResolvedValue(['line 1', 'line 2'])
            const store = useDockerStore()

            store.containers = [{
                id: 'c-1',
                shortId: 'c1',
                name: 'app',
                image: 'node',
                status: 'running',
                state: 'running',
                ports: [],
                created: 123456
            }]

            await store.selectContainer('c-1')

            expect(store.selectedContainerId).toBe('c-1')
            expect(store.selectedContainer?.id).toBe('c-1')
            expect(store.selectedLogs).toEqual(['line 1', 'line 2'])
        })
    })

    // ─── Interval Polling (VueUse) ────────────────────────────────────────────
    describe('Polling con Interval', () => {
        it('dovrebbe fare il polling delle statistiche per i container avviati', async () => {
            const store = useDockerStore()
            store.connected = true
            store.containers = [
                {
                    id: 'c-running',
                    shortId: 'c-run',
                    name: 'app1',
                    image: 'node',
                    status: 'running',
                    state: 'running',
                    ports: [],
                    created: 123456
                },
                {
                    id: 'c-exited',
                    shortId: 'c-stop',
                    name: 'app2',
                    image: 'nginx',
                    status: 'exited',
                    state: 'exited',
                    ports: [],
                    created: 123456
                }
            ]

            // Applica il cast "as any" o "as ContainerStats" per silenziare l'errore di TypeScript
            mockApi.fetchStats.mockResolvedValue({ cpu: 10, memory: 50 } as any)

            await vi.advanceTimersByTimeAsync(3000)

            expect(mockApi.fetchStats).toHaveBeenCalledWith('c-running')
            expect(mockApi.fetchStats).not.toHaveBeenCalledWith('c-exited')
            expect(store.stats.get('c-running')).toEqual({ cpu: 10, memory: 50 })
        })

        it('dovrebbe fare il polling dei log se un container è selezionato', async () => {
            const store = useDockerStore()
            store.connected = true
            store.selectedContainerId = 'c-1'
            mockApi.fetchLogs.mockResolvedValue(['nuova riga log'])

            await vi.advanceTimersByTimeAsync(2000)

            expect(mockApi.fetchLogs).toHaveBeenCalledWith('c-1', 200)
            expect(store.selectedLogs).toContain('nuova riga log')
        })
    })
})