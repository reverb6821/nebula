import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '@/stores/app'
import AppLayout from '@/components/layout/AppLayout.vue'
import Sidebar from '@/components/layout/Sidebar.vue'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ path: '/' }))
}))

describe('AppLayout.vue', () => {
  it('esegue il rendering della sidebar e della vista principale', () => {
    setActivePinia(createPinia())
    const appStore = useAppStore()
    appStore.sidebarCollapsed = false

    const wrapper = mount(AppLayout, {
      global: {
        plugins: [createPinia()],
        stubs: {
          RouterView: true,
          RouterLink: true
        }
      }
    })

    expect(wrapper.findComponent(Sidebar).exists()).toBe(true)
    expect(wrapper.find('main').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'RouterView' }).exists()).toBe(true)
  })
})