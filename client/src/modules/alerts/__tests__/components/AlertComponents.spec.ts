import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AlertSummary from '../../components/AlertSummary.vue'
import AlertFilters from '../../components/AlertFilters.vue'
import AlertList from '../../components/AlertList.vue'
import AlertDetail from '../../components/AlertDetail.vue'
import type { AlertEvent } from '@/types/alert'

const messages = {
  en: {
    common: { error: 'Error' },
    alerts: {
      monitoringTitle: 'Monitoring status', monitoringSubtitle: 'Collection health', monitoringHealthy: 'Monitoring healthy', monitoringDegraded: 'Monitoring degraded',
      active: 'Active', acknowledged: 'Acknowledged', resolved: 'Resolved', degradedSources: 'Degraded sources', unknownSource: 'Unknown',
      eventListTitle: 'Alert events', eventListSubtitle: 'Events', emptyTitle: 'No alert events', emptyDescription: 'No events', unknownAlert: 'Alert event',
      detailTitle: 'Event detail', detailEmptyTitle: 'Select an alert', detailEmptyDescription: 'Choose an event', observedValue: 'Observed {value}; threshold {threshold}', notAvailable: 'not available',
      firstDetected: 'First detected', lastUpdated: 'Last updated', timeline: 'Timeline', acknowledge: 'Acknowledge', export: 'Export', resolvedAt: 'Resolved {value}',
      filterPlaceholder: 'Filter alerts', filterState: 'State', filterCategory: 'Category', filterSeverity: 'Severity', stateTriggered: 'Triggered', stateAcknowledged: 'Acknowledged', stateResolved: 'Resolved', severityCritical: 'Critical', severityWarning: 'Warning', severityInfo: 'Info',
      category: { resources: 'Resources', storage: 'Storage', processes: 'Processes', services: 'Services', temperatures: 'Temperatures', network: 'Network' },
      messages: { cpuHigh: 'CPU usage has remained above 90%' },
    },
  },
}

const i18n = () => createI18n({ legacy: false, locale: 'en', messages })
const stubs = {
  SharedPanel: { template: '<section><slot name="header" /><slot name="meta" /><slot /><slot name="footer" /></section>' },
  SharedStatusBadge: { props: ['label'], template: '<span>{{ label }}</span>' },
  SharedAlert: { template: '<div><slot /></div>' },
  SharedEmpty: { template: '<div><slot name="title" /><slot name="description" /></div>' },
  SharedButton: { inheritAttrs: false, template: '<button v-bind="$attrs"><slot /></button>' },
  SharedFilter: { props: ['filterGroups'], template: `<div class="shared-filter"><button class="toggle-filter" @click="filterGroups[0].onToggle('triggered')" /><button class="reset-filter" @click="$emit('reset')" /></div>` },
}

const event: AlertEvent = {
  id: 'resources.cpu-high:cpu', presetKey: 'resources.cpu-high', category: 'resources', resourceKey: 'cpu', severity: 'warning', state: 'triggered', observedValue: 95, threshold: 90,
  firstDetectedAt: 1_000, lastUpdatedAt: 2_000, acknowledgedAt: null, resolvedAt: null,
  transitions: [{ state: 'triggered', at: 1_000, observedValue: 95 }],
}

describe('Alert Center components', () => {
  it('renders degraded monitoring without claiming the system is healthy', () => {
    const wrapper = mount(AlertSummary, { props: { monitoringStatus: 'degraded', degradedSources: ['sensors'] }, global: { plugins: [i18n()], stubs } })
    expect(wrapper.text()).toContain('sensors')
    expect(wrapper.text()).not.toContain('healthy')
  })

  it('wires filter toggle and reset events without mutating the input state', async () => {
    const filters = { states: [], categories: [], severities: [] }
    const wrapper = mount(AlertFilters, { props: { filters }, global: { plugins: [i18n()], stubs } })

    await wrapper.find('.toggle-filter').trigger('click')
    expect(wrapper.emitted('update:filters')?.[0]?.[0]).toEqual({ states: ['triggered'], categories: [], severities: [] })
    expect(filters.states).toEqual([])

    await wrapper.find('.reset-filter').trigger('click')
    expect(wrapper.emitted('update:filters')?.[1]?.[0]).toEqual({ states: [], categories: [], severities: [] })
  })

  it('emits selection and alert actions', async () => {
    const list = mount(AlertList, { props: { events: [event] }, global: { plugins: [i18n()], stubs } })
    await list.find('button').trigger('click')
    expect(list.emitted('select')?.[0]?.[0]).toEqual(event)

    const detail = mount(AlertDetail, { props: { event }, global: { plugins: [i18n()], stubs } })
    await detail.findAll('button')[0]?.trigger('click')
    expect(detail.emitted('acknowledge')?.[0]?.[0]).toEqual(event)
    await detail.findAll('button')[1]?.trigger('click')
    expect(detail.emitted('export')?.[0]?.[0]).toEqual(event)
  })
})
