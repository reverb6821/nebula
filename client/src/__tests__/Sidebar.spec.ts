import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ path: '/' }))
}))

describe('Sidebar.vue', () => {
  let pinia: any

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    // Resetta il mock della rotta sul valore di default prima di ogni test
    vi.mocked(useRoute).mockReturnValue({ path: '/' } as any)
  })

  const createWrapper = (initialCollapsed = false) => {
    const appStore = useAppStore()
    appStore.sidebarCollapsed = initialCollapsed

    return mount(Sidebar, {
      global: {
        plugins: [pinia],
        stubs: {
          // Creiamo uno stub esplicito che renderizza la prop 'to' come attributo nel DOM
          RouterLink: {
            template: '<div class="router-link-stub" :data-to="to"><slot /></div>',
            props: ['to']
          }
        }
      }
    })
  }

  it('mostra i testi e i link quando la sidebar è espansa', () => {
    const wrapper = createWrapper(false)
    expect(wrapper.text()).toContain('Nebula')
    expect(wrapper.text()).toContain('Dashboard')
    expect(wrapper.find('aside').classes()).toContain('w-[220px]')
  })

  it('nasconde i testi e riduce la larghezza quando la sidebar è contratta', () => {
    const wrapper = createWrapper(true)
    expect(wrapper.text()).not.toContain('Nebula')
    expect(wrapper.find('aside').classes()).toContain('w-[56px]')
  })

  it('evidenzia l\'elemento attivo in base alla rotta corrente', () => {
    vi.mocked(useRoute).mockReturnValue({ path: '/docker' } as any)
    const wrapper = createWrapper(false)
    
    // Cerchiamo lo stub tramite l'attributo data-to assegnato nel nostro stub personalizzato
    const dockerLink = wrapper.find('.router-link-stub[data-to="/docker"]')

    expect(dockerLink.exists()).toBe(true)
    expect(dockerLink.classes()).toContain('bg-zinc-800/80')
  })

  it('chiama la funzione toggleSidebar dello store al click sul pulsante', async () => {
    const wrapper = createWrapper(false)
    const appStore = useAppStore()
    
    const toggleSpy = vi.spyOn(appStore, 'toggleSidebar')
    await wrapper.find('button').trigger('click')

    expect(toggleSpy).toHaveBeenCalledTimes(1)
  })
})