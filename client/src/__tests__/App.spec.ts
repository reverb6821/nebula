import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import App from '../App.vue'

// Stesso motivo di store.spec.ts: niente window.NL_PORT in jsdom.
vi.mock('@neutralinojs/lib', () => ({
  storage: {
    getData: vi.fn().mockRejectedValue(new Error('NE_ST_NOSTKEY')),
    setData: vi.fn().mockResolvedValue(undefined),
  },
  os: { execCommand: vi.fn(), spawnProcess: vi.fn(), updateSpawnedProcess: vi.fn() },
  events: { on: vi.fn(), off: vi.fn() },
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