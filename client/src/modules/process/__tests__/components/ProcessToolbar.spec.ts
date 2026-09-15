import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import ProcessToolbar from '../../components/ProcessToolbar.vue'
import { useProcessesStore } from '../../store.ts'
import { PROCESS_STATUS_LABELS, PROCESS_STATUS_DOT } from '../../utils/processStatus.ts'

// SharedFilter è pesante (Popover/Tooltip/Kbd di reka-ui): lo stubbiamo
// catturando le prop ricevute, per testare solo la logica di
// ProcessToolbar (filterGroups/activeChips), non il rendering interno di
// SharedFilter (già coperto a parte).
const SharedFilterStub = {
  name: 'SharedFilter',
  props: ['search', 'placeholder', 'filterGroups', 'activeChips', 'hasActiveFilters'],
  template: `<div class="stub-filter" :data-groups="JSON.stringify(filterGroups)" :data-chips="JSON.stringify(activeChips.map(c => c.label))" />`,
}

function mountToolbar() {
  return mount(ProcessToolbar, {
    global: { stubs: { SharedFilter: SharedFilterStub } },
  })
}

function readGroups(wrapper: ReturnType<typeof mountToolbar>) {
  const el = wrapper.find('.stub-filter')
  return JSON.parse(el.attributes('data-groups')!) as {
    label: string
    options: { value: string; label: string; dotClass: string }[]
    active: string[]
  }[]
}

function readChipLabels(wrapper: ReturnType<typeof mountToolbar>) {
  const el = wrapper.find('.stub-filter')
  return JSON.parse(el.attributes('data-chips')!) as string[]
}

describe('ProcessToolbar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('genera un unico gruppo "Status" con le 6 opzioni nell\'ordine R/S/D/Z/T/I', () => {
    const wrapper = mountToolbar()
    const groups = readGroups(wrapper)

    expect(groups).toHaveLength(1)
    expect(groups[0]!.label).toBe('Status')
    expect(groups[0]!.options.map((o) => o.value)).toEqual(['R', 'S', 'D', 'Z', 'T', 'I'])
  })

  it('ogni opzione usa label e dotClass da processStatus.ts (nessuna duplicazione locale)', () => {
    const wrapper = mountToolbar()
    const [group] = readGroups(wrapper)

    for (const opt of group!.options) {
      expect(opt.label).toBe(PROCESS_STATUS_LABELS[opt.value as keyof typeof PROCESS_STATUS_LABELS])
      expect(opt.dotClass).toBe(PROCESS_STATUS_DOT[opt.value as keyof typeof PROCESS_STATUS_DOT])
    }
  })

  it('activeChips riflette i filtri attivi nello store e si aggiorna quando cambiano', async () => {
    const wrapper = mountToolbar()
    const store = useProcessesStore()

    expect(readChipLabels(wrapper)).toEqual([])

    store.toggleStatusFilter('Z')
    await nextTick()

    expect(readChipLabels(wrapper)).toEqual([PROCESS_STATUS_LABELS.Z])

    store.toggleStatusFilter('R')
    await nextTick()

    expect(readChipLabels(wrapper)).toEqual([PROCESS_STATUS_LABELS.Z, PROCESS_STATUS_LABELS.R])
  })

  it('il filtro nel gruppo riflette lo stesso stato attivo esposto negli chip', async () => {
    const wrapper = mountToolbar()
    const store = useProcessesStore()

    store.toggleStatusFilter('S')
    await nextTick()

    const [group] = readGroups(wrapper)
    expect(group!.active).toEqual(['S'])
  })

  it('lo switch "Auto" riflette autoRefresh dello store e lo aggiorna al toggle', async () => {
    const wrapper = mountToolbar()
    const store = useProcessesStore()
    expect(store.autoRefresh).toBe(true)

    const toggle = wrapper.find('button[role="switch"]')
    expect(toggle.attributes('aria-checked')).toBe('true')

    await toggle.trigger('click')

    expect(store.autoRefresh).toBe(false)
  })
})