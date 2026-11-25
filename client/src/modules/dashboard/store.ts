import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import type { ResourcesSnapshot, SensorsSnapshot } from '@/types/resources'
import { createResourcesSampler } from './composables/useResourcesApi'
import { createSensorsSampler } from './composables/useSensorsApi'

const HISTORY_LENGTH = 60 // secondi
const SENSORS_EVERY_N_TICKS = 3 // sensors/nvidia-smi pesano di più di un `cat /proc/*`

function pushHistory(arr: number[], value: number) {
  arr.push(value)
  if (arr.length > HISTORY_LENGTH) arr.shift()
}

function average(arr: number[]): number | null {
  if (arr.length === 0) return null
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export const useResourcesStore = defineStore('resources', () => {
  const snapshot = ref<ResourcesSnapshot | null>(null)
  const sensors = ref<SensorsSnapshot>({
    cpuTempC: null, gpuTempC: null, cpuPowerW: null, gpuPowerW: null,
  })

  const cpuOverallHistory = ref<number[]>([])
  const cpuCoreHistory    = ref<number[][]>([]) // un array per core
  const memHistory  = ref<number[]>([])
  const swapHistory = ref<number[]>([])
  const netRxHistory = ref<number[]>([])
  const netTxHistory = ref<number[]>([])
  const diskReadHistory  = ref<number[]>([])
  const diskWriteHistory = ref<number[]>([])
  const cpuTempHistory  = ref<number[]>([])
  const gpuTempHistory  = ref<number[]>([])
  const cpuPowerHistory = ref<number[]>([])
  const gpuPowerHistory = ref<number[]>([])

  const sampleResources = createResourcesSampler()
  const sampleSensors = createSensorsSampler()
  let sensorsSampled = false
  let dashboardRunning = false

  async function collectResourcesNow(): Promise<ResourcesSnapshot | null> {
    if (dashboardRunning && snapshot.value) return snapshot.value
    const sampled = await sampleResources()
    if (sampled) snapshot.value = sampled
    return sampled
  }

  async function collectSensorsNow(): Promise<SensorsSnapshot> {
    if (dashboardRunning && sensorsSampled) return sensors.value
    const sampled = await sampleSensors()
    sensors.value = sampled
    sensorsSampled = true
    return sampled
  }

  let tickCount = 0

  async function tick() {
    tickCount++

    const snap = await sampleResources()
    if (snap) {
      snapshot.value = snap
      pushHistory(cpuOverallHistory.value, snap.cpuOverallPercent)
      pushHistory(memHistory.value, snap.memUsedPercent)
      pushHistory(swapHistory.value, snap.swapUsedPercent)
      pushHistory(netRxHistory.value, snap.netRxRate)
      pushHistory(netTxHistory.value, snap.netTxRate)
      pushHistory(diskReadHistory.value, snap.diskReadRate)
      pushHistory(diskWriteHistory.value, snap.diskWriteRate)
      snap.cpuCores.forEach((core, i) => {
        if (!cpuCoreHistory.value[i]) cpuCoreHistory.value[i] = []
        pushHistory(cpuCoreHistory.value[i]!, core.percent)
      })
    }

    if (tickCount % SENSORS_EVERY_N_TICKS === 0) {
      const s = await sampleSensors()
      sensors.value = s
      sensorsSampled = true
      if (s.cpuTempC !== null) pushHistory(cpuTempHistory.value, s.cpuTempC)
      if (s.gpuTempC !== null) pushHistory(gpuTempHistory.value, s.gpuTempC)
      if (s.cpuPowerW !== null) pushHistory(cpuPowerHistory.value, s.cpuPowerW)
      if (s.gpuPowerW !== null) pushHistory(gpuPowerHistory.value, s.gpuPowerW)
    }
  }

  const { pause, resume } = useIntervalFn(tick, 1000, { immediate: false })

  function start() {
    dashboardRunning = true
    tickCount = 0
    tick().then(() => resume())
  }

  function stop() {
    dashboardRunning = false
    pause()
  }

  const netMaxRate = computed(() =>
    Math.max(1024 * 1024, ...netRxHistory.value, ...netTxHistory.value),
  )
  const diskMaxRate = computed(() =>
    Math.max(1024 * 1024, ...diskReadHistory.value, ...diskWriteHistory.value),
  )

  const cpuTempAvg  = computed(() => average(cpuTempHistory.value))
  const gpuTempAvg  = computed(() => average(gpuTempHistory.value))
  const cpuPowerAvg = computed(() => average(cpuPowerHistory.value))
  const gpuPowerAvg = computed(() => average(gpuPowerHistory.value))

  const sensorsUnavailable = computed(
    () =>
      sensors.value.cpuTempC === null &&
      sensors.value.gpuTempC === null &&
      sensors.value.cpuPowerW === null &&
      sensors.value.gpuPowerW === null,
  )

  return {
    snapshot, sensors, sensorsUnavailable,
    cpuOverallHistory, cpuCoreHistory, memHistory, swapHistory,
    netRxHistory, netTxHistory, diskReadHistory, diskWriteHistory,
    cpuTempHistory, gpuTempHistory, cpuPowerHistory, gpuPowerHistory,
    cpuTempAvg, gpuTempAvg, cpuPowerAvg, gpuPowerAvg,
    netMaxRate, diskMaxRate,
    collectResourcesNow, collectSensorsNow,
    start, stop,
  }
})