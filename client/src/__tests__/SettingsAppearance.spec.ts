import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useSettingsStore } from '@/modules/settings/store'
import SettingsAppearance from '@/modules/settings/components/SettingsAppearance.vue'

import SettingsSection from '@/modules/settings/components/SettingsSection.vue'
import SettingsRow from '@/modules/settings/components/SettingsRow.vue'
import SettingsButtonGroup from '@/modules/settings/components/SettingsButtonGroup.vue'
import { SharedSwitch } from '@/components/shared'

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
    }),
}))

describe('SettingsAppearance.vue', () => {
    let store: ReturnType<typeof useSettingsStore>
    let wrapper: VueWrapper<any>

    beforeEach(() => {
        wrapper = mount(SettingsAppearance, {
            global: {
                plugins: [
                    createTestingPinia({
                        createSpy: vi.fn,
                        initialState: {
                            settings: {
                                state: {
                                    fontSize: 'base',
                                    fontFamily: 'system',
                                    lineHeight: 'normal',
                                    reducedMotion: false,
                                    highContrast: false,
                                },
                            },
                        },
                    }),
                ],
                components: {
                    SettingsSection,
                    SettingsRow,
                    SettingsButtonGroup,
                    SharedSwitch,
                },
            },
        })

        store = useSettingsStore()
    })

    it('dovrebbe renderizzare la sezione con le opzioni tradotte corrette', () => {
        const section = wrapper.findComponent(SettingsSection)
        expect(section.props('title')).toBe('settings.sectionAppearance')

        const rowLabels = wrapper.findAllComponents(SettingsRow).map(row => row.props('label'))

        expect(rowLabels).toEqual([
            'settings.fontSize',
            'settings.fontFamily',
            'settings.lineHeight',
            'settings.reducedMotion',
            'settings.highContrast'
        ])
    })

    it('dovrebbe passare le opzioni di font size corrette e reagire al cambiamento', async () => {
        const buttonGroups = [...wrapper.findAllComponents(SettingsButtonGroup)]
        const fontSizeGroup = buttonGroups[0] as unknown as VueWrapper<any>

        expect(fontSizeGroup).toBeTruthy()
        if (!fontSizeGroup) return

        expect(fontSizeGroup.props('options')).toEqual([
            { value: 'sm', label: 'settings.fontSizeSmall' },
            { value: 'base', label: 'settings.fontSizeDefault' },
            { value: 'lg', label: 'settings.fontSizeLarge' },
            { value: 'xl', label: 'settings.fontSizeXL' },
        ])

        await fontSizeGroup.vm.$emit('update:modelValue', 'xl')
        expect(store.set).toHaveBeenCalledWith('fontSize', 'xl')
    })

    it('dovrebbe passare le opzioni di font family e gestire lo slot personalizzato', () => {
        const buttonGroups = [...wrapper.findAllComponents(SettingsButtonGroup)]
        const fontFamilyGroup = buttonGroups[1] as unknown as VueWrapper<any>

        expect(fontFamilyGroup).toBeTruthy()
        if (!fontFamilyGroup) return

        expect(fontFamilyGroup.props('vertical')).toBe(true)
        expect(fontFamilyGroup.props('options')[1]).toEqual({
            value: 'inter',
            label: 'settings.fontSans',
            previewFont: 'Inter',
        })

        const customSpan = wrapper.find('span[style*="font-family: Inter"]')
        expect(customSpan.exists()).toBe(true)
        expect(customSpan.text()).toBe('settings.fontSans')
    })

    it('dovrebbe cambiare lo stato di reducedMotion e highContrast quando si interagisce con SharedSwitch', async () => {
        const switches = [...wrapper.findAllComponents(SharedSwitch)]
        const motionSwitch = switches[0]
        const contrastSwitch = switches[1]

        expect(motionSwitch).toBeTruthy()
        expect(contrastSwitch).toBeTruthy()
        if (!motionSwitch || !contrastSwitch) return

        motionSwitch.vm.$emit('update:modelValue', true)
        expect(store.set).toHaveBeenCalledWith('reducedMotion', true)

        contrastSwitch.vm.$emit('update:modelValue', true)
        expect(store.set).toHaveBeenCalledWith('highContrast', true)
    })
})