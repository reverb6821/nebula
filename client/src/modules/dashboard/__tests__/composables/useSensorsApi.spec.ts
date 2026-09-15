import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runCmd } from '@/composables/useNeutralinoCmd'
import { createSensorsSampler } from '../../composables/useSensorsApi'

vi.mock('@/composables/useNeutralinoCmd', () => ({
  runCmd: vi.fn(),
}))

const mockedRunCmd = vi.mocked(runCmd)
const D1 = '@@SENS_D1@@'
const D2 = '@@SENS_D2@@'
let nowSpy: ReturnType<typeof vi.spyOn>

function output(sensors: string, rapl: string, nvidia: string) {
  return `${sensors}${D1}${rapl}${D2}${nvidia}`
}

describe('createSensorsSampler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000)
  })

  it('prefers package CPU temperature and NVIDIA GPU readings', async () => {
    mockedRunCmd.mockResolvedValue({
      stdout: output(
        JSON.stringify({
          coretemp: {
            'Package id 0': { temp1_input: 58 },
            Core0: { temp2_input: 62 },
          },
          amdgpu: { edge: { temp1_input: 48 } },
        }),
        '',
        '67, 42.5',
      ),
      stderr: '',
      exitCode: 0,
    })

    await expect(createSensorsSampler()()).resolves.toEqual({
      cpuTempC: 58,
      gpuTempC: 67,
      cpuPowerW: null,
      gpuPowerW: 42.5,
    })
  })

  it('calculates RAPL power from consecutive energy readings', async () => {
    mockedRunCmd
      .mockResolvedValueOnce({ stdout: output('{}', '1000000', ''), stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: output('{}', '3000000', ''), stderr: '', exitCode: 0 })

    const sample = createSensorsSampler()
    await sample()
    nowSpy.mockReturnValue(2000)
    await expect(sample()).resolves.toMatchObject({ cpuPowerW: 2 })
  })

  it('returns unavailable values for malformed or wrapped sensor readings', async () => {
    mockedRunCmd
      .mockResolvedValueOnce({ stdout: output('{invalid', '5000000', ''), stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: output('{}', '1000000', 'bad, N/A'), stderr: '', exitCode: 0 })

    const sample = createSensorsSampler()
    await expect(sample()).resolves.toEqual({
      cpuTempC: null,
      gpuTempC: null,
      cpuPowerW: null,
      gpuPowerW: null,
    })
    await expect(sample()).resolves.toEqual({
      cpuTempC: null,
      gpuTempC: null,
      cpuPowerW: null,
      gpuPowerW: null,
    })
  })
})