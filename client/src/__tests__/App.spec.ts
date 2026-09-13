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
    // Route "catch-all": non ci serve conoscere le route reali dell'app,
    // solo che useRoute()/useRouter() (usati da NavMain.vue) abbiano un
    // router vero a cui agganciarsi — un componente <RouterView> stubbato
    // non basta, perché useRoute() legge dal router iniettato, non dal tag.
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
    })

    // Messaggi vuoti: le chiavi mancanti in un vero i18n producono solo un
    // warning in console (fallback alla chiave stessa), non un errore —
    // sufficiente per un test "si monta senza esplodere".
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