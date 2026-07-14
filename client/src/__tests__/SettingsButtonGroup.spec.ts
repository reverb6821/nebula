import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsButtonGroup from '@/modules/settings/components/SettingsButtonGroup.vue'

describe('SettingsButtonGroup.vue', () => {
    const defaultOptions = [
        { value: 'sm', label: 'Piccolo' },
        { value: 'base', label: 'Default' },
        { value: 'lg', label: 'Grande' },
    ]

    it('dovrebbe renderizzare tutti i bottoni con le rispettive etichette', () => {
        const wrapper = mount(SettingsButtonGroup, {
            props: {
                options: defaultOptions,
                modelValue: 'base',
            },
        })

        const buttonTexts = wrapper.findAll('button').map(btn => btn.text())

        expect(buttonTexts).toHaveLength(3)
        expect(buttonTexts).toEqual(['Piccolo', 'Default', 'Grande'])
    })

    it('dovrebbe applicare le classi attive solo al bottone corrispondente al modelValue', () => {
        const wrapper = mount(SettingsButtonGroup, {
            props: {
                options: defaultOptions,
                modelValue: 'base',
            },
        })

        // Converte in array nativo
        const buttons = [...wrapper.findAll('button')]
        const firstButton = buttons[0]
        const secondButton = buttons[1]

        // Controllo di esistenza per TypeScript
        expect(firstButton).toBeTruthy()
        expect(secondButton).toBeTruthy()
        if (!firstButton || !secondButton) return

        // Il secondo bottone ('base') deve avere le classi dello stato attivo/selezionato
        expect(secondButton.classes()).toContain('border-indigo-500/50')
        expect(secondButton.classes()).toContain('bg-indigo-500/10')

        // Gli altri bottoni devono avere le classi di default/inattive
        expect(firstButton.classes()).toContain('border-zinc-700')
        expect(firstButton.classes()).not.toContain('border-indigo-500/50')
    })

    it('dovrebbe emettere "update:modelValue" con il valore corretto quando si clicca su un bottone', async () => {
        const wrapper = mount(SettingsButtonGroup, {
            props: {
                options: defaultOptions,
                modelValue: 'base',
            },
        })

        const buttons = [...wrapper.findAll('button')]
        const firstButton = buttons[0]

        expect(firstButton).toBeTruthy()
        if (!firstButton) return

        await firstButton.trigger('click')

        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['sm'])
    })

    it('dovrebbe applicare la classe flex-col se la prop vertical è true', () => {
        const wrapperDefault = mount(SettingsButtonGroup, {
            props: {
                options: defaultOptions,
                modelValue: 'base',
            },
        })
        expect(wrapperDefault.find('div').classes()).not.toContain('flex-col')

        const wrapperVertical = mount(SettingsButtonGroup, {
            props: {
                options: defaultOptions,
                modelValue: 'base',
                vertical: true,
            },
        })
        expect(wrapperVertical.find('div').classes()).toContain('flex-col')
    })

    it('dovrebbe renderizzare lo slot personalizzato se fornito', () => {
        const wrapper = mount(SettingsButtonGroup, {
            props: {
                options: defaultOptions,
                modelValue: 'base',
            },
            slots: {
                default: `
          <template #default="{ option }">
            <span class="custom-slot-class">Custom - {{ option.label }}</span>
          </template>
        `,
            },
        })

        const customSpan = wrapper.find('.custom-slot-class')
        expect(customSpan.exists()).toBe(true)
        expect(customSpan.text()).toBe('Custom - Piccolo')
    })
})