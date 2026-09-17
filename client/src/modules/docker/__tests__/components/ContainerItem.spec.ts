import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ContainerItem from '../../components/ContainerItem.vue'
import type { DockerContainer } from '../../../../types/docker'

const messages = {
  en: {
    common: {
      start: 'Start',
      stop: 'Stop',
      restart: 'Restart',
      remove: 'Remove',
    },
    docker: {
      pin: 'Pin',
      unpin: 'Unpin',
      logs: 'Logs',
      openLogsFor: 'Open logs for {name}',
    },
  },
}

const container: DockerContainer = {
  id: 'container-id',
  shortId: 'container',
  name: 'nebula',
  image: 'nebula:latest',
  status: 'running',
  state: 'running',
  ports: [],
  created: 0,
}

const stubs = {
  Tooltip: { template: '<div><slot /></div>' },
  TooltipTrigger: { template: '<div><slot /></div>' },
  TooltipContent: { template: '<div><slot /></div>' },
  SharedButton: {
    inheritAttrs: false,
    template: '<button v-bind="$attrs"><slot /></button>',
  },
  Item: { template: '<div :class="$attrs.class"><slot /></div>' },
  ItemMedia: { template: '<div><slot /></div>' },
  ItemContent: { template: '<div><slot /></div>' },
  ItemDescription: { template: '<div><slot /></div>' },
  ItemTitle: { template: '<div><slot /></div>' },
  ItemActions: { template: '<div><slot /></div>' },
  ContainerStatusBadge: { template: '<span />' },
}

function mountItem(favorite = false) {
  const i18n = createI18n({ legacy: false, locale: 'en', messages })
  return mount(ContainerItem, {
    props: {
      container,
      stats: undefined,
      pending: false,
      selected: false,
      favorite,
    },
    global: { plugins: [i18n], stubs },
  })
}

describe('ContainerItem', () => {
  it('reveals the favorite CTA on hover and keeps it visible for favorites', () => {
    const item = mountItem()
    const favoriteItem = mountItem(true)

    expect(item.find('[aria-label="Pin"]').classes()).toEqual(expect.arrayContaining([
      'h-7',
      'w-7',
      'opacity-0',
      'group-hover:opacity-100',
    ]))
    expect(favoriteItem.find('[aria-label="Unpin"]').classes()).toContain('!opacity-100')
  })
})
