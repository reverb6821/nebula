import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAppStore } from '@/stores/app'

describe('useAppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('ha lo stato iniziale corretto', () => {
    const store = useAppStore()
    expect(store.sidebarCollapsed).toBe(false)
  })

  it('inverte lo stato di sidebarCollapsed quando si chiama toggleSidebar', () => {
    const store = useAppStore()

    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(true)

    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(false)
  })
})