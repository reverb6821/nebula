import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
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
      loading: 'Loading', sourceLabel: 'Source · {name}', observed: 'Observed', occurrences: 'Occurrences', timelineEntry: '{state}', observedShort: 'value {value}', restartUnit: 'Restart unit', openInServices: 'Open in Services',
      filterPlaceholder: 'Filter alerts', filterState: 'State', filterCategory: 'Category', filterSeverity: 'Severity', stateTriggered: 'Triggered', stateAcknowledged: 'Acknowledged', stateResolved: 'Resolved', severityCritical: 'Critical', severityWarning: 'Warning', severityInfo: 'Info',
      category: { resources: 'Resources', storage: 'Storage', processes: 'Processes', services: 'Services', temperatures: 'Temperatures', network: 'Network' },
      messages: { cpuHigh: 'CPU usage has remained above 90%' },
    },
  },
}

const i18n = () => createI18n({ legacy: false, locale: 'en', messages })
const stubs = {}

const event: AlertEvent = {
  id: 'resources.cpu-high:cpu', presetKey: 'resources.cpu-high', category: 'resources', resourceKey: 'cpu', severity: 'warning', state: 'triggered', observedValue: 95, threshold: 90,
  firstDetectedAt: 1_000, lastUpdatedAt: 2_000, acknowledgedAt: null, resolvedAt: null,
  transitions: [{ state: 'triggered', at: 1_000, observedValue: 95 }],
}

describe('Alert Center components', () => {
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

  it('shows the selected row as pressed and the triggered state label', () => {
    const list = mount(AlertList, { props: { events: [event], selectedId: event.id }, global: { plugins: [i18n()], stubs } })
    expect(list.find('button').attributes('aria-pressed')).toBe('true')
    expect(list.text()).toContain('Triggered')
    expect(list.text()).toContain('CPU usage has remained above 90%')
  })

  it('offers unit actions only for service alerts', async () => {
    const serviceEvent: AlertEvent = { ...event, id: 'services.daemon-failed:sshd', presetKey: 'services.daemon-failed', category: 'services', resourceKey: 'sshd' }
    const detail = mount(AlertDetail, {
      props: { event: serviceEvent },
      global: { plugins: [i18n()], stubs: { ...stubs, RouterLink: { template: '<a><slot /></a>' } } },
    })
    const restart = detail.findAll('button').find((b) => b.text() === 'Restart unit')
    expect(restart).toBeDefined()
    await restart!.trigger('click')
    expect(detail.emitted('restartUnit')?.[0]?.[0]).toEqual(serviceEvent)

    const resourceDetail = mount(AlertDetail, { props: { event }, global: { plugins: [i18n()], stubs } })
    expect(resourceDetail.text()).not.toContain('Restart unit')
  })
})
