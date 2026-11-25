import type { DaemonStatus } from '@/types/daemon'
import type { ProcessStatus } from '@/types/process'

export type AlertCategory =
  | 'resources'
  | 'storage'
  | 'processes'
  | 'services'
  | 'temperatures'
  | 'network'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export type AlertLifecycle = 'pending' | 'triggered' | 'acknowledged' | 'resolved'

export type SourceStatus = 'healthy' | 'degraded' | 'stale'

export type AlertComparison = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq'

export interface AlertPreset {
  key: string
  category: AlertCategory
  metric: string
  severity: AlertSeverity
  comparison: AlertComparison
  threshold: number
  minimumDurationMs: number
  cooldownMs: number
  messageKey: string
}

export interface AlertTransition {
  state: AlertLifecycle
  at: number
  observedValue: number | null
}

export interface AlertEvent {
  id: string
  presetKey: string
  category: AlertCategory
  resourceKey: string
  severity: AlertSeverity
  state: AlertLifecycle
  observedValue: number | null
  threshold: number
  firstDetectedAt: number
  lastUpdatedAt: number
  acknowledgedAt: number | null
  resolvedAt: number | null
  transitions: AlertTransition[]
}

export interface SourceHealth {
  source: string
  category: AlertCategory
  status: SourceStatus
  message: string
  updatedAt: number
}

export interface NormalizedResourceRecord {
  resourceKey: string
  cpuOverallPercent: number | null
  memUsedPercent: number | null
  swapUsedPercent: number | null
}

export interface NormalizedFilesystemRecord {
  resourceKey: string
  mount: string
  usedPercent: number | null
  availBytes: number | null
}

export interface NormalizedProcessRecord {
  resourceKey: string
  pid: number
  name: string
  cpuPercent: number | null
  memPercent: number | null
  status: ProcessStatus | null
}

export interface NormalizedDaemonRecord {
  resourceKey: string
  name: string
  status: DaemonStatus | null
  pid: number | null
}

export interface NormalizedSensorRecord {
  resourceKey: string
  name: string
  temperatureC: number | null
}

export interface NormalizedNetworkRecord {
  resourceKey: string
  interface: string
  rxErrors: number | null
  txErrors: number | null
  connected: boolean | null
}

export interface NormalizedSnapshot {
  timestamp: number
  resources: NormalizedResourceRecord[]
  filesystems: NormalizedFilesystemRecord[]
  processes: NormalizedProcessRecord[]
  daemons: NormalizedDaemonRecord[]
  sensors: NormalizedSensorRecord[]
  network: NormalizedNetworkRecord[]
}
