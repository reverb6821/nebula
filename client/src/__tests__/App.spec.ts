import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

// Aggiungi questo mock globale per la rotta
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ path: '/' }))
}))

describe('App', () => {
  it('mounts renders properly', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterView: true,
          RouterLink: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })
})