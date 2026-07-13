import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { nextTick } from 'vue'
import DockerToolbar from '@/modules/docker/components/DockerToolbar.vue' // Regola il percorso se necessario
import { useDockerStore } from '@/modules/docker/store'

const LucideStub = { template: '<div><slot /></div>' }

describe('DockerToolbar.vue', () => {
  let pinia: ReturnType<typeof createTestingPinia>

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
        plugins: [pinia],
        stubs: {
          Search: LucideStub,
          SharedButton: {
            template: '<button @click="$emit(\'click\')"><slot /></button>'
          },
          // Rimosso il cast "as HTMLInputElement" dal template string
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
    const buttons = wrapper.findAll('button')

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