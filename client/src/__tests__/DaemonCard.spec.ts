import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DaemonCard from '@/modules/daemons/components/DaemonCard.vue'
import type { Daemon } from '@/types/daemon' // Assicurati che il percorso sia corretto

describe('DaemonCard.vue', () => {
  // Usiamo "as const" per fare in modo che TypeScript inferisca i tipi letterali esatti
  const defaultProps = {
    daemon: {
      name: 'nginx',
      status: 'active' as const,  // Forza il tipo a DaemonStatus
      enabled: 'enabled' as const, // Forza il tipo a DaemonEnabled
      description: 'Web Server'
    },
    pending: false,
    favorite: false
  }

  const mountCard = (props = {}) => {
    return mount(DaemonCard, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          Tooltip: { template: '<div><slot name="trigger" /><slot /></div>' },
          TooltipTrigger: { template: '<div><slot /></div>' },
          TooltipContent: { template: '<div><slot /></div>' },
          SharedButton: { template: '<button><slot /></button>' },
          SharedSwitch: { template: '<input type="checkbox" />' },
          DaemonStatusBadge: { template: '<div class="badge-stub"></div>' }
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
    const favButton = wrapper.findAll('button')[0]
    
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
    const actionButton = wrapper.findAll('button')[1]
    
    expect(actionButton).toBeDefined()
    if (actionButton) {
      await actionButton.trigger('click')
    }
    expect(wrapper.emitted('stop')).toBeTruthy()
  })
})