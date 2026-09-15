import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ContainerStatusBadge from '../../components/ContainerStatusBadge.vue'
import type { DockerContainer } from '../../../../types/docker'

const messages = {
  en: {
    docker: {
      statusRunning: 'Running', statusPaused: 'Paused', statusRestarting: 'Restarting',
      statusDead: 'Dead', statusExited: 'Exited', statusCreated: 'Created',
    },
  },
}

function mountBadge(status: DockerContainer['status']) {
  const i18n = createI18n({ legacy: false, locale: 'en', messages })
  return mount(ContainerStatusBadge, { props: { status }, global: { plugins: [i18n] } })
}

describe('ContainerStatusBadge', () => {
  it.each([
    ['running', 'Running'],
    ['paused', 'Paused'],
    ['restarting', 'Restarting'],
    ['dead', 'Dead'],
    ['exited', 'Exited'],
    ['created', 'Created'],
  ] as const)('mostra la label tradotta per lo stato %s', (status, label) => {
    const wrapper = mountBadge(status)
    expect(wrapper.text()).toBe(label)
  })

  it('per uno stato non mappato (es. "removing") mostra lo stato grezzo, non una label vuota', () => {
    const wrapper = mountBadge('removing' as DockerContainer['status'])
    expect(wrapper.text()).toBe('removing')
  })

  it('anima (pulse) solo lo stato running', () => {
    const running = mountBadge('running')
    const paused = mountBadge('paused')

    expect(running.find('svg').classes()).toContain('animate-pulse')
    expect(paused.find('svg').classes()).not.toContain('animate-pulse')
  })

  it('anima (spin) solo lo stato restarting', () => {
    const restarting = mountBadge('restarting')
    const running = mountBadge('running')

    expect(restarting.find('svg').classes()).toContain('animate-spin')
    expect(running.find('svg').classes()).not.toContain('animate-spin')
  })
})
