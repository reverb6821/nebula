import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ContainerStatusBadge from '@/modules/docker/components/ContainerStatusBadge.vue'

const LucideStub = { template: '<div class="mock-icon"><slot /></div>' }

describe('ContainerStatusBadge.vue', () => {
  // Configurazione minimale i18n per supportare la traduzione delle etichette di stato
  const i18n = createI18n({
    legacy: false,
    locale: 'it',
    messages: {
      it: {
        docker: {
          statusRunning: 'In esecuzione',
          statusPaused: 'In pausa',
          statusRestarting: 'In riavvio',
          statusDead: 'Decaduto',
          statusExited: 'Terminato',
          statusCreated: 'Creato'
        }
      }
    }
  })

  const createWrapper = (props = {}) => {
    return mount(ContainerStatusBadge, {
      props: {
        status: 'running',
        ...props
      },
      global: {
        plugins: [i18n],
        stubs: {
          Badge: {
            template: '<div class="badge-stub"><slot /></div>'
          },
          Play: LucideStub,
          Square: LucideStub,
          RotateCcw: LucideStub,
          AlertCircle: LucideStub,
          Clock: LucideStub,
          HelpCircle: LucideStub
        }
      }
    })
  }

  it('mostra correttamente il testo e le classi per lo stato running', () => {
    const wrapper = createWrapper({ status: 'running' })
    const badge = wrapper.find('.badge-stub')
    
    expect(badge.text()).toContain('In esecuzione')
    expect(badge.classes()).toContain('bg-emerald-500/15')
    
    const icon = wrapper.find('.animate-pulse')
    expect(icon.exists()).toBe(true)
  })

  it('mostra correttamente il testo e le classi per lo stato dead', () => {
    const wrapper = createWrapper({ status: 'dead' })
    const badge = wrapper.find('.badge-stub')
    
    expect(badge.text()).toContain('Decaduto')
    expect(badge.classes()).toContain('bg-red-500/15')
  })

  it('usa il fallback in caso di stato sconosciuto', () => {
    const wrapper = createWrapper({ status: 'unknown-status' as any })
    const badge = wrapper.find('.badge-stub')
    
    expect(badge.text()).toContain('unknown-status')
    expect(badge.classes()).toContain('bg-zinc-500/15')
  })
})