import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createI18n } from 'vue-i18n'
import { defineComponent } from 'vue'
import { useDaemonsStore } from '@/modules/daemons/store'
import DaemonsView from '@/modules/daemons/views/DaemonsView.vue'

// Definizione esplicita degli stub per isolare il componente
const DaemonListStub = defineComponent({
  name: 'DaemonList',
  template: '<div class="daemon-list-stub" />'
})

const DaemonFiltersStub = defineComponent({
  name: 'DaemonFilters',
  template: '<div class="daemon-filters-stub" />'
})

const ScrollAreaStub = defineComponent({
  name: 'ScrollArea',
  template: '<div class="scroll-area-stub"><slot /></div>'
})

const SharedButtonStub = defineComponent({
  name: 'SharedButton',
  props: ['variant', 'size', 'disabled'],
  template: '<button class="shared-button-stub" :disabled="disabled"><slot /></button>'
})

const SharedAlertStub = defineComponent({
  name: 'SharedAlert',
  props: ['variant', 'title', 'description'],
  template: '<div class="shared-alert-stub"><h3>{{ title }}</h3><p>{{ description }}</p></div>'
})

describe('DaemonsView.vue', () => {
  let pinia: ReturnType<typeof createTestingPinia>
  let store: any

  // Configurazione minimale di i18n per supportare le chiavi presenti nella view
  const i18n = createI18n({
    legacy: false,
    locale: 'it',
    messages: {
      it: {
        daemons: {
          title: 'Servizi di Sistema',
          running: '{n} attivi',
          failed: '{n} falliti',
          shown: '{shown} visualizzati su {total} totali'
        },
        common: {
          refresh: 'Aggiorna'
        }
      }
    }
  })

  beforeEach(() => {
    pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })
    store = useDaemonsStore()

    // Configurazione dei valori di default reattivi dello store
    store.loading = false
    store.error = null
    store.daemons = []
    store.stats = {
      active: 0,
      failed: 0,
      shown: 0,
      total: 0
    }
  })

  const factory = () => {
    return mount(DaemonsView, {
      global: {
        plugins: [pinia, i18n],
        stubs: {
          DaemonList: DaemonListStub,
          DaemonFilters: DaemonFiltersStub,
          ScrollArea: ScrollAreaStub,
          SharedButton: SharedButtonStub,
          SharedAlert: SharedAlertStub,
          RefreshCw: true,
        }
      }
    })
  }

  it('innesca la fetch dei daemon al montaggio del componente (onMounted)', () => {
    factory()
    expect(store.fetch).toHaveBeenCalledTimes(1)
  })

  it('renderizza correttamente i dati statistici dello store', () => {
    store.stats = {
      active: 3,
      failed: 1,
      shown: 5,
      total: 10
    }
    
    const wrapper = factory()
    const text = wrapper.text()

    expect(text).toContain('3 attivi')
    expect(text).toContain('1 falliti')
    expect(text).toContain('5 visualizzati su 10 totali')
  })

  it('mostra il componente di alert quando lo store presenta un errore', () => {
    store.error = 'Impossibile connettersi al demone di sistema'
    const wrapper = factory()
    
    const alert = wrapper.findComponent({ name: 'SharedAlert' })
    expect(alert.exists()).toBe(true)
    expect(alert.props('description')).toBe('Impossibile connettersi al demone di sistema')
  })

  it('nasconde l\'alert di errore se non ci sono anomalie', () => {
    store.error = null
    const wrapper = factory()
    
    const alert = wrapper.findComponent({ name: 'SharedAlert' })
    expect(alert.exists()).toBe(false)
  })

  it('esegue nuovamente store.fetch() quando si preme il pulsante di refresh', async () => {
    const wrapper = factory()
    const refreshButton = wrapper.findComponent({ name: 'SharedButton' })
    
    expect(refreshButton.exists()).toBe(true)
    await refreshButton.trigger('click')
    
    // Contiamo 2 chiamate totali: 1 automatica all'onMounted e 1 al click del pulsante
    expect(store.fetch).toHaveBeenCalledTimes(2)
  })

  it('disabilita il pulsante di refresh durante lo stato di loading', () => {
    store.loading = true
    const wrapper = factory()
    
    const refreshButton = wrapper.findComponent({ name: 'SharedButton' })
    expect(refreshButton.props('disabled')).toBe(true)
  })

  it('mostra i segnaposto di caricamento (skeleton placeholders) se in loading senza daemon memorizzati', () => {
    store.loading = true
    store.daemons = []
    const wrapper = factory()
    
    const skeletons = wrapper.findAll('.animate-pulse')
    expect(skeletons).toHaveLength(10)
    expect(wrapper.findComponent({ name: 'DaemonList' }).exists()).toBe(false)
  })

  it('mostra il componente DaemonList invece degli skeleton se i dati sono già caricati o non in loading', () => {
    store.loading = false
    store.daemons = [{ name: 'nginx' }]
    const wrapper = factory()
    
    expect(wrapper.findAll('.animate-pulse')).toHaveLength(0)
    expect(wrapper.findComponent({ name: 'DaemonList' }).exists()).toBe(true)
  })
})