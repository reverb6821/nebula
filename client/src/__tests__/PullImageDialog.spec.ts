import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import PullImageDialog from '@/modules/docker/components/PullImageDialog.vue'
import { useDockerStore } from '@/modules/docker/store'

const LucideStub = { template: '<div><slot /></div>' }

describe('PullImageDialog.vue', () => {
  let pinia: ReturnType<typeof createTestingPinia>

  beforeEach(() => {
    pinia = createTestingPinia({
      stubActions: false,
      createSpy: vi.fn,
      initialState: {
        docker: {
          pulling: false,
          pullProgress: null
        }
      }
    })
  })

  const createWrapper = () => {
    return mount(PullImageDialog, {
      global: {
        plugins: [pinia],
        stubs: {
          Download: LucideStub,
          ArrowRight: LucideStub,
          Dialog: { template: '<div><slot /></div>' },
          DialogContent: { template: '<div><slot /></div>' },
          DialogHeader: { template: '<div><slot /></div>' },
          DialogTitle: { template: '<div><slot /></div>' },
          DialogTrigger: { template: '<div><slot /></div>' },
          Button: {
            props: ['disabled'],
            template: '<button :disabled="disabled"><slot /></button>'
          },
          Input: {
            props: ['modelValue'],
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
          }
        }
      }
    })
  }

  it('avvia l azione pull sullo store quando l input è valido e si clicca su invia', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()
    
    vi.mocked(store.pull).mockResolvedValue(undefined)

    const input = wrapper.find('input')
    input.element.value = 'redis:alpine'
    await input.trigger('input')
    
    await new Promise(resolve => setTimeout(resolve, 0))

    // Seleziona specificatamente il bottone di invio interno che NON contiene la stringa "image"
    const pullButton = wrapper.findAll('button').find(b => 
      b.text().trim().includes('Pull') && !b.text().toLowerCase().includes('image')
    )
    
    expect(pullButton).toBeDefined()
    await pullButton!.trigger('click')
    
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(store.pull).toHaveBeenCalledWith('redis:alpine')
  })

  it('mostra correttamente la percentuale di avanzamento della barra se definita', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()

    store.$patch({
      pulling: true,
      pullProgress: {
        status: 'Downloading',
        progressDetail: { current: 50, total: 100 }
      }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('Downloading')
    expect(wrapper.text()).toContain('50%')
    
    const progressBar = wrapper.find('.bg-indigo-500')
    expect(progressBar.attributes('style')).toContain('width: 50%;')
  })

  it('mostra un errore se il processo di download fallisce', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()

    store.$patch({
      pulling: false,
      pullProgress: {
        status: 'Failed',
        error: 'Network connection timeout'
      }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.text()).toContain('Network connection timeout')
  })
})