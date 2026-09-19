import { ref } from 'vue'
import type { Daemon } from '@/types/daemon'
import type { Process } from '@/types/process'
import type { FsEntry, ResourcesSnapshot, SensorsSnapshot } from '@/types/resources'
import type {
  AlertCategory,
  AlertPreset,
  NormalizedDaemonRecord,
  NormalizedFilesystemRecord,
  NormalizedNetworkRecord,
  NormalizedProcessRecord,
  NormalizedResourceRecord,
  NormalizedSensorRecord,
  NormalizedSnapshot,
  SourceHealth,
} from '@/types/alert'
import { useAlertsStore } from '@/modules/alerts/store'
import { evaluateAlert } from '@/modules/alerts/utils/evaluateAlert'
import { ALERT_PRESETS } from '@/modules/alerts/utils/alertPresets'
import { useResourcesStore } from '@/modules/dashboard/store'
import { listFilesystems } from '@/modules/dashboard/composables/useFileSystemApi'
import { useProcessesStore } from '@/modules/process/store'
import { useDaemonsStore } from '@/modules/daemons/store'
import { notifyTriggeredAlert } from '@/modules/alerts/composables/useAlertNotifications'

const POLL_INTERVAL_MS = 5_000

interface Collection<T> {
  value: T
  error: unknown
}

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function sourceHealth(
  source: string,
  category: AlertCategory,
  status: SourceHealth['status'],
  message: string,
  now: number,
): SourceHealth {
  return { source, category, status, message, updatedAt: now }
}

async function isolate<T>(collector: () => Promise<T>): Promise<Collection<T | null>> {
  try {
    return { value: await collector(), error: null }
  } catch (error) {
    return { value: null, error }
  }
}

function normalizeResources(snapshot: ResourcesSnapshot | null): NormalizedResourceRecord[] {
  if (!snapshot) return []
  return [{
    resourceKey: 'host',
    cpuOverallPercent: snapshot.cpuOverallPercent,
    memUsedPercent: snapshot.memUsedPercent,
    swapUsedPercent: snapshot.swapUsedPercent,
  }]
}

function normalizeFilesystems(entries: FsEntry[]): NormalizedFilesystemRecord[] {
  return entries.map((entry) => ({
    resourceKey: entry.mount,
    mount: entry.mount,
    usedPercent: entry.usedPercent,
    availBytes: entry.availBytes,
  }))
}

function normalizeProcesses(processes: Process[]): NormalizedProcessRecord[] {
  return processes.map((process) => ({
    resourceKey: String(process.pid),
    pid: process.pid,
    name: process.name,
    cpuPercent: process.cpuPercent,
    memPercent: process.memPercent,
    status: process.status,
  }))
}

function normalizeDaemons(daemons: Daemon[]): NormalizedDaemonRecord[] {
  return daemons.map((daemon) => ({
    resourceKey: daemon.name,
    name: daemon.name,
    status: daemon.status,
    pid: daemon.pid ?? null,
  }))
}

function normalizeSensors(sensors: SensorsSnapshot): NormalizedSensorRecord[] {
  return [
    { resourceKey: 'cpu', name: 'CPU', temperatureC: sensors.cpuTempC },
    { resourceKey: 'gpu', name: 'GPU', temperatureC: sensors.gpuTempC },
  ]
}

function normalizeNetwork(snapshot: ResourcesSnapshot | null): NormalizedNetworkRecord[] {
  if (!snapshot) return []
  return [{
    resourceKey: 'aggregate',
    interface: 'aggregate',
    rxErrors: null,
    txErrors: null,
    connected: null,
  }]
}

type NormalizedRecord =
  | NormalizedResourceRecord
  | NormalizedFilesystemRecord
  | NormalizedProcessRecord
  | NormalizedDaemonRecord
  | NormalizedSensorRecord
  | NormalizedNetworkRecord

function valueFor(preset: AlertPreset, record: NormalizedRecord): number | null {
  if (preset.metric === 'failedStatus') {
    return 'status' in record && record.status === 'failed' ? 1 : 0
  }
  if (preset.metric === 'errorCount') {
    const rx = 'rxErrors' in record ? record.rxErrors : null
    const tx = 'txErrors' in record ? record.txErrors : null
    return typeof rx === 'number' && typeof tx === 'number' ? rx + tx : null
  }
  const value = (record as unknown as Record<string, unknown>)[preset.metric]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function recordsFor(snapshot: NormalizedSnapshot, category: AlertCategory): NormalizedRecord[] {
  switch (category) {
    case 'resources': return snapshot.resources
    case 'storage': return snapshot.filesystems
    case 'processes': return snapshot.processes
    case 'services': return snapshot.daemons
    case 'temperatures': return snapshot.sensors
    case 'network': return snapshot.network
  }
}

export function useAlertMonitor() {
  const alertsStore = useAlertsStore()
  const resourcesStore = useResourcesStore()
  const processesStore = useProcessesStore()
  const daemonsStore = useDaemonsStore()
  const isRunning = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  let interval: ReturnType<typeof setInterval> | null = null
  let generation = 0

  async function collectSnapshot(now: number): Promise<{ snapshot: NormalizedSnapshot; health: SourceHealth[] }> {
    const [resources, sensors, filesystems, processes, daemons] = await Promise.all([
      isolate(() => resourcesStore.collectResourcesNow()),
      isolate(() => resourcesStore.collectSensorsNow()),
      isolate(() => listFilesystems()),
      isolate(() => processesStore.collectNow()),
      isolate(() => daemonsStore.collectNow()),
    ])

    const health: SourceHealth[] = []
    const healthy = (source: string, category: AlertCategory) =>
      health.push(sourceHealth(source, category, 'healthy', 'Source available', now))
    const degraded = (source: string, category: AlertCategory, error: unknown) =>
      health.push(sourceHealth(source, category, 'degraded', messageFor(error), now))

    resources.error ? degraded('resources', 'resources', resources.error) : resources.value ? healthy('resources', 'resources') : degraded('resources', 'resources', 'Resource sample unavailable')
    sensors.error
      ? degraded('sensors', 'temperatures', sensors.error)
      : sensors.value && Object.values(sensors.value).some((value) => value !== null)
        ? healthy('sensors', 'temperatures')
        : degraded('sensors', 'temperatures', 'Hardware sensors unavailable')
    filesystems.error ? degraded('filesystem', 'storage', filesystems.error) : healthy('filesystem', 'storage')
    processes.error ? degraded('processes', 'processes', processes.error) : healthy('processes', 'processes')
    daemons.error ? degraded('daemons', 'services', daemons.error) : healthy('daemons', 'services')
    degraded('network', 'network', 'Network error and connectivity metrics unavailable')

    const resourceSnapshot = resources.value
    return {
      snapshot: {
        timestamp: now,
        resources: normalizeResources(resourceSnapshot),
        filesystems: normalizeFilesystems(filesystems.value ?? []),
        processes: normalizeProcesses(processes.value ?? []),
        daemons: normalizeDaemons(daemons.value ?? []),
        sensors: normalizeSensors(sensors.value ?? { cpuTempC: null, gpuTempC: null, cpuPowerW: null, gpuPowerW: null }),
        network: normalizeNetwork(resourceSnapshot),
      },
      health,
    }
  }

  async function pollNow() {
    const currentGeneration = generation
    const now = Date.now()
    isLoading.value = true
    try {
      const { snapshot, health } = await collectSnapshot(now)
      if (currentGeneration !== generation) return

      error.value = null
      health.forEach((record) => alertsStore.recordSourceHealth(record))
      for (const preset of ALERT_PRESETS) {
        for (const record of recordsFor(snapshot, preset.category)) {
          const resourceKey = String(record.resourceKey ?? 'unknown')
          const identity = `${preset.key}:${resourceKey}`
          const evaluation = evaluateAlert(
            preset,
            resourceKey,
            valueFor(preset, record),
            snapshot.timestamp,
            alertsStore.evaluationStateFor(identity),
          )
          alertsStore.setEvaluationState(identity, evaluation.nextState)
          const event = alertsStore.applyEvaluation(evaluation)
          if (evaluation.transition === 'triggered' && event) {
            await notifyTriggeredAlert(event)
          }
        }
      }
    } catch (pollError) {
      if (currentGeneration === generation) error.value = messageFor(pollError)
    } finally {
      if (currentGeneration === generation) isLoading.value = false
    }
  }

  function start() {
    if (isRunning.value) return
    isRunning.value = true
    generation++
    void pollNow()
    interval = setInterval(() => { void pollNow() }, POLL_INTERVAL_MS)
  }

  function stop() {
    if (interval !== null) {
      clearInterval(interval)
      interval = null
    }
    isRunning.value = false
    generation++
  }

  return { start, stop, isRunning, isLoading, error, pollNow }
}
