import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import PullImageDialog from '../../components/PullImageDialog.vue'
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
  restartContainer: vi.fn(), removeContainer: vi.fn(), removeImage: vi.fn(),
  pullImage: vi.fn(),
}))

import { pullImage } from '../../composables/useDockerApi'
const mockPullImage = vi.mocked(pullImage)

const messages = {
  en: {
    docker: {
      pullImage: 'Pull image', pullImageTitle: 'Pull an image', pullConnecting: 'Connecting…',
      pullPulling: 'Pulling…', pullButton: 'Pull',
    },
  },
}

// Dialog/DialogTrigger/DialogContent di reka-ui forniscono context via
// provide/inject: qui non ci interessa testare l'overlay reale, solo la
// logica di PullImageDialog, quindi tutto l'albero è stubbato con
// pass-through minimi.
const stubs = {
  Dialog: { template: '<div><slot /></div>' },
  DialogTrigger: { template: '<div><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
  Transition: { template: '<div><slot /></div>' },
  Input: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @keydown.enter="$emit(\'keydown-enter\')" />',
  },
}

function mountDialog() {
  const i18n = createI18n({ legacy: false, locale: 'en', messages })
  return mount(PullImageDialog, { global: { plugins: [i18n], stubs } })
}

describe('PullImageDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('il bottone "Pull" è disabilitato finché il nome immagine è vuoto', async () => {
    const wrapper = mountDialog()
    const pullButton = wrapper.findAll('button').find((b) => b.text().includes('Pull') && !b.text().includes('image'))!

    expect(pullButton.attributes('disabled')).toBeDefined()

    await wrapper.find('input').setValue('nginx:latest')
    expect(pullButton.attributes('disabled')).toBeUndefined()
  })

  it('non chiama store.pull() se il nome è vuoto o solo spazi', async () => {
    const wrapper = mountDialog()
    await wrapper.find('input').setValue('   ')

    const pullButton = wrapper.findAll('button').find((b) => b.text().includes('Pull') && !b.text().includes('image'))!
    await pullButton.trigger('click')

    expect(mockPullImage).not.toHaveBeenCalled()
  })

  it('chiama store.pull() col nome trimmato', async () => {
    mockPullImage.mockResolvedValue(undefined)
    const wrapper = mountDialog()
    await wrapper.find('input').setValue('  nginx:latest  ')

    const pullButton = wrapper.findAll('button').find((b) => b.text().includes('Pull') && !b.text().includes('image'))!
    await pullButton.trigger('click')
    await flushPromises()

    expect(mockPullImage).toHaveBeenCalledWith('nginx:latest', expect.any(Function))
  })

  it('calcola progressPercent da progressDetail.current/total', async () => {
    mockPullImage.mockImplementation(async (_name, onProgress) => {
      onProgress({
        status: 'Downloading',
        done: false,
        id: 'layer1',
        progressDetail: { current: 50, total: 200 },
      })
    })
    const wrapper = mountDialog()
    await wrapper.find('input').setValue('nginx:latest')
    const pullButton = wrapper.findAll('button').find((b) => b.text().includes('Pull') && !b.text().includes('image'))!
    await pullButton.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('25%')
  })

  it('progressPercent è null (barra assente) se progressDetail non ha un total', async () => {
    mockPullImage.mockImplementation(async (_name, onProgress) => {
      onProgress({ status: 'Downloading', done: false })
    })
    const wrapper = mountDialog()
    await wrapper.find('input').setValue('nginx:latest')
    const pullButton = wrapper.findAll('button').find((b) => b.text().includes('Pull') && !b.text().includes('image'))!
    await pullButton.trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('%')
  })

  it('svuota il campo e non mostra più errori residui quando il pull completa con successo', async () => {
    const store = useDockerStore()
    mockPullImage.mockImplementation(async (_name, onProgress) => {
      onProgress({ status: 'Pull complete', done: true })
    })
    const wrapper = mountDialog()
    await wrapper.find('input').setValue('nginx:latest')
    const pullButton = wrapper.findAll('button').find((b) => b.text().includes('Pull') && !b.text().includes('image'))!
    await pullButton.trigger('click')
    await flushPromises()

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('')
  })

  it('mostra il messaggio di errore se pullProgress.error è presente', async () => {
    mockPullImage.mockImplementation(async (_name, onProgress) => {
      onProgress({ status: 'failed', done: true, error: 'manifest unknown' })
    })
    const wrapper = mountDialog()
    await wrapper.find('input').setValue('does-not-exist')
    const pullButton = wrapper.findAll('button').find((b) => b.text().includes('Pull') && !b.text().includes('image'))!
    await pullButton.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('manifest unknown')
  })
})