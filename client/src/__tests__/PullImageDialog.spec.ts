import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import PullImageDialog from '@/modules/docker/components/PullImageDialog.vue'
import { useDockerStore } from '@/modules/docker/store'

const LucideStub = { template: '<div><slot /></div>' }

describe('PullImageDialog.vue', () => {
  let pinia: ReturnType<typeof createTestingPinia>

  // Configurazione minimale i18n per supportare i testi e i pulsanti del dialog
  const i18n = createI18n({
    legacy: false,
    locale: 'it',
    messages: {
      it: {
        docker: {
          pullImage: 'Scarica immagine',
          pullImageTitle: 'Scarica una nuova immagine',
          pullConnecting: 'Connessione in corso...',
          pullPulling: 'Download in corso...',
          pullButton: 'Scarica'
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
          pulling: false,
          pullProgress: null
        }
      }
    })
  })

  const createWrapper = () => {
    return mount(PullImageDialog, {
      global: {
        plugins: [pinia, i18n],
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
            template: '<button class="mock-btn" :disabled="disabled"><slot /></button>'
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

    // Cerca il pulsante di sottomissione basandosi sulla traduzione mockata 'Scarica'
    const pullButton = wrapper.findAll('.mock-btn').find(b => 
      b.text().trim() === 'Scarica'
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