import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDaemonsStore } from '@/modules/daemons/store'
import * as actions from '@/modules/daemons/composables/useDaemonAction'

// Effettuiamo il mock dei composable che eseguono comandi di sistema
vi.mock('@/modules/daemons/composables/useDaemonAction', () => ({
  listDaemons: vi.fn(),
  startDaemon: vi.fn(),
  stopDaemon: vi.fn(),
  restartDaemon: vi.fn(),
  enableDaemon: vi.fn(),
  disableDaemon: vi.fn(),
}))

const mockDaemons = [
  { name: 'nginx', description: 'Web Server', status: 'active', enabled: 'enabled' },
  { name: 'postgresql', description: 'DB Server', status: 'active', enabled: 'disabled' },
  { name: 'redis', description: 'Cache', status: 'inactive', enabled: 'static' },
  { name: 'docker', description: 'Containers', status: 'failed', enabled: 'enabled' },
]

describe('useDaemonsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  describe('Inizializzazione e Stato Iniziale', () => {
    it('imposta i valori di default corretti', () => {
      const store = useDaemonsStore()
      expect(store.daemons).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.search).toBe('')
      expect(store.viewMode).toBe('list')
    })

    it('recupera i favoriti memorizzati nel localStorage', () => {
      localStorage.setItem('daemons_favorites', JSON.stringify(['nginx']))
      const store = useDaemonsStore()
      expect(store.isFavorite('nginx')).toBe(true)
    })
  })

  describe('Logica di Fetching dei Daemon', () => {
    it('aggiorna correttamente la lista daemons in caso di successo', async () => {
      vi.mocked(actions.listDaemons).mockResolvedValue(mockDaemons as any)
      const store = useDaemonsStore()

      const fetchPromise = store.fetch()
      expect(store.loading).toBe(true)
      
      await fetchPromise
      expect(store.loading).toBe(false)
      expect(store.daemons).toHaveLength(4)
      expect(store.error).toBeNull()
    })

    it('gestisce gli errori generati durante il caricamento', async () => {
      vi.mocked(actions.listDaemons).mockRejectedValue(new Error('Errore di sistema'))
      const store = useDaemonsStore()

      await store.fetch()
      expect(store.loading).toBe(false)
      expect(store.error).toBe('Errore di sistema')
    })
  })

describe('Filtraggio e Ricerca (Debounced)', () => {
    beforeEach(() => {
      vi.mocked(actions.listDaemons).mockResolvedValue(mockDaemons as any)
    })

    it('filtra i daemon per testo (search) rispettando il debouncing', async () => {
      const store = useDaemonsStore()
      await store.fetch()

      store.search = 'web'
      expect(store.stats.matching).toBe(4) // Non ancora applicato senza avanzamento tempo

      // Avanza i timer in modo asincrono per permettere a Vue di aggiornare la reattività
      await vi.advanceTimersByTimeAsync(300)
      
      expect(store.stats.matching).toBe(1)
      expect(store.filtered[0]?.name).toBe('nginx')
    })

    it('applica correttamente i filtri combinati di status e abilitazione', async () => {
      const store = useDaemonsStore()
      await store.fetch()

      store.toggleStatusFilter('active')
      store.toggleEnabledFilter('disabled')
      
      await vi.advanceTimersByTimeAsync(300)

      expect(store.stats.matching).toBe(1)
      expect(store.filtered[0]?.name).toBe('postgresql')
    })
  })
  describe('Gestione dei Preferiti (Favorites)', () => {
    beforeEach(() => {
      vi.mocked(actions.listDaemons).mockResolvedValue(mockDaemons as any)
    })

    it('aggiunge e rimuove elementi modificando il localStorage', async () => {
      const store = useDaemonsStore()
      await store.fetch()

      store.toggleFavorite('redis')
      expect(store.isFavorite('redis')).toBe(true)
      expect(localStorage.getItem('daemons_favorites')).toContain('redis')

      store.toggleFavorite('redis')
      expect(store.isFavorite('redis')).toBe(false)
    })

    it('separa correttamente i preferiti piazzandoli in cima alla lista', async () => {
      const store = useDaemonsStore()
      await store.fetch()

      store.toggleFavorite('redis')
      
      expect(store.filteredFavorites).toHaveLength(1)
      expect(store.filteredFavorites[0]?.name).toBe('redis')
      expect(store.filteredNonFav).toHaveLength(3)
    })
  })

  describe('Paginazione e Reset', () => {
    it('incrementa correttamente la pagina e calcola hasMore', () => {
      const store = useDaemonsStore()
      // Generiamo una lista che superi il PAGE_SIZE (12)
      store.daemons = Array.from({ length: 15 }, (_, i) => ({
        name: `daemon-${i}`,
        description: '',
        status: 'active',
        enabled: 'enabled'
      })) as any

      expect(store.hasMore).toBe(true)
      expect(store.filteredNonFav).toHaveLength(12)

      store.loadMore()
      expect(store.filteredNonFav).toHaveLength(15)
      expect(store.hasMore).toBe(false)
    })

    it('resetta tutti i filtri allo stato originario', () => {
      const store = useDaemonsStore()
      store.search = 'nginx'
      store.toggleStatusFilter('active')

      store.resetFilters()
      expect(store.search).toBe('')
      expect(store.filters.status).toEqual([])
    })
  })

  describe('Azioni di Controllo dei Daemon', () => {
    beforeEach(() => {
      vi.mocked(actions.listDaemons).mockResolvedValue(mockDaemons as any)
    })

    it('avvia un daemon gestendo lo stato pending e aggiornando lo status', async () => {
      const store = useDaemonsStore()
      await store.fetch()

      const startPromise = store.start('redis')
      expect(store.pendingNames.has('redis')).toBe(true)

      await startPromise
      expect(store.pendingNames.has('redis')).toBe(false)
      expect(actions.startDaemon).toHaveBeenCalledWith('redis')
      expect(store.daemons.find(d => d.name === 'redis')?.status).toBe('active')
    })

    it('inverte correttamente lo stato tramite toggleEnabled', async () => {
      const store = useDaemonsStore()
      await store.fetch()

      // nginx è 'enabled', deve chiamare disableDaemon
      await store.toggleEnabled('nginx')
      expect(actions.disableDaemon).toHaveBeenCalledWith('nginx')
      expect(store.daemons.find(d => d.name === 'nginx')?.enabled).toBe('disabled')
    })

    it('ignora il toggleEnabled se il daemon ha uno stato statico', async () => {
      const store = useDaemonsStore()
      await store.fetch()

      // redis è 'static'
      await store.toggleEnabled('redis')
      expect(actions.enableDaemon).not.toHaveBeenCalled()
      expect(actions.disableDaemon).not.toHaveBeenCalled()
    })
  })
})