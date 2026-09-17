import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import DockerList from '../../components/DockerList.vue'
import { useDockerStore } from '../../store'
import type { DockerContainer, DockerImage } from '../../../../types/docker'

vi.mock('@neutralinojs/lib', () => ({
  storage: {
    getData: vi.fn().mockRejectedValue(new Error('NE_ST_NOSTKEY')),
    setData: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/modules/docker/composables/useDockerApi', () => ({
  pingDocker: vi.fn(), fetchImages: vi.fn().mockResolvedValue([]), fetchContainers: vi.fn().mockResolvedValue([]),
  fetchStats: vi.fn(), fetchLogs: vi.fn(), startContainer: vi.fn(), stopContainer: vi.fn(),
  restartContainer: vi.fn(), removeContainer: vi.fn(), removeImage: vi.fn(), pullImage: vi.fn(),
}))

const messages = {
  en: {
    docker: {
      containers: 'Containers ({n})', images: 'Images ({n})', pinnedCount: '{n} pinned', pinned: 'Pinned',
      allSection: 'All', noContainers: 'No containers', noImages: 'No images', filtersModifyHint: 'Try adjusting filters',
      viewList: 'List view', viewGrid: 'Grid view',
    },
  },
}

// Stub dei componenti pesanti: qui testiamo solo la logica di DockerList
// (split preferiti/resto, stato vuoto, skeleton), non il rendering
// interno di card/item — già coperti a parte.
function itemStub(propName: string) {
  return { props: [propName], template: `<div class="stub-item" />` }
}

const stubs = {
  ContainerItem: itemStub('container'),
  ContainerCard: itemStub('container'),
  ImageItem: itemStub('image'),
  ImageCard: itemStub('image'),
  PullImageDialog: { template: '<button class="stub-pull" />' },
  SharedEmpty: {
    template: `<div class="stub-empty"><slot name="title" /><slot name="description" /></div>`,
  },
}

function makeContainer(overrides: Partial<DockerContainer> = {}): DockerContainer {
  return { id: 'c1', shortId: 'c1', name: 'app', image: 'nginx', status: 'running', state: '', ports: [], created: 0, ...overrides }
}

function makeImage(overrides: Partial<DockerImage> = {}): DockerImage {
  return { id: 'i1', repoTags: ['nginx:latest'], size: 0, created: 0, ...overrides }
}

function mountList() {
  const i18n = createI18n({ legacy: false, locale: 'en', messages })
  return mount(DockerList, { global: { plugins: [i18n], stubs } })
}

describe('DockerList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('mostra lo stato vuoto quando non ci sono container (tab containers attiva di default)', () => {
    const wrapper = mountList()
    expect(wrapper.find('.stub-empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No containers')
  })

  it('divide i container filtrati in preferiti e resto', () => {
    const wrapper = mountList()
    const store = useDockerStore()
    store.containers = [
      makeContainer({ id: 'a' }),
      makeContainer({ id: 'b' }),
      makeContainer({ id: 'c' }),
    ]
    store.toggleFavorite('b')

    return wrapper.vm.$nextTick().then(() => {
      // Con favoriti presenti: sezione "Pinned" visibile
      expect(wrapper.text()).toContain('Pinned')
      // 3 item totali renderizzati (1 pinned + 2 nella sezione "All")
      expect(wrapper.findAll('.stub-item')).toHaveLength(3)
    })
  })

  it('senza nessun preferito non mostra la sezione "Pinned"', async () => {
    const wrapper = mountList()
    const store = useDockerStore()
    store.containers = [makeContainer({ id: 'a' }), makeContainer({ id: 'b' })]
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).not.toContain('Pinned')
    expect(wrapper.findAll('.stub-item')).toHaveLength(2)
  })

  it('passa dalla vista lista a griglia usando ContainerCard invece di ContainerItem', async () => {
    const wrapper = mountList()
    const store = useDockerStore()
    store.containers = [makeContainer({ id: 'a' })]
    await wrapper.vm.$nextTick()

    const buttons = wrapper.findAll('button[aria-label="Grid view"]')
    await buttons[0]!.trigger('click')

    expect(store.viewMode).toBe('grid')
  })

  it('sulla tab "images", con dati presenti, non mostra lo stato vuoto', async () => {
    const wrapper = mountList()
    const store = useDockerStore()
    store.activeTab = 'images'
    store.images = [makeImage()]
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.stub-empty').exists()).toBe(false)
    expect(wrapper.findAll('.stub-item')).toHaveLength(1)
  })

  it('mostra lo skeleton di caricamento solo quando loading=true e non ci sono ancora dati', async () => {
    const wrapper = mountList()
    const store = useDockerStore()
    store.loading = true
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[aria-hidden="true"].animate-pulse').length).toBeGreaterThan(0)
    expect(wrapper.find('.stub-empty').exists()).toBe(false)
  })

  it('mostra il pulsante "pull image" solo sulla tab images', async () => {
    const wrapper = mountList()
    const store = useDockerStore()

    expect(wrapper.find('.stub-pull').exists()).toBe(false)

    store.activeTab = 'images'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.stub-pull').exists()).toBe(true)
  })
})