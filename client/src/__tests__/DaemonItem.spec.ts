import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DaemonItem from '@/modules/daemons/components/DaemonItem.vue'

describe('DaemonItem.vue', () => {
    const defaultProps = {
        daemon: {
            name: 'redis',
            status: 'failed' as const,
            enabled: 'static' as const,
            description: 'In-memory DB'
        },
        pending: false,
        favorite: true
    }

    const mountItem = (props = {}) => {
        return mount(DaemonItem, {
            props: { ...defaultProps, ...props },
            global: {
                stubs: {
                    Item: { template: '<div><slot /></div>' },
                    ItemMedia: { template: '<div><slot /></div>' },
                    ItemContent: { template: '<div><slot /></div>' },
                    ItemTitle: { template: '<div><slot /></div>' },
                    ItemDescription: { template: '<div><slot /></div>' },
                    ItemActions: { template: '<div><slot /></div>' },
                    Tooltip: { template: '<div><slot /></div>' },
                    TooltipTrigger: { template: '<div><slot /></div>' },
                    TooltipContent: { template: '<div><slot /></div>' },
                    SharedButton: { template: '<button><slot /></button>' },
                    SharedSwitch: { template: '<input type="checkbox" disabled />' }
                }
            }
        })
    }

    it('applica la classe di fallimento sul pallino di stato', () => {
        const wrapper = mountItem()
        const dot = wrapper.find('.rounded-full')
        expect(dot.classes()).toContain('bg-red-400')
    })

    it('disabilita lo switch di boot se l\'unità è di tipo static', () => {
        const wrapper = mountItem()
        const checkbox = wrapper.find('input[type="checkbox"]')
        expect(checkbox.attributes('disabled')).toBeDefined()
    })
})