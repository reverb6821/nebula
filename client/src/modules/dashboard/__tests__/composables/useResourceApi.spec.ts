import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runCmd } from '@/composables/useNeutralinoCmd'
import { createResourcesSampler } from '../../composables/useResourcesApi'

vi.mock('@/composables/useNeutralinoCmd', () => ({
  runCmd: vi.fn(),
}))

const mockedRunCmd = vi.mocked(runCmd)
const DELIM = '@@RES@@'
let nowSpy: ReturnType<typeof vi.spyOn>

function rawResources({
  cpu = 'cpu 100 0 0 100 0\ncpu0 50 0 0 50 0',
  mem = 'MemTotal: 1000 kB\nMemAvailable: 400 kB\nCached: 100 kB\nBuffers: 50 kB\nSwapTotal: 200 kB\nSwapFree: 150 kB',
  net = '  lo: 10 0 0 0 0 0 0 0 20\neth0: 1000 0 0 0 0 0 0 0 2000',
  disk = '   8       0 sda 10 0 20 0 0 30 20 0 0\n   8       1 sda1 100 0 200 0 0 300 0 0 0',
}: { cpu?: string; mem?: string; net?: string; disk?: string } = {}) {
  return [cpu, mem, net, disk].join(DELIM)
}

describe('createResourcesSampler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000)
  })

  it('returns null for the first sample and computes deltas for the next one', async () => {
    mockedRunCmd
      .mockResolvedValueOnce({ stdout: rawResources(), stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({
        stdout: rawResources({
          cpu: 'cpu 120 0 0 110 0\ncpu0 60 0 0 55 0',
          mem: 'MemTotal: 1000 kB\nMemAvailable: 300 kB\nCached: 120 kB\nBuffers: 80 kB\nSwapTotal: 200 kB\nSwapFree: 100 kB',
          net: '  lo: 10 0 0 0 0 0 0 0 20\neth0: 3000 0 0 0 0 0 0 0 5000',
          disk: '   8       0 sda 10 0 30 0 0 50 40 0 0',
        }),
        stderr: '',
        exitCode: 0,
      })

    const sample = createResourcesSampler()
    await expect(sample()).resolves.toBeNull()
    nowSpy.mockReturnValue(2000)
    await expect(sample()).resolves.toMatchObject({
      cpuOverallPercent: 66.66666666666666,
      cpuCores: [{ id: 0, percent: 66.66666666666666 }],
      memTotalBytes: 1024000,
      memUsedBytes: 716800,
      memUsedPercent: 70,
      memCacheBytes: 204800,
      swapUsedPercent: 50,
      netRxRate: 2000,
      netTxRate: 3000,
      diskReadRate: 5120,
      diskWriteRate: 10240,
    })
  })

  it('returns null when the command fails', async () => {
    mockedRunCmd.mockResolvedValue({ stdout: '', stderr: 'failed', exitCode: 1 })
    await expect(createResourcesSampler()()).resolves.toBeNull()
  })
})