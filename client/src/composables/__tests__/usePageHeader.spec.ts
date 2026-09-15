import { describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePageHeader } from '../usePageHeader'

describe('usePageHeader', () => {
  it('sets header state and applies defaults for optional fields', () => {
    setActivePinia(createPinia())
    const header = usePageHeader()
    const onRefresh = () => {}

    header.setHeader({
      title: 'Processes',
      subtitle: 'Running',
      toolsComponent: null,
      onRefresh,
      refreshLoading: true,
    })

    expect(header.title).toBe('Processes')
    expect(header.subtitle).toBe('Running')
    expect(header.toolsComponent).toBeNull()
    expect(header.toolsProps).toEqual({})
    expect(header.onRefresh).toBe(onRefresh)
    expect(header.refreshLoading).toBe(true)
  })

  it('clears the header to its initial state', () => {
    setActivePinia(createPinia())
    const header = usePageHeader()
    header.setHeader({ title: 'Processes', toolsComponent: null })

    header.clearHeader()

    expect(header.title).toBe('Nebula')
    expect(header.subtitle).toBeUndefined()
    expect(header.toolsComponent).toBeNull()
    expect(header.toolsProps).toEqual({})
    expect(header.onRefresh).toBeNull()
    expect(header.refreshLoading).toBe(false)
  })
})
