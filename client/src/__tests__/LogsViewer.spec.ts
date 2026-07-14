import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createI18n } from 'vue-i18n'
import LogsViewer from '@/modules/docker/components/LogsViewer.vue'

const LucideStub = { template: '<div><slot /></div>' }

describe('LogsViewer.vue', () => {
  // Configurazione minimale i18n per supportare i testi del visualizzatore log
  const i18n = createI18n({
    legacy: false,
    locale: 'it',
    messages: {
      it: {
        docker: {
          logsLines: '{n} righe',
          logsLive: 'LIVE',
          logsWaiting: 'In attesa di log...',
          logsResumeTail: 'Riprendi scorrimento automatico'
        }
      }
    }
  })

  beforeEach(() => {
    vi.restoreAllMocks()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'mock-url'),
      revokeObjectURL: vi.fn()
    })
  })

  const createWrapper = (props = {}) => {
    return mount(LogsViewer, {
      props: {
        containerName: 'test-container',
        lines: [
          '2026-07-13 INFO: Server started successfully',
          '2026-07-13 WARN: High memory usage detected',
          '2026-07-13 ERROR: Connection failed'
        ],
        ...props
      },
      global: {
        plugins: [i18n],
        stubs: {
          X: LucideStub,
          Download: LucideStub,
          ArrowDown: LucideStub,
          Button: {
            template: '<button class="mock-btn" @click="$emit(\'click\')"><slot /></button>'
          }
        }
      }
    })
  }

  it('renderizza correttamente il nome del container e le righe dei log', () => {
    const wrapper = createWrapper()
    const text = wrapper.text()

    expect(text).toContain('test-container')
    expect(text).toContain('3 righe')
    expect(text).toContain('Server started successfully')
    expect(text).toContain('High memory usage detected')
    expect(text).toContain('Connection failed')
  })

  it('applica le classi CSS corrette in base alla tipologia di log', () => {
    const wrapper = createWrapper()
    const logDivs = wrapper.findAll('.whitespace-pre-wrap')

    expect(logDivs[0]!.classes()).toContain('text-zinc-300')
    expect(logDivs[1]!.classes()).toContain('text-amber-400/90')
    expect(logDivs[2]!.classes()).toContain('text-red-400/90')
  })

  it('emette l evento close quando si clicca sul relativo pulsante', async () => {
    const wrapper = createWrapper()
    const closeButton = wrapper.findAll('.mock-btn')[1]

    await closeButton!.trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('gestisce il download dei log creando un file di testo temporaneo', async () => {
    const linkSpy = {
      href: '',
      download: '',
      click: vi.fn()
    }

    const originalCreateElement = document.createElement.bind(document)

    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      if (tagName === 'a') {
        return linkSpy as unknown as HTMLElement
      }
      return originalCreateElement(tagName, options)
    })

    const wrapper = createWrapper()
    const downloadButton = wrapper.findAll('.mock-btn')[0]

    await downloadButton!.trigger('click')

    expect(URL.createObjectURL).toHaveBeenCalled()
    expect(linkSpy.download).toBe('test-container-logs.txt')
    expect(linkSpy.click).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-url')
  })

  it('mostra il pulsante di ripristino scorrimento solo se autoScroll diventa false', async () => {
    const wrapper = createWrapper()

    expect(wrapper.find('button.cursor-pointer').exists()).toBe(false)

    // Forziamo l'elemento DOM a simulare uno scorrimento verso l'alto
    const scrollEl = wrapper.find({ ref: 'scrollEl' })
    Object.defineProperty(scrollEl.element, 'scrollTop', { value: 10, configurable: true })
    Object.defineProperty(scrollEl.element, 'scrollHeight', { value: 500, configurable: true })
    Object.defineProperty(scrollEl.element, 'clientHeight', { value: 200, configurable: true })

    await scrollEl.trigger('scroll')
    expect(wrapper.find('button.cursor-pointer').exists()).toBe(true)
  })
})