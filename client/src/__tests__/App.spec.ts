import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import App from '../App.vue'

// Stesso motivo di store.spec.ts: niente window.NL_PORT in jsdom.
vi.mock('@neutralinojs/lib', () => ({
  storage: {
    getData: vi.fn<() => Promise<never>>().mockRejectedValue(new Error('NE_ST_NOSTKEY')),
    setData: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  },
  os: {
    execCommand: vi.fn<() => Promise<void>>(),
    spawnProcess: vi.fn<() => Promise<void>>(),
    updateSpawnedProcess: vi.fn<() => Promise<void>>(),
  },
  events: {
    on: vi.fn<(event: string, listener: (...args: unknown[]) => void) => void>(),
    off: vi.fn<(event: string, listener: (...args: unknown[]) => void) => void>(),
  },
}))

describe('App', () => {
  it('mounts renders properly', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
    })

    const i18n = createI18n({ legacy: false, locale: 'it', messages: { it: {} } })

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router, i18n],
      },
    })

    await router.isReady()

    expect(wrapper.exists()).toBe(true)
  })
})