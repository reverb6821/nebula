import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runCmd } from '@/composables/useNeutralinoCmd'
import { listFilesystems } from '../../composables/useFileSystemApi'

vi.mock('@/composables/useNeutralinoCmd', () => ({
  runCmd: vi.fn(),
}))

const mockedRunCmd = vi.mocked(runCmd)

describe('listFilesystems', () => {
  beforeEach(() => vi.clearAllMocks())

  it('parses usable filesystems and excludes virtual mounts', async () => {
    mockedRunCmd.mockResolvedValue({
      exitCode: 0,
      stderr: '',
      stdout: [
        'Filesystem     Mounted on  Type      1024-blocks  Used Available Capacity',
        '/dev/sda1      /            ext4      100000       25000 75000     25%',
        'tmpfs          /run         tmpfs     1000         10    990       1%',
        '/dev/nvme0n1p1 /home        ext4      200000       100000 100000   50%',
      ].join('\n'),
    })

    await expect(listFilesystems()).resolves.toEqual([
      {
        device: '/dev/sda1',
        mount: '/',
        fsType: 'ext4',
        totalBytes: 100000,
        availBytes: 25000,
        usedBytes: 75000,
        usedPercent: 75,
      },
      {
        device: '/dev/nvme0n1p1',
        mount: '/home',
        fsType: 'ext4',
        totalBytes: 200000,
        availBytes: 100000,
        usedBytes: 100000,
        usedPercent: 50,
      },
    ])
  })

  it('returns no entries when df fails or returns no output', async () => {
    mockedRunCmd.mockResolvedValueOnce({ exitCode: 1, stderr: 'failed', stdout: '' })
    await expect(listFilesystems()).resolves.toEqual([])

    mockedRunCmd.mockResolvedValueOnce({ exitCode: 0, stderr: '', stdout: 'Filesystem Mounted on Type' })
    await expect(listFilesystems()).resolves.toEqual([])
  })
})