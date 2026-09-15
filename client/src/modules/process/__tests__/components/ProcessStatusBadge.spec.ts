import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProcessStatusBadge from '../../components/ProcessStatusBadge.vue'
import { PROCESS_STATUS_LABELS, PROCESS_STATUS_DOT } from '../../utils/processStatus.ts'
import type { ProcessStatus } from '../../../../types/process.ts'

// Stessi codici STAT di `ps` usati in ProcessToolbar.vue (R/S/D/Z/T/I).
const statuses: ProcessStatus[] = ['R', 'S', 'D', 'Z', 'T', 'I']

describe('ProcessStatusBadge', () => {
  it.each(statuses)('mostra la label corretta per lo stato %s', (status) => {
    const wrapper = mount(ProcessStatusBadge, { props: { status } })
    expect(wrapper.text()).toBe(PROCESS_STATUS_LABELS[status])
  })

  it.each(statuses)('applica la classe colore del pallino corretta per lo stato %s', (status) => {
    const wrapper = mount(ProcessStatusBadge, { props: { status } })
    const dot = wrapper.find('span[aria-hidden="true"]')

    // Classi base sempre presenti, indipendenti dallo stato
    expect(dot.classes()).toEqual(
      expect.arrayContaining(['h-1.5', 'w-1.5', 'shrink-0', 'rounded-full']),
    )
    // Classe(i) di colore specifica per questo stato
    for (const cls of PROCESS_STATUS_DOT[status].split(' ')) {
      expect(dot.classes()).toContain(cls)
    }
  })
})