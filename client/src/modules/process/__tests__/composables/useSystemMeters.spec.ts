import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSystemMetersSampler } from '../../composables/useSystemMeters'

vi.mock('@/composables/useNeutralinoCmd', () => ({
  runCmd: vi.fn(),
}))

import { runCmd } from '../../../../composables/useNeutralinoCmd'

const mockRunCmd = vi.mocked(runCmd)

const DELIM = '@@SYS_METERS@@'

// t0: overall total=1000 idle=850 (user100 nice0 system50 idle800 iowait50);
//     cpu0 total=500 idle=425 (metà dei valori overall, stessa proporzione)
const STAT_T0 = [
  'cpu  100 0 50 800 50 0 0 0 0 0',
  'cpu0 50 0 25 400 25 0 0 0 0 0',
].join('\n')

// t1: overall total=2000 idle=1700 (raddoppio esatto rispetto a t0);
//     cpu0 total=1000 idle=850 (raddoppio esatto)
// Delta overall: dTotal=1000 dIdle=850 → (1000-850)/1000 = 15%
// Delta cpu0:    dTotal=500  dIdle=425  → (500-425)/500   = 15%
const STAT_T1 = [
  'cpu  200 0 100 1600 100 0 0 0 0 0',
  'cpu0 100 0 50 800 50 0 0 0 0 0',
].join('\n')

const MEMINFO = [
  'MemTotal:       16000000 kB',
  'MemAvailable:   10000000 kB',
  'SwapTotal:       2000000 kB',
  'SwapFree:        1500000 kB',
].join('\n')

const LOADAVG = '1.50 1.20 0.90 2/300 12345'
const UPTIME = '12345.67 54321.00'

function mockStdout(stat: string) {
  return [stat, MEMINFO, LOADAVG, UPTIME].join(DELIM)
}

describe('createSystemMetersSampler', () => {
  beforeEach(() => {
    mockRunCmd.mockReset()
  })

  it('torna null se il comando fallisce (exitCode !== 0)', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: 'boom', exitCode: 1 })
    const sample = createSystemMetersSampler()

    expect(await sample()).toBeNull()
  })

  it('al primo campione, senza un precedente con cui calcolare il delta, i core hanno percent 0', async () => {
    mockRunCmd.mockResolvedValue({ stdout: mockStdout(STAT_T0), stderr: '', exitCode: 0 })
    const sample = createSystemMetersSampler()

    const result = await sample()
    expect(result?.cores).toEqual([{ id: 0, percent: 0 }])
  })

  it('dal secondo campione in poi calcola il delta CPU corretto (overall e per-core)', async () => {
    const sample = createSystemMetersSampler()

    mockRunCmd.mockResolvedValueOnce({ stdout: mockStdout(STAT_T0), stderr: '', exitCode: 0 })
    await sample()

    mockRunCmd.mockResolvedValueOnce({ stdout: mockStdout(STAT_T1), stderr: '', exitCode: 0 })
    const result = await sample()

    expect(result?.cores).toEqual([{ id: 0, percent: 15 }])
  })

  it('calcola memoria e swap usati/totali in byte da /proc/meminfo', async () => {
    mockRunCmd.mockResolvedValue({ stdout: mockStdout(STAT_T0), stderr: '', exitCode: 0 })
    const sample = createSystemMetersSampler()

    const result = await sample()

    expect(result?.memTotalBytes).toBe(16_000_000 * 1024)
    expect(result?.memUsedBytes).toBe((16_000_000 - 10_000_000) * 1024)
    expect(result?.swapTotalBytes).toBe(2_000_000 * 1024)
    expect(result?.swapUsedBytes).toBe((2_000_000 - 1_500_000) * 1024)
  })

  it('legge loadAvg e uptimeSeconds dai rispettivi file /proc', async () => {
    mockRunCmd.mockResolvedValue({ stdout: mockStdout(STAT_T0), stderr: '', exitCode: 0 })
    const sample = createSystemMetersSampler()

    const result = await sample()

    expect(result?.loadAvg).toEqual([1.5, 1.2, 0.9])
    expect(result?.uptimeSeconds).toBeCloseTo(12345.67)
  })

  it('due istanze diverse del sampler non condividono lo stato "prev"', async () => {
    mockRunCmd.mockResolvedValue({ stdout: mockStdout(STAT_T0), stderr: '', exitCode: 0 })

    const sampleA = createSystemMetersSampler()
    const sampleB = createSystemMetersSampler()

    await sampleA() // popola il prev di A

    mockRunCmd.mockResolvedValueOnce({ stdout: mockStdout(STAT_T1), stderr: '', exitCode: 0 })
    // B non ha ancora un prev proprio: anche ricevendo il campione "t1",
    // per B è il PRIMO campione in assoluto → percent 0, non 15.
    const resultB = await sampleB()

    expect(resultB?.cores).toEqual([{ id: 0, percent: 0 }])
  })
})