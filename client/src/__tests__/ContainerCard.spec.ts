import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ContainerCard from '@/modules/docker/components/ContainerCard.vue'
import type { DockerContainer } from '@/types/docker'

// Mock del sotto-componente badge
const ContainerStatusBadgeStub = {
  template: '<div class="mock-badge">{{ status }}</div>',
  props: ['status']
}

const mockContainer: DockerContainer = {
  id: '123',
  shortId: '1234567890ab',
  name: 'web-server',
  image: 'nginx:latest',
  status: 'running',
  state: 'running',
  created: 1718000000,
  ports: ['80:80', '443:443']
}

const mockStats = {
  cpuPercent: 12.5,
  memUsage: 157286400 // 150 MB in bytes
}

describe('ContainerCard.vue', () => {
  // Configurazione minima i18n per supportare i tooltip del componente
  const i18n = createI18n({
    legacy: false,
    locale: 'it',
    messages: {
      it: {
        docker: {
          pin: 'Fissa',
          unpin: 'Rimuovi dai preferiti',
          logs: 'Mostra log'
        },
        common: {
          start: 'Avvia',
          stop: 'Arresta',
          restart: 'Riavvia',
          remove: 'Elimina'
        }
      }
    }
  })

  const createWrapper = (props = {}) => {
    return mount(ContainerCard, {
      props: {
        container: mockContainer,
        stats: undefined,
        pending: false,
        selected: false,
        favorite: false,
        ...props
      },
      global: {
        plugins: [i18n],
        stubs: {
          ContainerStatusBadge: ContainerStatusBadgeStub,
          Tooltip: { template: '<div><slot /></div>' },
          TooltipTrigger: { template: '<div><slot /></div>' },
          TooltipContent: { template: '<div><slot /></div>' },
          SharedButton: { template: '<button class="shared-btn"><slot /></button>' },
          Card: { template: '<div class="card-stub" @click="$emit(\'click\')"><slot /></div>' },
          CardHeader: { template: '<div><slot /></div>' },
          CardTitle: { template: '<div><slot /></div>' },
          CardContent: { template: '<div><slot /></div>' },
          // Icone Lucide usate nel template
          Star: { template: '<div class="icon-star" />' },
          FileText: { template: '<div class="icon-file-text" />' },
          Play: { template: '<div class="icon-play" />' },
          Square: { template: '<div class="icon-square" />' },
          RotateCcw: { template: '<div class="icon-rotate" />' },
          Trash2: { template: '<div class="icon-trash" />' }
        }
      }
    })
  }

  it('renderizza i dati base del container', () => {
    const wrapper = createWrapper()
    
    expect(wrapper.text()).toContain('web-server')
    expect(wrapper.text()).toContain('nginx:latest')
    expect(wrapper.text()).toContain('80:80')
    expect(wrapper.text()).toContain('443:443')
  })

  it('mostra le statistiche CPU e Memoria formattate solo se running e presenti', async () => {
    let wrapper = createWrapper({ stats: undefined, container: { ...mockContainer, status: 'running' } })
    expect(wrapper.text()).not.toContain('CPU')
    
    wrapper = createWrapper({ stats: mockStats, container: { ...mockContainer, status: 'running' } })
    expect(wrapper.text()).toContain('CPU')
    expect(wrapper.text()).toContain('12.5%')
    expect(wrapper.text()).toContain('150.0 MB')
  })

  it('emette l\'evento "logs" al click sulla card principale', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.card-stub').trigger('click')
    
    expect(wrapper.emitted('logs')).toBeTruthy()
  })

  it('emette l\'evento "toggleFavorite" al click sul tasto star senza propagare il click alla card', async () => {
    const wrapper = createWrapper()
    // Trova il primo bottone (quello dei preferiti in alto a destra)
    const starBtn = wrapper.find('.shared-btn') 
    await starBtn.trigger('click')
    
    expect(wrapper.emitted('toggleFavorite')).toBeTruthy()
    // Grazie a @click.stop, l'evento click della card non deve essere scattato per i logs in questo caso
    expect(wrapper.emitted('logs')).toBeFalsy()
  })
})