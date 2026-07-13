import { describe, it, expect, beforeEach, vi } from 'vitest' // Importato 'vi'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import DockerList from '@/modules/docker/components/DockerList.vue'
import { useDockerStore } from '@/modules/docker/store'

// Stubs dei sotto-componenti e icone Lucide
const LucideStub = { template: '<div><slot /></div>' }
const PullImageDialogStub = { template: '<div class="mock-pull-dialog" />' }
const ContainerItemStub = { template: '<div class="mock-container-item">{{ container.name }}</div>', props: ['container'] }
const ContainerCardStub = { template: '<div class="mock-container-card">{{ container.name }}</div>', props: ['container'] }
const ImageItemStub = { template: '<div class="mock-image-item">{{ image.id }}</div>', props: ['image'] }
const ImageCardStub = { template: '<div class="mock-image-card">{{ image.id }}</div>', props: ['image'] }

describe('DockerList.vue', () => {
  let pinia: ReturnType<typeof createTestingPinia>

  beforeEach(() => {
    pinia = createTestingPinia({
      stubActions: false,
      createSpy: vi.fn, // Configurato createSpy con lo spy di Vitest
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
          favorites: new Set<string>(['1']),
          selectedContainerId: null,
          viewMode: 'list',
          loading: false
        }
      }
    })
  })

  const createWrapper = () => {
    return mount(DockerList, {
      global: {
        plugins: [pinia],
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
          SharedButton: { template: '<button><slot /></button>' },
          SharedEmpty: { template: '<div class="mock-empty"><slot name="title" /></div>' }
        }
      }
    })
  }

  it('mostra il conteggio totale corretto e suddivide i container in "Pinned" e "All" in modalità lista', () => {
    const wrapper = createWrapper()

    expect(wrapper.text()).toContain('2 containers')
    expect(wrapper.text()).toContain('1 pinned')
    expect(wrapper.text()).toContain('Pinned')
    expect(wrapper.text()).toContain('All')

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

    store.$patch({ viewMode: 'grid' })
    await nextTick()

    expect(wrapper.findAll('.mock-container-item')).toHaveLength(0)
    expect(wrapper.findAll('.mock-container-card')).toHaveLength(2)
  })

  it('modifica la viewMode dello store quando si cliccano i rispettivi bottoni di controllo', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()
    
    const buttons = wrapper.findAll('button')
    
    await buttons[1]!.trigger('click')
    expect(store.viewMode).toBe('grid')

    await buttons[0]!.trigger('click')
    expect(store.viewMode).toBe('list')
  })

  it('mostra i dettagli delle immagini quando la scheda attiva cambia in "images"', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()

    store.$patch({ activeTab: 'images' })
    await nextTick()

    expect(wrapper.text()).toContain('1 images')
    expect(wrapper.findComponent(PullImageDialogStub).exists()).toBe(true)
    expect(wrapper.findAll('.mock-image-item')).toHaveLength(1)
  })

  it('renderizza lo stato Skeleton animato durante il caricamento iniziale se le liste sono vuote', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()

    store.$patch({
      loading: true,
      containers: [],
      images: []
    })
    await nextTick()

    expect(wrapper.findAll('.animate-pulse')).toHaveLength(6)
  })

  it('mostra la schermata SharedEmpty personalizzata se non ci sono elementi disponibili', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()

    store.$patch({
      containers: [],
      images: []
    })
    await nextTick()

    const emptyState = wrapper.find('.mock-empty')
    expect(emptyState.exists()).toBe(true)
    expect(emptyState.text()).toContain('No containers found.')
  })
})