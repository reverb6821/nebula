import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import ImageCard from '@/modules/docker/components/ImageCard.vue'

const LucideStub = { template: '<div><slot /></div>' }
const TooltipStub = { template: '<div><slot /></div>' }

describe('ImageCard.vue', () => {
  // Configurazione minimale i18n per supportare i testi dell'immagine
  const i18n = createI18n({
    legacy: false,
    locale: 'it',
    messages: {
      it: {
        docker: {
          imageSizeLabel: 'Dimensione',
          imageCreatedLabel: 'Creata',
          removeImage: 'Elimina immagine'
        }
      }
    }
  })

  const mockImage = {
    id: 'sha256:1234567890abcdef',
    repoTags: ['nginx:latest', 'nginx:1.25'],
    size: 134217728, // 128 MB
    created: 1767222000 // 1 Jan 2026
  }

  const createWrapper = (props = {}) => {
    return mount(ImageCard, {
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
          SharedButton: {
            props: ['disabled', 'icon'],
            template: '<button class="mock-btn" :disabled="disabled" @click="$emit(\'click\')"></button>'
          }
        }
      }
    })
  }

  it('renderizza correttamente i tag, l id, la dimensione formattata e la data dell immagine', () => {
    const wrapper = createWrapper()
    const text = wrapper.text()

    expect(text).toContain('nginx:latest')
    expect(text).toContain('nginx:1.25')
    expect(text).toContain('sha256:1234567890abcdef')
    expect(text).toContain('128.0 MB')
    expect(text).toContain('2026') // Verifica la formattazione dell'anno
    expect(text).toContain('Dimensione')
    expect(text).toContain('Creata')
  })

  it('emette l evento remove quando si preme il pulsante di eliminazione', async () => {
    const wrapper = createWrapper()
    const button = wrapper.find('.mock-btn')

    await button.trigger('click')
    expect(wrapper.emitted('remove')).toBeTruthy()
  })

  it('disabilita il pulsante di eliminazione quando la proprietà pending è impostata su true', () => {
    const wrapper = createWrapper({ pending: true })
    const button = wrapper.find('.mock-btn')

    expect((button.element as HTMLButtonElement).disabled).toBe(true)
  })
})