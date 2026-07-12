import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Info, XCircle, AlertCircle, CheckCircle2 } from '@lucide/vue'
import { SharedAlert } from '@/components/shared'

describe('SharedAlert.vue', () => {
  it('mostra il testo del titolo e della descrizione tramite props', () => {
    const wrapper = mount(SharedAlert, {
      props: {
        title: 'Attenzione',
        description: 'Questo è un messaggio importante',
      },
    })

    expect(wrapper.text()).toContain('Attenzione')
    expect(wrapper.text()).toContain('Questo è un messaggio importante')
  })

  it('mostra il titolo e la descrizione tramite slot', () => {
    const wrapper = mount(SharedAlert, {
      slots: {
        title: '<span>Titolo Slot</span>',
        default: '<span>Descrizione Slot</span>',
      },
    })

    expect(wrapper.html()).toContain('Titolo Slot')
    expect(wrapper.html()).toContain('Descrizione Slot')
  })

  it('assegna l\'icona Info per il variant di default', () => {
    const wrapper = mount(SharedAlert, {
      props: { variant: 'default' },
    })
    expect(wrapper.findComponent(Info).exists()).toBe(true)
  })

  it('assegna le icone e le classi corrette in base al variant', async () => {
    const destructiveWrapper = mount(SharedAlert, {
      props: { variant: 'destructive' },
    })
    expect(destructiveWrapper.findComponent(XCircle).exists()).toBe(true)

    const warningWrapper = mount(SharedAlert, {
      props: { variant: 'warning' },
    })
    expect(warningWrapper.findComponent(AlertCircle).exists()).toBe(true)
    expect(warningWrapper.classes()).toContain('border-amber-500/50')

    const successWrapper = mount(SharedAlert, {
      props: { variant: 'success' },
    })
    expect(successWrapper.findComponent(CheckCircle2).exists()).toBe(true)
    expect(successWrapper.classes()).toContain('border-emerald-500/50')
  })
})