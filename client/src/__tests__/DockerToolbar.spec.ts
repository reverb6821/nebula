import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import DockerToolbar from '@/modules/docker/components/DockerToolbar.vue'
import { useDockerStore } from '@/modules/docker/store'

const LucideStub = { template: '<div><slot /></div>' }

describe('DockerToolbar.vue', () => {
  let pinia: ReturnType<typeof createTestingPinia>

  // Configurazione minimale i18n per supportare i testi dei tab e i placeholder
  const i18n = createI18n({
    legacy: false,
    locale: 'it',
    messages: {
      it: {
        docker: {
          tabContainers: 'Contenitori',
          tabImages: 'Immagini',
          filterPlaceholder: 'Filtra elementi...'
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
          search: ''
        }
      }
    })
  })

  const createWrapper = () => {
    return mount(DockerToolbar, {
      global: {
        plugins: [pinia, i18n],
        stubs: {
          Search: LucideStub,
          SharedButton: {
            template: '<button class="mock-btn" @click="$emit(\'click\')"><slot /></button>'
          },
          Input: {
            props: ['modelValue'],
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
          }
        }
      }
    })
  }

  it('cambia la scheda attiva nello store quando si clicca sui pulsanti dei tab', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()
    const buttons = wrapper.findAll('.mock-btn')

    expect(buttons).toHaveLength(2)

    await buttons[1]!.trigger('click')
    expect(store.activeTab).toBe('images')

    await buttons[0]!.trigger('click')
    expect(store.activeTab).toBe('containers')
  })

  it('aggiorna la proprietà search dello store quando si scrive nel campo di testo', async () => {
    const wrapper = createWrapper()
    const store = useDockerStore()
    const input = wrapper.find('input')

    await input.setValue('nginx')
    expect(store.search).toBe('nginx')
  })
})