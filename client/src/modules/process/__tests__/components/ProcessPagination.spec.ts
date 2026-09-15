import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProcessPagination from '../../components/ProcessPagination.vue'

// Select va stubbato per intero: SelectRoot di reka-ui fornisce context
// via provide/inject ai figli, che altrimenti proverebbero a fare inject
// da un provider inesistente — stesso motivo di SettingsLanguage.spec.ts.
const SelectStub = {
  name: 'Select',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div><slot /></div>',
}
const PassthroughStub = { template: '<div><slot /></div>' }

const globalStubs = {
  Select: SelectStub,
  SelectTrigger: PassthroughStub,
  SelectContent: PassthroughStub,
  SelectItem: PassthroughStub,
  SelectValue: PassthroughStub,
}

function mountPagination(props: Partial<{
  page: number; pageSize: number; total: number; totalPages: number
}> = {}) {
  return mount(ProcessPagination, {
    props: { page: 1, pageSize: 50, total: 120, totalPages: 3, ...props },
    global: { stubs: globalStubs },
  })
}

describe('ProcessPagination', () => {
  describe('rangeLabel', () => {
    it('calcola il range corretto per una pagina intermedia', () => {
      const wrapper = mountPagination({ page: 2, pageSize: 50, total: 120 })
      expect(wrapper.text()).toContain('51–100 of 120')
    })

    it('tronca il range sull\'ultima pagina parziale', () => {
      const wrapper = mountPagination({ page: 3, pageSize: 50, total: 120 })
      expect(wrapper.text()).toContain('101–120 of 120')
    })

    it('mostra "0 of 0" quando non ci sono risultati', () => {
      const wrapper = mountPagination({ page: 1, pageSize: 50, total: 0, totalPages: 1 })
      expect(wrapper.text()).toContain('0 of 0')
    })
  })

  describe('bottoni prev/next', () => {
    it('disabilita "precedente" sulla prima pagina', () => {
      const wrapper = mountPagination({ page: 1, totalPages: 3 })
      const [prev] = wrapper.findAll('button')
      expect(prev!.attributes('disabled')).toBeDefined()
    })

    it('disabilita "successiva" sull\'ultima pagina', () => {
      const wrapper = mountPagination({ page: 3, totalPages: 3 })
      const buttons = wrapper.findAll('button')
      const next = buttons[buttons.length - 1]!
      expect(next.attributes('disabled')).toBeDefined()
    })

    it('emette update:page con page-1 al click su "precedente"', async () => {
      const wrapper = mountPagination({ page: 2, totalPages: 3 })
      const [prev] = wrapper.findAll('button')
      await prev!.trigger('click')
      expect(wrapper.emitted('update:page')).toEqual([[1]])
    })

    it('emette update:page con page+1 al click su "successiva"', async () => {
      const wrapper = mountPagination({ page: 2, totalPages: 3 })
      const buttons = wrapper.findAll('button')
      const next = buttons[buttons.length - 1]!
      await next.trigger('click')
      expect(wrapper.emitted('update:page')).toEqual([[3]])
    })
  })

  it('emette update:pageSize come numero quando cambia la select', async () => {
    const wrapper = mountPagination({ pageSize: 50 })
    const select = wrapper.findComponent(SelectStub)

    await select.vm.$emit('update:modelValue', '100')

    expect(wrapper.emitted('update:pageSize')).toEqual([[100]])
  })
})