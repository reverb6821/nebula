import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listDaemons,
  startDaemon,
  stopDaemon,
  restartDaemon,
  enableDaemon,
  disableDaemon,
} from '@/modules/daemons/composables/useDaemonAction'
import { runCmd } from '@/composables/useNeutralinoCmd'

// Mock del composable che esegue i comandi di sistema
vi.mock('@/composables/useNeutralinoCmd', () => ({
  runCmd: vi.fn(),
}))

describe('useDaemonAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default a Linux prima di ogni test
    Object.defineProperty(window, 'NL_OS', {
      value: 'Linux',
      writable: true,
    })
  })

  describe('listDaemons su Linux', () => {
    it('richiega la lista corretta e mappa i dati includendo le descrizioni', async () => {
      // Mock dell'output di systemctl list-unit-files
      const mockFilesOut = JSON.stringify([
        { unit_file: 'nginx.service', state: 'enabled', preset: 'enabled' },
        { unit_file: 'redis.service', state: 'disabled', preset: 'disabled' },
      ])

      // Mock dell'output di systemctl list-units
      const mockUnitsOut = JSON.stringify([
        { unit: 'nginx.service', active: 'active', sub: 'running' },
        { unit: 'redis.service', active: 'inactive', sub: 'dead' },
      ])

      // Mock dell'output di systemctl show
      const mockShowOut = `
Id=nginx.service
Description=High Performance Web Server

Id=redis.service
Description=Redis In-Memory Data Store
`

      vi.mocked(runCmd)
        .mockResolvedValueOnce({ stdout: mockFilesOut, stderr: '', exitCode: 0 }) // Aggiunto exitCode
        .mockResolvedValueOnce({ stdout: mockUnitsOut, stderr: '', exitCode: 0 }) // Aggiunto exitCode
        .mockResolvedValueOnce({ stdout: mockShowOut, stderr: '', exitCode: 0 })  // Aggiunto exitCode

      const result = await listDaemons()

      expect(runCmd).toHaveBeenNthCalledWith(1, 'systemctl list-unit-files --type=service --output=json --no-pager')
      expect(runCmd).toHaveBeenNthCalledWith(2, 'systemctl list-units --type=service --all --output=json --no-pager')
      expect(runCmd).toHaveBeenNthCalledWith(3, 'systemctl show nginx.service redis.service --property=Id,Description --no-pager')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        name: 'nginx',
        description: 'High Performance Web Server',
        status: 'active',
        enabled: 'enabled',
      })
      expect(result[1]).toEqual({
        name: 'redis',
        description: 'Redis In-Memory Data Store',
        status: 'inactive',
        enabled: 'disabled',
      })
    })

    it('gestisce gli errori di parsing JSON restituendo un array vuoto', async () => {
      vi.mocked(runCmd).mockResolvedValue({ stdout: 'invalid json', stderr: '', exitCode: 0 })
      const result = await listDaemons()
      expect(result).toEqual([])
    })
  })

  describe('listDaemons su Windows', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'NL_OS', { value: 'Windows' })
    })

    it('richiede i servizi tramite PowerShell e mappa correttamente i campi', async () => {
      const mockWindowsOut = JSON.stringify([
        { Name: 'wuauserv', DisplayName: 'Windows Update', Status: 4, StartType: 2 },
        { Name: 'Spooler', DisplayName: 'Print Spooler', Status: 1, StartType: 4 },
      ])

      vi.mocked(runCmd).mockResolvedValue({ stdout: mockWindowsOut, stderr: '', exitCode: 0 })

      const result = await listDaemons()

      expect(runCmd).toHaveBeenCalledWith(
        `powershell -NoProfile -Command "Get-Service | Select-Object Name,DisplayName,Status,StartType | ConvertTo-Json -Compress"`,
      )
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        name: 'wuauserv',
        description: 'Windows Update',
        status: 'active',
        enabled: 'enabled',
      })
      expect(result[1]).toEqual({
        name: 'Spooler',
        description: 'Print Spooler',
        status: 'inactive',
        enabled: 'disabled',
      })
    })
  })

  describe('Comandi di Controllo Stato (Start/Stop/Restart)', () => {
    const serviceName = 'nginx'

    beforeEach(() => {
      vi.mocked(runCmd).mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
    })

    it('esegue i comandi Linux usando pkexec e systemctl', async () => {
      await startDaemon(serviceName)
      expect(runCmd).toHaveBeenCalledWith(`pkexec systemctl start ${serviceName}.service`)

      await stopDaemon(serviceName)
      expect(runCmd).toHaveBeenCalledWith(`pkexec systemctl stop ${serviceName}.service`)

      await restartDaemon(serviceName)
      expect(runCmd).toHaveBeenCalledWith(`pkexec systemctl restart ${serviceName}.service`)
    })

    it('esegue i comandi Windows usando i cmdlet corretti di PowerShell', async () => {
      Object.defineProperty(window, 'NL_OS', { value: 'Windows' })

      await startDaemon(serviceName)
      expect(runCmd).toHaveBeenCalledWith(`powershell -NoProfile -Command "Start-Service -Name '${serviceName}'"`)

      await stopDaemon(serviceName)
      expect(runCmd).toHaveBeenCalledWith(`powershell -NoProfile -Command "Stop-Service -Name '${serviceName}' -Force"`)

      await restartDaemon(serviceName)
      expect(runCmd).toHaveBeenCalledWith(`powershell -NoProfile -Command "Restart-Service -Name '${serviceName}' -Force"`)
    })
  })

  describe('Comandi di Abilitazione/Disabilitazione all\'avvio', () => {
    const serviceName = 'redis'

    beforeEach(() => {
      vi.mocked(runCmd).mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
    })

    it('gestisce enable e disable correttamente su Linux', async () => {
      await enableDaemon(serviceName)
      expect(runCmd).toHaveBeenCalledWith(`pkexec systemctl enable ${serviceName}.service`)

      await disableDaemon(serviceName)
      expect(runCmd).toHaveBeenCalledWith(`pkexec systemctl disable ${serviceName}.service`)
    })

    it('gestisce enable e disable correttamente su Windows tramite StartupType', async () => {
      Object.defineProperty(window, 'NL_OS', { value: 'Windows' })

      await enableDaemon(serviceName)
      expect(runCmd).toHaveBeenCalledWith(
        `powershell -NoProfile -Command "Set-Service -Name '${serviceName}' -StartupType Automatic"`,
      )

      await disableDaemon(serviceName)
      expect(runCmd).toHaveBeenCalledWith(
        `powershell -NoProfile -Command "Set-Service -Name '${serviceName}' -StartupType Disabled"`,
      )
    })
  })
})