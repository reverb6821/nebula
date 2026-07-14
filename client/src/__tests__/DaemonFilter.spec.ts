import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { useDaemonsStore } from '@/modules/daemons/store'
import DaemonFilter from '@/modules/daemons/components/DaemonFilters.vue'

describe('DaemonFilter.vue', () => {
  // Configura un'istanza minimale di i18n per evitare errori di setup
  const i18n = createI18n({
    legacy: false,
    locale: 'it',
    messages: {
      it: {}
    }
  })

  beforeEach(() => {
    setActivePinia(createPinia())
    
    // Inizializza lo stato minimo dello store necessario al componente
    const store = useDaemonsStore()
    store.search = ''
    store.filters = {
      status: [],
      enabled: []
    }
  })

  const mountFilter = () => {
    return mount(DaemonFilter, {
      global: {
        plugins: [i18n],
        stubs: {
          Input: {
            template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" class="search-input" />',
            props: ['modelValue']
          },
          SharedButton: { 
            template: '<button class="shared-button" @click="$emit(\'click\')"><slot /></button>' 
          },
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
    
    const input = wrapper.find('.search-input')
    expect(input.exists()).toBe(true)
    
    await input.setValue('docker')
    expect(store.search).toBe('docker')
  })

  it('svuota la ricerca quando si clicca sul bottone di cancellazione', async () => {
    const store = useDaemonsStore()
    store.search = 'systemd'
    const wrapper = mountFilter()

    // Il bottone di reset della ricerca (X) compare solo se search.length > 0
    const clearButton = wrapper.find('.shared-button')
    expect(clearButton.exists()).toBe(true)
    
    await clearButton.trigger('click')
    expect(store.search).toBe('')
  })
})