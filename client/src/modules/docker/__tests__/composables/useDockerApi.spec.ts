import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  pingDocker,
  fetchImages,
  removeImage,
  pullImage,
  fetchContainers,
  startContainer,
  stopContainer,
  restartContainer,
  removeContainer,
  fetchLogs,
  fetchStats,
} from '../../composables/useDockerApi'

vi.mock('@/composables/useNeutralinoCmd', () => ({
  runCmd: vi.fn(),
}))

import { runCmd } from '../../../../composables/useNeutralinoCmd'
const mockRunCmd = vi.mocked(runCmd)

beforeEach(() => {
  mockRunCmd.mockReset()
  // @ts-expect-error — solo nei test: window.NL_OS non esiste in jsdom
  delete window.NL_OS
})

describe('pingDocker', () => {
  it('su Linux controlla prima systemctl is-active, poi docker info', async () => {
    mockRunCmd.mockImplementation(async (cmd: string) => {
      if (cmd.includes('systemctl is-active')) return { stdout: 'active\n', stderr: '', exitCode: 0 }
      if (cmd.includes('docker info')) return { stdout: 'ok', stderr: '', exitCode: 0 }
      throw new Error(`comando inatteso: ${cmd}`)
    })

    expect(await pingDocker()).toBe(true)
    expect(mockRunCmd).toHaveBeenCalledWith('systemctl is-active docker.service')
  })

  it('torna false se il servizio docker non è attivo, senza nemmeno provare docker info', async () => {
    mockRunCmd.mockImplementation(async (cmd: string) => {
      if (cmd.includes('systemctl is-active')) return { stdout: 'inactive\n', stderr: '', exitCode: 3 }
      throw new Error(`non doveva chiamare: ${cmd}`)
    })

    expect(await pingDocker()).toBe(false)
  })

  it('torna false se docker info fallisce anche con servizio attivo', async () => {
    mockRunCmd.mockImplementation(async (cmd: string) => {
      if (cmd.includes('systemctl is-active')) return { stdout: 'active\n', stderr: '', exitCode: 0 }
      return { stdout: '', stderr: 'connection refused', exitCode: 1 }
    })

    expect(await pingDocker()).toBe(false)
  })

  it('su Windows salta il controllo systemctl e chiama solo docker info', async () => {
    // @ts-expect-error solo nei test
    window.NL_OS = 'Windows'
    mockRunCmd.mockResolvedValue({ stdout: 'ok', stderr: '', exitCode: 0 })

    expect(await pingDocker()).toBe(true)
    expect(mockRunCmd).toHaveBeenCalledTimes(1)
    expect(mockRunCmd).toHaveBeenCalledWith('docker info --format "ok"')
  })

  it('torna false invece di propagare un\'eccezione', async () => {
    mockRunCmd.mockRejectedValue(new Error('boom'))
    expect(await pingDocker()).toBe(false)
  })
})

describe('fetchImages', () => {
  it('fa il parsing delle righe JSON e normalizza repoTags/size/data', async () => {
    const lines = [
      JSON.stringify({ ID: 'img1', Repository: 'nginx', Tag: 'latest', Size: '187MB', CreatedAt: '2024-01-15 10:23:45 +0000 UTC' }),
      JSON.stringify({ ID: 'img2', Repository: '<none>', Tag: '<none>', Size: '1.2GB', CreatedAt: '2024-01-15 10:23:45 +0100 CET' }),
    ].join('\n')
    mockRunCmd.mockResolvedValue({ stdout: lines, stderr: '', exitCode: 0 })

    const images = await fetchImages()

    expect(images[0]).toMatchObject({ id: 'img1', repoTags: ['nginx:latest'], size: 187 * 1024 ** 2 })
    expect(images[1]).toMatchObject({ id: 'img2', repoTags: ['<none>'], size: 1.2 * 1024 ** 3 })
  })

  it('normalizza le date Docker con suffisso monotonic clock (m=+123.4)', async () => {
    const line = JSON.stringify({
      ID: 'x', Repository: 'a', Tag: 'b',
      Size: '10MB', CreatedAt: '2024-01-15 10:23:45 +0000 UTC m=+123.456',
    })
    mockRunCmd.mockResolvedValue({ stdout: line, stderr: '', exitCode: 0 })

    const [img] = await fetchImages()
    expect(img!.created).toBe(Math.floor(Date.parse('2024-01-15T10:23:45Z') / 1000))
  })

  it('gestisce date già in ISO 8601 senza modificarle', async () => {
    const line = JSON.stringify({
      ID: 'x', Repository: 'a', Tag: 'latest',
      Size: '10MB', CreatedAt: '2025-07-16T10:23:45.123456789Z',
    })
    mockRunCmd.mockResolvedValue({ stdout: line, stderr: '', exitCode: 0 })

    const [img] = await fetchImages()
    expect(img!.created).toBe(Math.floor(Date.parse('2025-07-16T10:23:45.123Z') / 1000))
  })

  it('torna 0 per una data non parsabile invece di NaN', async () => {
    const line = JSON.stringify({ ID: 'x', Repository: 'a', Tag: 'b', Size: '1kB', CreatedAt: 'garbage' })
    mockRunCmd.mockResolvedValue({ stdout: line, stderr: '', exitCode: 0 })

    const [img] = await fetchImages()
    expect(img!.created).toBe(0)
  })

  it.each([
    ['128MB', 128 * 1024 ** 2],
    ['1.2GB', 1.2 * 1024 ** 3],
    ['512kB', 512 * 1024],
    ['128MiB', 128 * 1024 ** 2],
    ['1.2GiB', 1.2 * 1024 ** 3],
  ])('parseSize gestisce il formato %s', async (raw, expected) => {
    const line = JSON.stringify({ ID: 'x', Repository: 'a', Tag: 'b', Size: raw, CreatedAt: '' })
    mockRunCmd.mockResolvedValue({ stdout: line, stderr: '', exitCode: 0 })

    const [img] = await fetchImages()
    expect(img!.size).toBeCloseTo(expected)
  })
})

describe('removeImage', () => {
  it('usa -f (force) di default', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
    await removeImage('img1')
    expect(mockRunCmd).toHaveBeenCalledWith('docker rmi -f img1')
  })

  it('omette -f quando force=false', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
    await removeImage('img1', false)
    expect(mockRunCmd).toHaveBeenCalledWith('docker rmi  img1')
  })
})

describe('pullImage', () => {
  it('segnala connessione, poi ogni riga di output, poi il completamento', async () => {
    mockRunCmd.mockResolvedValue({ stdout: 'Pulling fs layer\nDownload complete', stderr: '', exitCode: 0 })
    const onProgress = vi.fn()

    await pullImage('nginx:latest', onProgress)

    const statuses = onProgress.mock.calls.map((c) => c[0].status)
    expect(statuses[0]).toBe('Pulling nginx:latest…')
    expect(statuses).toContain('Pulling fs layer')
    expect(statuses).toContain('Download complete')
    expect(statuses.at(-1)).toBe('Pull complete')
    const dones = onProgress.mock.calls.map((c) => c[0].done)
    expect(dones.slice(0, -1).every((d) => d === false)).toBe(true)
    expect(dones.at(-1)).toBe(true)
  })

  it('in caso di errore segnala done:true con error e rilancia l\'eccezione', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: 'manifest not found', exitCode: 1 })
    const onProgress = vi.fn()

    await expect(pullImage('nope:latest', onProgress)).rejects.toThrow('manifest not found')

    const last = onProgress.mock.calls.at(-1)![0]
    expect(last).toMatchObject({ done: true, error: 'manifest not found' })
  })
})

describe('fetchContainers', () => {
  it('fa il parsing e normalizza nome (senza /), stato e porte', async () => {
    const line = JSON.stringify({
      ID: 'abcdef1234567890', Names: '/my-app', Image: 'nginx:latest',
      Status: 'Up 3 hours', State: 'running',
      Ports: '0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp',
      CreatedAt: '2024-01-15 10:23:45 +0000 UTC',
    })
    mockRunCmd.mockResolvedValue({ stdout: line, stderr: '', exitCode: 0 })

    const [c] = await fetchContainers()

    expect(c).toMatchObject({
      id: 'abcdef1234567890',
      shortId: 'abcdef123456',
      name: 'my-app',
      status: 'running',
      ports: ['0.0.0.0:80->80/tcp', '0.0.0.0:443->443/tcp'],
    })
  })

  it('mappa stati sconosciuti su "unknown" invece di andare in errore', async () => {
    const line = JSON.stringify({
      ID: 'x', Names: '/x', Image: 'x', Status: '', State: 'qualcosa-di-strano',
      Ports: '', CreatedAt: '',
    })
    mockRunCmd.mockResolvedValue({ stdout: line, stderr: '', exitCode: 0 })

    const [c] = await fetchContainers()
    expect(c!.status).toBe('unknown')
  })

  it('ports vuoto diventa un array vuoto, non [""]', async () => {
    const line = JSON.stringify({
      ID: 'x', Names: '/x', Image: 'x', Status: '', State: 'exited', Ports: '', CreatedAt: '',
    })
    mockRunCmd.mockResolvedValue({ stdout: line, stderr: '', exitCode: 0 })

    const [c] = await fetchContainers()
    expect(c!.ports).toEqual([])
  })
})

describe('azioni container: start/stop/restart/remove', () => {
  it('start lancia un errore leggibile se il comando fallisce', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: 'no such container', exitCode: 1 })
    await expect(startContainer('abc')).rejects.toThrow('no such container')
  })

  it('start non lancia nulla se il comando riesce', async () => {
    mockRunCmd.mockResolvedValue({ stdout: 'abc', stderr: '', exitCode: 0 })
    await expect(startContainer('abc')).resolves.toBeUndefined()
  })

  it('stop/restart/remove usano il comando docker corretto', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })

    await stopContainer('abc')
    expect(mockRunCmd).toHaveBeenCalledWith('docker stop abc')

    await restartContainer('abc')
    expect(mockRunCmd).toHaveBeenCalledWith('docker restart abc')

    await removeContainer('abc')
    expect(mockRunCmd).toHaveBeenCalledWith('docker rm -f abc')
  })

  it('un errore generico senza stderr usa un messaggio di fallback', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: '', exitCode: 1 })
    await expect(stopContainer('abc')).rejects.toThrow('Failed to stop abc')
  })
})

describe('fetchLogs', () => {
  it('unisce stdout e stderr e li riordina per timestamp', async () => {
    mockRunCmd.mockResolvedValue({
      stdout: '2024-01-01T10:00:02.000Z first line stdout\n2024-01-01T10:00:00.000Z earlier stdout',
      stderr: '2024-01-01T10:00:01.000Z middle line stderr',
      exitCode: 0,
    })

    const lines = await fetchLogs('abc')

    expect(lines[0]).toContain('10:00:00')
    expect(lines[1]).toContain('10:00:01')
    expect(lines[2]).toContain('10:00:02')
  })

  it('scarta le righe vuote', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '2024-01-01T10:00:00.000Z ok\n\n', stderr: '\n', exitCode: 0 })
    const lines = await fetchLogs('abc')
    expect(lines).toHaveLength(1)
  })

  it('passa il tail personalizzato al comando docker logs', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
    await fetchLogs('abc', 50)
    expect(mockRunCmd).toHaveBeenCalledWith('docker logs --tail 50 --timestamps abc')
  })
})

describe('fetchStats', () => {
  it('fa il parsing di CPU%, memoria e rete', async () => {
    mockRunCmd.mockResolvedValue({
      stdout: JSON.stringify({
        ID: 'abc', CPUPerc: '12.34%', MemUsage: '128MiB / 2GiB', MemPerc: '6.25%', NetIO: '1.2kB / 500B',
      }),
      stderr: '',
      exitCode: 0,
    })

    const stats = await fetchStats('abc')

    expect(stats.cpuPercent).toBeCloseTo(12.34)
    expect(stats.memUsage).toBeCloseTo(128 * 1024 ** 2)
    expect(stats.memLimit).toBeCloseTo(2 * 1024 ** 3)
    expect(stats.memPercent).toBeCloseTo(6.25)
    expect(stats.netRx).toBeCloseTo(1.2 * 1024)
    expect(stats.netTx).toBeCloseTo(500)
  })

  it('torna stats vuote (tutti zero) se il container non è in running', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: '', exitCode: 1 })

    const stats = await fetchStats('abc')

    expect(stats).toEqual({ id: 'abc', cpuPercent: 0, memUsage: 0, memLimit: 0, memPercent: 0, netRx: 0, netTx: 0 })
  })
})