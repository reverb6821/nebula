import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SharedPanel from '../SharedPanel.vue'

describe('SharedPanel', () => {
  it('renders its content in a cyber panel surface', () => {
    const wrapper = mount(SharedPanel, {
      slots: {
        default: '<span data-test="content">Telemetry</span>',
      },
    })

    expect(wrapper.classes()).toContain('cyber-panel')
    expect(wrapper.find('[data-test="content"]').text()).toBe('Telemetry')
  })

  it('marks selected and favorite states with semantic classes', () => {
    const selected = mount(SharedPanel, {
      props: {
        selected: true,
      },
    })
    const favorite = mount(SharedPanel, {
      props: {
        favorite: true,
      },
    })

    expect(selected.classes()).toContain('border-primary/50')
    expect(favorite.classes()).toContain('border-l-warning')
  })
})
