import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { ResourcesSnapshot, SensorsSnapshot } from '@/types/resources'
import { useResourcesStore } from '../store'

let resourceTick: (() => Promise<ResourcesSnapshot | null>) | undefined
let sensorTick: (() => Promise<SensorsSnapshot>) | undefined

const pause = vi.fn()
const resume = vi.fn()

vi.mock('@vueuse/core', () => ({
  useIntervalFn: (callback: () => Promise<void>) => {
    resourceTick = callback as unknown as () => Promise<ResourcesSnapshot | null>
    return { pause, resume }
  },
}))

vi.mock('../composables/useResourcesApi', () => ({
  createResourcesSampler: vi.fn(() => vi.fn()),
}))

vi.mock('../composables/useSensorsApi', () => ({
  createSensorsSampler: vi.fn(() => vi.fn()),
}))

const snapshot: ResourcesSnapshot = {
  cpuOverallPercent: 25,
  cpuCores: [{ id: 0, percent: 25 }],
  memTotalBytes: 1000,
  memUsedBytes: 400,
  memUsedPercent: 40,
  memCacheBytes: 100,
  swapTotalBytes: 1000,
  swapUsedBytes: 100,
  swapUsedPercent: 10,
  netRxRate: 100,
  netTxRate: 200,
  netRxTotal: 1000,
  netTxTotal: 2000,
  diskReadRate: 300,
  diskWriteRate: 400,
  diskReadTotal: 3000,
  diskWriteTotal: 4000,
}

const sensors: SensorsSnapshot = {
  cpuTempC: 55,
  gpuTempC: 65,
  cpuPowerW: 30,
  gpuPowerW: 40,
}

describe('useResourcesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    resourceTick = undefined
    sensorTick = undefined
  })

  it('stores resource history and runs sensors every third tick', async () => {
    const { createResourcesSampler } = await import('../composables/useResourcesApi')
    const { createSensorsSampler } = await import('../composables/useSensorsApi')
    vi.mocked(createResourcesSampler).mockReturnValue(vi.fn().mockResolvedValue(snapshot))
    vi.mocked(createSensorsSampler).mockReturnValue(vi.fn().mockResolvedValue(sensors))

    const store = useResourcesStore()
    store.start()
    await Promise.resolve()
    await Promise.resolve()
    expect(store.snapshot).toEqual(snapshot)
    expect(store.cpuOverallHistory).toEqual([25])

    const trigger = resourceTick!
    await trigger()
    await trigger()
    expect(store.cpuOverallHistory).toHaveLength(3)
    expect(store.cpuTempHistory).toEqual([55])
    expect(store.gpuPowerAvg).toBe(40)
    expect(resume).toHaveBeenCalled()
  })

  it('reports unavailable sensors and clamps history to 60 samples', async () => {
    const { createResourcesSampler } = await import('../composables/useResourcesApi')
    const { createSensorsSampler } = await import('../composables/useSensorsApi')
    vi.mocked(createResourcesSampler).mockReturnValue(vi.fn().mockResolvedValue(snapshot))
    vi.mocked(createSensorsSampler).mockReturnValue(vi.fn().mockResolvedValue({
      cpuTempC: null,
      gpuTempC: null,
      cpuPowerW: null,
      gpuPowerW: null,
    }))

    const store = useResourcesStore()
    store.start()
    await Promise.resolve()
    await Promise.resolve()
    const trigger = resourceTick!
    for (let i = 0; i < 65; i++) await trigger()

    expect(store.cpuOverallHistory).toHaveLength(60)
    expect(store.sensorsUnavailable).toBe(true)
    expect(store.netMaxRate).toBe(1024 * 1024)
    store.stop()
    expect(pause).toHaveBeenCalled()
  })
})