import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Search } from '@lucide/vue'
import { SharedButton, SharedEmpty } from '@/components/shared'

describe('SharedEmpty.vue', () => {
  it('mostra correttamente titolo, descrizione e icona tramite props', () => {
    const wrapper = mount(SharedEmpty, {
      props: {
        title: 'Nessun dato',
        description: 'Prova a cambiare filtri',
        icon: Search,
      },
    })

    expect(wrapper.text()).toContain('Nessun dato')
    expect(wrapper.text()).toContain('Prova a cambiare filtri')
    expect(wrapper.findComponent(Search).exists()).toBe(true)
  })

  it('mostra titolo e descrizione inseriti negli slot', () => {
    const wrapper = mount(SharedEmpty, {
      slots: {
        title: '<h1>Titolo Personalizzato</h1>',
        description: '<p>Descrizione Personalizzata</p>',
      },
    })

    expect(wrapper.html()).toContain('Titolo Personalizzato')
    expect(wrapper.html()).toContain('Descrizione Personalizzata')
  })

  it('mostra il pulsante di azione ed emette l\'evento al click', async () => {
    const wrapper = mount(SharedEmpty, {
      props: {
        actionLabel: 'Riprova',
      },
    })

    const button = wrapper.findComponent(SharedButton)
    expect(button.exists()).toBe(true)
    expect(button.text()).toContain('Riprova')

    await button.trigger('click')
    expect(wrapper.emitted('action')).toBeTruthy()
    expect(wrapper.emitted('action')?.length).toBe(1)
  })

  it('permette di sovrascrivere l\'azione usando lo slot di default', () => {
    const wrapper = mount(SharedEmpty, {
      slots: {
        default: '<button class="custom-btn">Custom Action</button>',
      },
    })

    expect(wrapper.find('.custom-btn').exists()).toBe(true)
    expect(wrapper.findComponent(SharedButton).exists()).toBe(false)
  })
})