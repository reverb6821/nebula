import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import DaemonCard from '@/modules/daemons/components/DaemonCard.vue'

describe('DaemonCard.vue', () => {
  const defaultProps = {
    daemon: {
      name: 'nginx',
      status: 'active' as const,
      enabled: 'enabled' as const,
      description: 'Web Server'
    },
    pending: false,
    favorite: false
  }

  // Configura un'istanza minimale di i18n per il testing
  const i18n = createI18n({
    legacy: false,
    locale: 'it',
    messages: {
      it: {} // Puoi lasciare vuoto; se manca una chiave, i18n restituirà la chiave stessa
    }
  })

  const mountCard = (props = {}) => {
    return mount(DaemonCard, {
      props: { ...defaultProps, ...props },
      global: {
        plugins: [i18n], // Risolve l'errore "Need to install with app.use"
        stubs: {
          Tooltip: { template: '<div><slot /></div>' },
          TooltipTrigger: { template: '<div><slot /></div>' },
          TooltipContent: { template: '<div><slot /></div>' },
          SharedButton: { 
            template: '<button class="shared-button"><slot /></button>' 
          },
          SharedSwitch: { 
            template: '<input type="checkbox" class="shared-switch" />' 
          },
          DaemonStatusBadge: { 
            template: '<div class="badge-stub"></div>' 
          }
        }
      }
    })
  }

  it('mostra il nome e la descrizione del demone', () => {
    const wrapper = mountCard()
    expect(wrapper.text()).toContain('nginx')
    expect(wrapper.text()).toContain('Web Server')
  })

  it('emette l\'evento toggleFavorite al click sulla stella', async () => {
    const wrapper = mountCard()
    const buttons = wrapper.findAll('.shared-button')
    const favButton = buttons[0]
    
    expect(favButton).toBeDefined()
    if (favButton) {
      await favButton.trigger('click')
    }
    
    expect(wrapper.emitted('toggleFavorite')).toBeTruthy()
  })

  it('emette l\'evento stop se il demone è attivo e si clicca sul bottone azione', async () => {
    const wrapper = mountCard({
      daemon: { 
        name: 'nginx', 
        status: 'active' as const, 
        enabled: 'enabled' as const,
        description: 'Web Server'
      }
    })
    
    const buttons = wrapper.findAll('.shared-button')
    const stopButton = buttons[1]
    
    expect(stopButton).toBeDefined()
    if (stopButton) {
      await stopButton.trigger('click')
    }
    
    expect(wrapper.emitted('stop')).toBeTruthy()
  })

  it('emette l\'evento start se il demone è inattivo e si clicca sul bottone azione', async () => {
    const wrapper = mountCard({
      daemon: { 
        name: 'nginx', 
        status: 'inactive' as const, 
        enabled: 'enabled' as const,
        description: 'Web Server'
      }
    })
    
    const buttons = wrapper.findAll('.shared-button')
    const startButton = buttons[1]
    
    expect(startButton).toBeDefined()
    if (startButton) {
      await startButton.trigger('click')
    }
    
    expect(wrapper.emitted('start')).toBeTruthy()
  })

  it('emette l\'evento restart al click sul relativo bottone se il demone è attivo', async () => {
    const wrapper = mountCard({
      daemon: { 
        name: 'nginx', 
        status: 'active' as const, 
        enabled: 'enabled' as const,
        description: 'Web Server'
      }
    })
    
    const buttons = wrapper.findAll('.shared-button')
    const restartButton = buttons[2]
    
    expect(restartButton).toBeDefined()
    if (restartButton) {
      await restartButton.trigger('click')
    }
    
    expect(wrapper.emitted('restart')).toBeTruthy()
  })
})