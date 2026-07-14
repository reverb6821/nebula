import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ImageItem from '@/modules/docker/components/ImageItem.vue'

const LucideStub = { template: '<div><slot /></div>' }
const TooltipStub = { template: '<div><slot /></div>' }
const ItemStub = { template: '<div><slot /></div>' }

describe('ImageItem.vue', () => {
  // Configurazione minimale i18n per supportare i testi dell'immagine
  const i18n = createI18n({
    legacy: false,
    locale: 'it',
    messages: {
      it: {
        docker: {
          removeImage: 'Elimina immagine'
        }
      }
    }
  })

  const mockImage = {
    id: 'sha256:987654321',
    repoTags: ['postgres:16'],
    size: 419430400, // 400 MB
    created: 1767222000 // 1 Jan 2026
  }

  const createWrapper = (props = {}) => {
    return mount(ImageItem, {
      props: {
        image: mockImage,
        pending: false,
        ...props
      },
      global: {
        plugins: [i18n],
        stubs: {
          Trash2: LucideStub,
          HardDrive: LucideStub,
          Tooltip: TooltipStub,
          TooltipTrigger: TooltipStub,
          TooltipContent: TooltipStub,
          Item: ItemStub,
          ItemMedia: ItemStub,
          ItemContent: ItemStub,
          ItemTitle: ItemStub,
          ItemDescription: ItemStub,
          ItemActions: ItemStub,
          SharedButton: {
            props: ['disabled', 'icon'],
            template: '<button class="mock-btn" :disabled="disabled" @click="$emit(\'click\')"></button>'
          }
        }
      }
    })
  }

  it('renderizza correttamente i dati dell immagine in formato riga di lista', () => {
    const wrapper = createWrapper()
    const text = wrapper.text()

    expect(text).toContain('postgres:16')
    expect(text).toContain('sha256:987654321')
    expect(text).toContain('400.0 MB')
    expect(text).toContain('2026') // Verifica la formattazione dell'anno
  })

  it('gestisce correttamente l emissione dell evento e lo stato abilitato/disabilitato del pulsante', async () => {
    const wrapper = createWrapper()
    const button = wrapper.find('.mock-btn')

    expect((button.element as HTMLButtonElement).disabled).toBe(false)
    await button.trigger('click')
    expect(wrapper.emitted('remove')).toBeTruthy()
  })

  it('disabilita il pulsante di eliminazione quando la proprietà pending è impostata su true', () => {
    const wrapper = createWrapper({ pending: true })
    const button = wrapper.find('.mock-btn')

    expect((button.element as HTMLButtonElement).disabled).toBe(true)
  })
})