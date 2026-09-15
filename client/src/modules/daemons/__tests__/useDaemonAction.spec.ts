import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runCmd } from '@/composables/useNeutralinoCmd'
import {
  disableDaemon,
  enableDaemon,
  listDaemons,
  restartDaemon,
  startDaemon,
  stopDaemon,
} from '../composables/useDaemonAction'

vi.mock('@/composables/useNeutralinoCmd', () => ({
  runCmd: vi.fn(),
}))

const mockedRunCmd = vi.mocked(runCmd)

describe('useDaemonAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-expect-error — Neutralino globals are not available in jsdom
    delete window.NL_OS
    mockedRunCmd.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
  })

  it('maps Linux unit files and runtime state into daemons', async () => {
    mockedRunCmd
      .mockResolvedValueOnce({
        stdout: JSON.stringify([
          { unit_file: 'nginx.service', state: 'enabled', preset: 'enabled' },
          { unit_file: 'cron.service', state: 'static', preset: 'enabled' },
        ]),
        stderr: '',
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: JSON.stringify([
          { unit: 'nginx.service', active: 'active', sub: 'running' },
          { unit: 'cron.service', active: 'failed', sub: 'failed' },
        ]),
        stderr: '',
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        stdout: 'Id=nginx.service\nDescription=NGINX Web Server\n\nId=cron.service\nDescription=Job Scheduler',
        stderr: '',
        exitCode: 0,
      })

    await expect(listDaemons()).resolves.toEqual([
      {
        name: 'nginx',
        description: 'NGINX Web Server',
        status: 'active',
        enabled: 'enabled',
      },
      {
        name: 'cron',
        description: 'Job Scheduler',
        status: 'failed',
        enabled: 'static',
      },
    ])
  })

  it('maps Windows service status and startup type', async () => {
    // @ts-expect-error — Neutralino globals are not available in jsdom
    window.NL_OS = 'Windows'
    mockedRunCmd.mockResolvedValue({
      stdout: JSON.stringify([
        { Name: 'Spooler', DisplayName: 'Print Spooler', Status: 4, StartType: 2 },
        { Name: 'ManualSvc', DisplayName: 'Manual Service', Status: 1, StartType: 3 },
        { Name: 'DisabledSvc', DisplayName: 'Disabled Service', Status: 9, StartType: 4 },
      ]),
      stderr: '',
      exitCode: 0,
    })

    await expect(listDaemons()).resolves.toEqual([
      { name: 'Spooler', description: 'Print Spooler', status: 'active', enabled: 'enabled' },
      { name: 'ManualSvc', description: 'Manual Service', status: 'inactive', enabled: 'static' },
      { name: 'DisabledSvc', description: 'Disabled Service', status: 'unknown', enabled: 'disabled' },
    ])
  })

  it('returns an empty list when Linux unit-file JSON is invalid', async () => {
    mockedRunCmd
      .mockResolvedValueOnce({ stdout: '{invalid', stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 })

    await expect(listDaemons()).resolves.toEqual([])
  })

  it('uses pkexec systemctl for Linux daemon actions', async () => {
    await startDaemon('nginx')
    await stopDaemon('nginx')
    await restartDaemon('nginx')
    await enableDaemon('nginx')
    await disableDaemon('nginx')

    expect(mockedRunCmd).toHaveBeenNthCalledWith(1, 'pkexec systemctl start nginx.service')
    expect(mockedRunCmd).toHaveBeenNthCalledWith(2, 'pkexec systemctl stop nginx.service')
    expect(mockedRunCmd).toHaveBeenNthCalledWith(3, 'pkexec systemctl restart nginx.service')
    expect(mockedRunCmd).toHaveBeenNthCalledWith(4, 'pkexec systemctl enable nginx.service')
    expect(mockedRunCmd).toHaveBeenNthCalledWith(5, 'pkexec systemctl disable nginx.service')
  })

  it('throws the command stderr when a privileged action fails', async () => {
    mockedRunCmd.mockResolvedValue({ stdout: '', stderr: 'permission denied', exitCode: 1 })

    await expect(startDaemon('nginx')).rejects.toThrow('permission denied')
  })
})
