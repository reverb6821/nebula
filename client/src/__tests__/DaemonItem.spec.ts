import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import DaemonItem from '@/modules/daemons/components/DaemonItem.vue'

describe('DaemonItem.vue', () => {
  const defaultProps = {
    daemon: {
      name: 'redis',
      status: 'failed' as const,
      enabled: 'static' as const,
      description: 'In-memory DB'
    },
    pending: false,
    favorite: true
  }

  // Configura un'istanza minimale di i18n per evitare errori di setup
  const i18n = createI18n({
    legacy: false,
    locale: 'it',
    messages: {
      it: {}
    }
  })

  const mountItem = (props = {}) => {
    return mount(DaemonItem, {
      props: { ...defaultProps, ...props },
      global: {
        plugins: [i18n],
        stubs: {
          Item: { template: '<div><slot /></div>' },
          ItemMedia: { template: '<div><slot /></div>' },
          ItemContent: { template: '<div><slot /></div>' },
          ItemTitle: { template: '<div><slot /></div>' },
          ItemDescription: { template: '<div><slot /></div>' },
          ItemActions: { template: '<div><slot /></div>' },
          Tooltip: { template: '<div><slot /></div>' },
          TooltipTrigger: { template: '<div><slot /></div>' },
          TooltipContent: { template: '<div><slot /></div>' },
          SharedButton: { 
            template: '<button class="shared-button"><slot /></button>' 
          },
          SharedSwitch: { 
            template: '<input type="checkbox" class="shared-switch" :disabled="disabled" />',
            props: ['disabled']
          }
        }
      }
    })
  }

  it('applica la classe di fallimento sul pallino di stato', () => {
    const wrapper = mountItem()
    const dot = wrapper.find('.rounded-full')
    
    expect(dot.exists()).toBe(true)
    expect(dot.classes()).toContain('bg-red-400')
  })

  it('disabilita lo switch di boot se l\'unità è di tipo static', () => {
    const wrapper = mountItem()
    const checkbox = wrapper.find('.shared-switch')
    
    expect(checkbox.exists()).toBe(true)
    expect(checkbox.attributes('disabled')).toBeDefined()
  })

  it('emette l\'evento toggleFavorite al click sulla stella', async () => {
    const wrapper = mountItem()
    const buttons = wrapper.findAll('.shared-button')
    const favButton = buttons[0] // Il primo bottone nel template è la stella dei preferiti
    
    expect(favButton).toBeDefined()
    if (favButton) {
      await favButton.trigger('click')
    }
    expect(wrapper.emitted('toggleFavorite')).toBeTruthy()
  })

  it('emette l\'evento start se il demone è inattivo e si clicca sul bottone azione', async () => {
    const wrapper = mountItem({
      daemon: {
        name: 'redis',
        status: 'inactive' as const,
        enabled: 'enabled' as const,
        description: 'In-memory DB'
      }
    })
    const buttons = wrapper.findAll('.shared-button')
    const startButton = buttons[1] // Il secondo bottone è l'azione Start/Stop
    
    expect(startButton).toBeDefined()
    if (startButton) {
      await startButton.trigger('click')
    }
    expect(wrapper.emitted('start')).toBeTruthy()
  })
})