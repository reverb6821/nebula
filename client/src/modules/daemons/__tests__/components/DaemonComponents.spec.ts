import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import DaemonItem from '../../components/DaemonItem.vue'
import DaemonCard from '../../components/DaemonCard.vue'
import type { Daemon } from '../../../../types/daemon'

const messages = {
  en: {
    common: {
      start: 'Start',
      stop: 'Stop',
      restart: 'Restart',
    },
    daemons: {
      bootLabel: 'Boot',
      disableAtBoot: 'Disable at boot',
      enableAtBoot: 'Enable at boot',
      staticUnit: 'Static unit',
      enabledEnabled: 'Enabled',
      enabledDisabled: 'Disabled',
      enabledStatic: 'Static',
      pin: 'Pin',
      unpin: 'Unpin',
      noDescription: 'No description',
    },
  },
}

const daemon: Daemon = {
  name: 'nebula.service',
  description: 'Nebula service',
  status: 'active',
  enabled: 'enabled',
}

const stubs = {
  Tooltip: { template: '<div><slot /></div>' },
  TooltipTrigger: { template: '<div><slot /></div>' },
  TooltipContent: { template: '<div><slot /></div>' },
  SharedButton: {
    inheritAttrs: false,
    template: '<button v-bind="$attrs"><slot /></button>',
  },
  SharedSwitch: { template: '<button class="shared-switch" />' },
  DaemonStatusBadge: { template: '<span class="daemon-status-badge" />' },
  Item: { template: '<div :class="$attrs.class"><slot /></div>' },
  ItemMedia: { template: '<div><slot /></div>' },
  ItemContent: { template: '<div><slot /></div>' },
  ItemDescription: { template: '<div><slot /></div>' },
  ItemTitle: { template: '<div><slot /></div>' },
  ItemActions: { template: '<div><slot /></div>' },
  SharedPanel: {
    inheritAttrs: false,
    template: '<div class="shared-panel" v-bind="$attrs"><slot name="header" /><slot name="meta" /><slot /><slot name="footer" /></div>',
  },
}

function mountComponent(component: typeof DaemonItem | typeof DaemonCard) {
  const i18n = createI18n({ legacy: false, locale: 'en', messages })
  return mount(component, {
    props: { daemon, pending: false, favorite: false },
    global: { plugins: [i18n], stubs },
  })
}

describe('Daemon components', () => {
  it('uses the shared item surface and renders the daemon status badge', () => {
    const wrapper = mountComponent(DaemonItem)

    expect(wrapper.classes()).toContain('cyber-panel')
    expect(wrapper.classes()).toContain('hover:shadow-cyber-signal')
    expect(wrapper.find('.daemon-status-badge').exists()).toBe(true)
  })

  it('uses the shared card surface with a pill primary action', () => {
    const wrapper = mountComponent(DaemonCard)

    expect(wrapper.find('.shared-panel').classes()).toContain('hover:bg-accent')
    expect(wrapper.find('[aria-label="Stop"]').classes()).toContain('bg-destructive/10')
    expect(wrapper.find('[aria-label="Restart"]').exists()).toBe(true)
  })

  it('reveals the favorite CTA on hover and keeps it visible for favorites', () => {
    const item = mountComponent(DaemonItem)
    const card = mountComponent(DaemonCard)

    expect(item.findAll('button')[0]?.attributes('aria-label')).toBe('Pin')
    expect(item.find('[aria-label="Pin"]').classes()).toEqual(expect.arrayContaining([
      'h-7',
      'w-7',
      'opacity-0',
      'group-hover:opacity-100',
    ]))
    expect(item.find('[aria-label="Pin"]').classes()).toContain('opacity-0')
    expect(item.find('[aria-label="Pin"]').classes()).toContain('group-hover:opacity-100')
    expect(card.find('[aria-label="Pin"]').classes()).toContain('opacity-0')
    expect(card.find('[aria-label="Pin"]').classes()).toContain('group-hover:opacity-100')

    const favoriteItem = mount(DaemonItem, {
      props: { daemon, pending: false, favorite: true },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages })],
        stubs,
      },
    })
    const favoriteCard = mount(DaemonCard, {
      props: { daemon, pending: false, favorite: true },
      global: {
        plugins: [createI18n({ legacy: false, locale: 'en', messages })],
        stubs,
      },
    })

    expect(favoriteItem.find('[aria-label="Unpin"]').classes()).toContain('!opacity-100')
    expect(favoriteCard.find('[aria-label="Unpin"]').classes()).toContain('!opacity-100')
  })
})
