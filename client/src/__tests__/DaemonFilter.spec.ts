import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useDaemonsStore } from '@/modules/daemons/store'
import DaemonFilter from '@/modules/daemons/components/DaemonFilters.vue'

describe('DaemonFilter.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const mountFilter = () => {
    return mount(DaemonFilter, {
      global: {
        stubs: {
          Input: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
            props: ['modelValue']
          },
          SharedButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
          Collapsible: { template: '<div><slot /></div>' },
          CollapsibleTrigger: { template: '<div><slot /></div>' },
          CollapsibleContent: { template: '<div><slot /></div>' },
          Checkbox: { template: '<input type="checkbox" :checked="checked" />', props: ['checked'] },
          Separator: { template: '<hr />' },
          Badge: { template: '<div><slot /></div>' }
        }
      }
    })
  }

  it('aggiorna il valore di ricerca nello store quando l\'utente scrive nell\'input', async () => {
    const store = useDaemonsStore()
    const wrapper = mountFilter()
    
    const input = wrapper.find('input')
    await input.setValue('docker')

    expect(store.search).toBe('docker')
  })

  it('svuota la ricerca quando si clicca sul bottone di cancellazione', async () => {
    const store = useDaemonsStore()
    store.search = 'systemd'
    const wrapper = mountFilter()

    const clearButton = wrapper.find('button')
    await clearButton.trigger('click')

    expect(store.search).toBe('')
  })
})