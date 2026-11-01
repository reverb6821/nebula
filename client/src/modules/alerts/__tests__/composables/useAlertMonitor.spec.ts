import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAlertsStore } from '@/modules/alerts/store'
import { useAlertMonitor } from '@/modules/alerts/composables/useAlertMonitor'
import type { Daemon } from '@/types/daemon'
import type { Process } from '@/types/process'
import type { FsEntry, ResourcesSnapshot, SensorsSnapshot } from '@/types/resources'

const mocks = vi.hoisted(() => ({
  collectResourcesNow: vi.fn<() => Promise<ResourcesSnapshot | null>>(),
  collectSensorsNow: vi.fn<() => Promise<SensorsSnapshot>>(),
  collectProcessesNow: vi.fn<() => Promise<Process[]>>(),
  collectDaemonsNow: vi.fn<() => Promise<Daemon[]>>(),
  listFilesystems: vi.fn<() => Promise<FsEntry[]>>(),
  notifyTriggeredAlert: vi.fn<() => Promise<void>>(),
}))

const collectResourcesNow = mocks.collectResourcesNow
const collectSensorsNow = mocks.collectSensorsNow
const collectProcessesNow = mocks.collectProcessesNow
const collectDaemonsNow = mocks.collectDaemonsNow
const listFilesystems = mocks.listFilesystems
const notifyTriggeredAlert = mocks.notifyTriggeredAlert


vi.mock('@/modules/dashboard/store', () => ({ useResourcesStore: () => ({ collectResourcesNow: mocks.collectResourcesNow, collectSensorsNow: mocks.collectSensorsNow }) }))
vi.mock('@/modules/process/store', () => ({ useProcessesStore: () => ({ collectNow: mocks.collectProcessesNow }) }))
vi.mock('@/modules/daemons/store', () => ({ useDaemonsStore: () => ({ collectNow: mocks.collectDaemonsNow }) }))
vi.mock('@/modules/dashboard/composables/useFileSystemApi', () => ({ listFilesystems: mocks.listFilesystems }))
vi.mock('@/modules/alerts/composables/useAlertNotifications', () => ({ notifyTriggeredAlert: mocks.notifyTriggeredAlert }))

const resources: ResourcesSnapshot = {
  cpuOverallPercent: 95, cpuCores: [], memTotalBytes: 100, memUsedBytes: 50,
  memUsedPercent: 50, memCacheBytes: 0, swapTotalBytes: 100, swapUsedBytes: 0,
  swapUsedPercent: 0, netRxRate: 0, netTxRate: 0, netRxTotal: 0, netTxTotal: 0,
  diskReadRate: 0, diskWriteRate: 0, diskReadTotal: 0, diskWriteTotal: 0,
}
const sensors: SensorsSnapshot = { cpuTempC: 40, gpuTempC: null, cpuPowerW: null, gpuPowerW: null }
const process: Process = {
  pid: 1, ppid: 0, user: 'root', pri: 20, ni: 0, status: 'R', cpuPercent: 0,
  memPercent: 0, virtBytes: 0, resBytes: 0, shrBytes: 0, cpuTime: '0:00', name: 'init', cmd: 'init',
}
const daemon: Daemon = { name: 'systemd', description: 'systemd', status: 'active', enabled: 'enabled' }

beforeEach(() => {
  setActivePinia(createPinia())
  vi.useFakeTimers()
  vi.setSystemTime(1_000)
  vi.clearAllMocks()
  collectResourcesNow.mockResolvedValue(resources)
  collectSensorsNow.mockResolvedValue(sensors)
  collectProcessesNow.mockResolvedValue([process])
  collectDaemonsNow.mockResolvedValue([daemon])
  listFilesystems.mockResolvedValue([])
})

describe('useAlertMonitor', () => {
  it('continues evaluating other categories when one collector fails', async () => {
    collectSensorsNow.mockRejectedValue(new Error('sensor unavailable'))
    const monitor = useAlertMonitor()
    await monitor.pollNow()

    const alertsStore = useAlertsStore()
    expect(alertsStore.sourceHealth).toContainEqual(expect.objectContaining({ source: 'sensors', status: 'degraded' }))
    expect(alertsStore.events).toEqual(expect.any(Array))
    expect(alertsStore.sourceHealth.find((source) => source.source === 'resources')?.status).toBe('healthy')
  })

  it('starts idempotently and repeated triggered samples update one event', async () => {
    const monitor = useAlertMonitor()
    monitor.start()
    monitor.start()
    await vi.advanceTimersByTimeAsync(0)
    vi.setSystemTime(31_000)
    await monitor.pollNow()
    vi.setSystemTime(32_000)
    await monitor.pollNow()

    const alertsStore = useAlertsStore()
    expect(monitor.isRunning.value).toBe(true)
    expect(alertsStore.events.filter((event) => event.presetKey === 'resources.cpu-high')).toHaveLength(1)
    expect(alertsStore.events.find((event) => event.presetKey === 'resources.cpu-high')?.observedValue).toBe(95)
  })

  it('notifies once when an event becomes triggered', async () => {
    const monitor = useAlertMonitor()
    await monitor.pollNow()
    vi.setSystemTime(31_000)
    await monitor.pollNow()

    expect(notifyTriggeredAlert).toHaveBeenCalledTimes(1)
  })

  it('preserves an active alert across monitor remounts without notifying again', async () => {
    const firstMonitor = useAlertMonitor()
    await firstMonitor.pollNow()
    vi.setSystemTime(31_000)
    await firstMonitor.pollNow()

    firstMonitor.stop()
    const remountedMonitor = useAlertMonitor()
    vi.setSystemTime(32_000)
    await remountedMonitor.pollNow()
    vi.setSystemTime(62_000)
    await remountedMonitor.pollNow()

    const alertsStore = useAlertsStore()
    expect(alertsStore.events.find((event) => event.presetKey === 'resources.cpu-high')?.state).toBe('triggered')
    expect(notifyTriggeredAlert).toHaveBeenCalledTimes(1)
  })

  it('stops the interval and ignores an in-flight poll result', async () => {
    let resolveResources!: (snapshot: ResourcesSnapshot) => void
    collectResourcesNow.mockReturnValue(new Promise((resolve) => { resolveResources = resolve }))
    const monitor = useAlertMonitor()
    const poll = monitor.pollNow()
    monitor.stop()
    resolveResources(resources)
    await poll

    expect(monitor.isRunning.value).toBe(false)
    expect(useAlertsStore().sourceHealth).toEqual([])
  })
})
