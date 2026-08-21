export interface CpuCorePoint {
  id: number
  percent: number
}

export interface ResourcesSnapshot {
  cpuOverallPercent: number
  cpuCores: CpuCorePoint[]

  memTotalBytes: number
  memUsedBytes: number
  memUsedPercent: number
  memCacheBytes: number

  swapTotalBytes: number
  swapUsedBytes: number
  swapUsedPercent: number

  netRxRate: number
  netTxRate: number
  netRxTotal: number
  netTxTotal: number

  diskReadRate: number
  diskWriteRate: number
  diskReadTotal: number
  diskWriteTotal: number
}

// null = sensore non disponibile su questo sistema (niente lm-sensors,
// niente RAPL, niente GPU NVIDIA rilevata) — va gestito in UI, non è "zero".
export interface SensorsSnapshot {
  cpuTempC: number | null
  gpuTempC: number | null
  cpuPowerW: number | null
  gpuPowerW: number | null
}

export interface FsEntry {
  device: string
  mount: string
  fsType: string
  totalBytes: number
  availBytes: number
  usedBytes: number
  usedPercent: number
}