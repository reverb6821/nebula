import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import { nextTick, defineComponent, computed } from 'vue'
import DockerList from '@/modules/docker/components/DockerList.vue'
import { useDockerStore } from '@/modules/docker/store'

// Stubs dei sotto-componenti e icone Lucide
const LucideStub = { template: '<div><slot /></div>' }
const PullImageDialogStub = { template: '<div class="mock-pull-dialog" />' }
const ContainerItemStub = defineComponent({
  name: 'ContainerItem',
  props: ['container'],
  template: '<div class="mock-container-item">{{ container.name }}</div>'
})
const ContainerCardStub = defineComponent({
  name: 'ContainerCard',
  props: ['container'],
  template: '<div class="mock-container-card">{{ container.name }}</div>'
})
const ImageItemStub = defineComponent({
  name: 'ImageItem',
  props: ['image'],
  template: '<div class="mock-image-item">{{ image.id }}</div>'
})
const ImageCardStub = defineComponent({
  name: 'ImageCard',
  props: ['image'],
  template: '<div class="mock-image-card">{{ image.id }}</div>'
})

describe('DockerList.vue', () => {
  let pinia: ReturnType<typeof createTestingPinia>

  // Configurazione minima i18n per coprire le chiavi del componente
  const i18n = createI18n({
    legacy: false,
    locale: 'it',
    messages: {
      it: {
        docker: {
          containers: '{n} contenitori',
          pinnedCount: '{n} bloccati',
          images: '{n} immagini',
          pinned: 'Bloccati',
          allSection: 'Tutti',
          noContainers: 'Nessun contenitore trovato.',
          noImages: 'Nessuna immagine trovata.',
          filtersModifyHint: 'Modifica i filtri'
        }
      }
    }
  })

  beforeEach(() => {
    pinia = createTestingPinia({
      stubActions: false,
      createSpy: vi.fn,
      initialState: {
        docker: {
          activeTab: 'containers',
          containers: [
            { id: '1', shortId: '1', name: 'nginx-proxy', image: 'nginx:latest', status: 'running', state: 'running', ports: [], created: 0 },
            { id: '2', shortId: '2', name: 'db-postgres', image: 'postgres:15', status: 'exited', state: 'exited', ports: [], created: 0 }
          ],
          images: [
            { id: 'img-1', repoTags: ['nginx:latest'], size: 1000, created: 12345 }
          ],
          pendingIds: new Set<string>(),
          stats: new Map(),
          selectedContainerId: null,
          viewMode: 'list',
          loading: false
        }
      }
    })

    const store = useDockerStore()

    // Usando computed reali di Vue agganciate allo store mockato,
    // storeToRefs le intercetta correttamente senza generare undefined
    Object.defineProperty(store, 'filteredContainers', {
      value: computed(() => store.containers),
      writable: true,
      configurable: true
    })

    Object.defineProperty(store, 'filteredImages', {
      value: computed(() => store.images),
      writable: true,
      configurable: true
    })

    Object.defineProperty(store, 'favoritesArray', {
      value: computed(() => ['1']),
      writable: true,
      configurable: true
    })
  })

  const createWrapper = () => {
    return mount(DockerList, {
      global: {
        plugins: [pinia, i18n],
        stubs: {
          Box: LucideStub,
          LayoutGrid: LucideStub,
          List: LucideStub,
          Star: LucideStub,
          PullImageDialog: PullImageDialogStub,
          ContainerItem: ContainerItemStub,
          ContainerCard: ContainerCardStub,
          ImageItem: ImageItemStub,
          ImageCard: ImageCardStub,
          ItemGroup: { template: '<div><slot /></div>' },
          SharedButton: { template: '<button class="shared-btn"><slot /></button>' },
          SharedEmpty: { template: '<div class="mock-empty"><slot name="title" /></div>' }
        }
      }
    })
  }

  it('mostra il conteggio totale corretto e suddivide i container in "Pinned" e "All" in modalità lista', () => {
    const wrapper = createWrapper()

    expect(wrapper.text()).toContain('2 contenitori')
    expect(wrapper.text()).toContain('1 bloccati')
    expect(wrapper.text()).toContain('Bloccati')
    expect(wrapper.text()).toContain('Tutti')

    const items = wrapper.findAll('.mock-container-item')
    expect(items).toHaveLength(2)
    
    expect(items[0]!.text()).toBe('nginx-proxy')
    expect(items[1]!.text()).toBe('db-postgres')
  })

  it('alterna correttamente il layout passando a ContainerCard quando viewMode diventa "grid"', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()

    expect(wrapper.findAll('.mock-container-item')).toHaveLength(2)
    expect(wrapper.findAll('.mock-container-card')).toHaveLength(0)

    store.viewMode = 'grid'
    await nextTick()

    expect(wrapper.findAll('.mock-container-item')).toHaveLength(0)
    expect(wrapper.findAll('.mock-container-card')).toHaveLength(2)
  })

  it('modifica la viewMode dello store quando si cliccano i rispettivi bottoni di controllo', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()
    
    const buttons = wrapper.findAll('.shared-btn')
    
    await buttons[1]!.trigger('click')
    expect(store.viewMode).toBe('grid')

    await buttons[0]!.trigger('click')
    expect(store.viewMode).toBe('list')
  })

  it('mostra i dettagli delle immagini quando la scheda attiva cambia in "images"', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()

    store.activeTab = 'images'
    await nextTick()

    expect(wrapper.text()).toContain('1 immagini')
    expect(wrapper.findComponent(PullImageDialogStub).exists()).toBe(true)
    expect(wrapper.findAll('.mock-image-item')).toHaveLength(1)
  })

  it('renderizza lo stato Skeleton animato durante il caricamento iniziale se le liste sono vuote', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()

    store.loading = true
    store.containers = []
    store.images = []
    await nextTick()

    expect(wrapper.findAll('.animate-pulse')).toHaveLength(6)
  })

  it('mostra la schermata SharedEmpty personalizzata se non ci sono elementi disponibili', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()

    store.containers = []
    store.images = []
    await nextTick()

    const emptyState = wrapper.find('.mock-empty')
    expect(emptyState.exists()).toBe(true)
    expect(emptyState.text()).toContain('Nessun contenitore trovato.')
  })
})