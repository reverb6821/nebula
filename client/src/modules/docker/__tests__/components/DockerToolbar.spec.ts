import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { nextTick } from 'vue'
import DockerToolbar from '../../components/DockerToolbar.vue'
import { useDockerStore } from '../../store'

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
      tabContainers: 'Containers', tabImages: 'Images', filterPlaceholder: 'Search…',
    },
  },
}

const SharedFilterStub = {
  name: 'SharedFilter',
  props: ['search', 'activeTab', 'placeholder', 'tabs'],
  emits: ['update:search', 'update:activeTab'],
  template: `<div class="stub" :data-tabs="JSON.stringify(tabs)" :data-search="search" :data-active-tab="activeTab" />`,
}

function mountToolbar() {
  const i18n = createI18n({ legacy: false, locale: 'en', messages })
  return mount(DockerToolbar, { global: { plugins: [i18n], stubs: { SharedFilter: SharedFilterStub } } })
}

describe('DockerToolbar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('genera le due tab (containers/images) con le label tradotte', () => {
    const wrapper = mountToolbar()
    const tabs = JSON.parse(wrapper.find('.stub').attributes('data-tabs')!)
    expect(tabs).toEqual([
      { value: 'containers', label: 'Containers' },
      { value: 'images', label: 'Images' },
    ])
  })

  it('collega search in v-model bidirezionale con lo store', async () => {
    const wrapper = mountToolbar()
    const store = useDockerStore()

    store.search = 'nginx'
    await nextTick()
    expect(wrapper.find('.stub').attributes('data-search')).toBe('nginx')

    wrapper.findComponent(SharedFilterStub).vm.$emit('update:search', 'redis')
    await nextTick()
    expect(store.search).toBe('redis')
  })

  it('collega activeTab in v-model bidirezionale con lo store', async () => {
    const wrapper = mountToolbar()
    const store = useDockerStore()

    expect(wrapper.find('.stub').attributes('data-active-tab')).toBe('containers')

    wrapper.findComponent(SharedFilterStub).vm.$emit('update:activeTab', 'images')
    await nextTick()
    expect(store.activeTab).toBe('images')
  })
})