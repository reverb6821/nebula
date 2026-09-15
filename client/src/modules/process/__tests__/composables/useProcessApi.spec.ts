import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listProcesses,
  startProcessStream,
  killProcess,
  terminateProcess,
  reniceProcess,
} from '../../composables/useProcessApi'

vi.mock('@/composables/useNeutralinoCmd', () => ({
  runCmd: vi.fn(),
  spawnStream: vi.fn(),
}))

import { runCmd, spawnStream } from '../../../../composables/useNeutralinoCmd'
const mockRunCmd = vi.mocked(runCmd)
const mockSpawnStream = vi.mocked(spawnStream)

const STREAM_MARKER = '__PS_SNAPSHOT_END__'

// Riga in formato `ps -eo pid,ppid,user,pri,ni,vsz,rss,stat,pcpu,pmem,time,comm,args`
function psLine(opts: {
  pid: number; ppid?: number; user?: string; vszKb?: number; rssKb?: number
  stat?: string; cpu?: number; mem?: number; name?: string; args?: string
}): string {
  const {
    pid, ppid = 1, user = 'root', vszKb = 10240, rssKb = 2048,
    stat = 'S', cpu = 0, mem = 0, name = 'proc', args = name,
  } = opts
  return `  ${pid}  ${ppid}  ${user}  20  0  ${vszKb}  ${rssKb}  ${stat}  ${cpu}  ${mem}  00:00:01  ${name}  ${args}`
}

describe('listProcesses', () => {
  beforeEach(() => {
    mockRunCmd.mockReset()
  })

  it('ritorna [] se il comando ps fallisce', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: 'no ps', exitCode: 1 })
    expect(await listProcesses()).toEqual([])
  })

  it('ritorna [] se lo stdout è vuoto anche con exitCode 0', async () => {
    mockRunCmd.mockResolvedValue({ stdout: '   \n  ', stderr: '', exitCode: 0 })
    expect(await listProcesses()).toEqual([])
  })

  it('fa il parsing dei campi base di ogni processo', async () => {
    const line = psLine({
      pid: 1234, ppid: 1, user: 'user', vszKb: 102400, rssKb: 20480,
      stat: 'S', cpu: 1.5, mem: 2.0, name: 'bash', args: '/bin/bash',
    })
    mockRunCmd.mockImplementation(async (cmd: string) => {
      if (cmd.startsWith('ps -eo')) return { stdout: line, stderr: '', exitCode: 0 }
      // comando readShrMap (awk su /proc/$p/statm)
      return { stdout: '1234 500', stderr: '', exitCode: 0 }
    })

    const result = await listProcesses()

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      pid: 1234, ppid: 1, user: 'user', status: 'S',
      cpuPercent: 1.5, memPercent: 2.0, name: 'bash', cmd: '/bin/bash',
      virtBytes: 102400 * 1024, resBytes: 20480 * 1024,
    })
  })

  it('unisce SHR (pagine × 4KB) dalla mappa letta da /proc/<pid>/statm', async () => {
    const line = psLine({ pid: 1234, name: 'x' })
    mockRunCmd.mockImplementation(async (cmd: string) => {
      if (cmd.startsWith('ps -eo')) return { stdout: line, stderr: '', exitCode: 0 }
      return { stdout: '1234 500', stderr: '', exitCode: 0 } // 500 pagine
    })

    const [proc] = await listProcesses()
    expect(proc!.shrBytes).toBe(500 * 4 * 1024)
  })

  it('scarta righe con meno di 12 colonne o pid non numerico', async () => {
    const badLines = ['troppo poche colonne', psLine({ pid: 1 })].join('\n')
    mockRunCmd.mockImplementation(async (cmd: string) => {
      if (cmd.startsWith('ps -eo')) return { stdout: badLines, stderr: '', exitCode: 0 }
      return { stdout: '', stderr: '', exitCode: 0 }
    })

    const result = await listProcesses()
    expect(result).toHaveLength(1)
    expect(result[0]!.pid).toBe(1)
  })

  it('fa il parsing di più processi in una sola chiamata', async () => {
    const lines = [
      psLine({ pid: 1, name: 'init' }),
      psLine({ pid: 2, name: 'kthreadd' }),
      psLine({ pid: 3, name: 'sshd' }),
    ].join('\n')
    mockRunCmd.mockImplementation(async (cmd: string) => {
      if (cmd.startsWith('ps -eo')) return { stdout: lines, stderr: '', exitCode: 0 }
      return { stdout: '', stderr: '', exitCode: 0 }
    })

    const result = await listProcesses()
    expect(result.map((p) => p.pid)).toEqual([1, 2, 3])
  })
})

describe('startProcessStream', () => {
  beforeEach(() => {
    mockSpawnStream.mockReset()
  })

  function captureHandlers() {
    let captured: Parameters<typeof mockSpawnStream>[1] | undefined
    mockSpawnStream.mockImplementation(async (_cmd, handlers) => {
      captured = handlers
      return { id: 1, stop: vi.fn().mockResolvedValue(undefined) }
    })
    return () => captured!
  }

  it('invoca onSnapshot con i processi parsati per ogni chunk delimitato dal marker', async () => {
    const getHandlers = captureHandlers()
    const onSnapshot = vi.fn()

    await startProcessStream(onSnapshot)
    const handlers = getHandlers()

    const chunk = `${psLine({ pid: 10, name: 'a' })}\n${STREAM_MARKER}\n`
    handlers.onStdout?.(chunk)

    expect(onSnapshot).toHaveBeenCalledTimes(1)
    expect(onSnapshot.mock.calls[0]![0]).toEqual(
      expect.arrayContaining([expect.objectContaining({ pid: 10, name: 'a' })]),
    )
  })

  it('bufferizza i dati finché non arriva il marker completo (chunk spezzato tra due onStdout)', async () => {
    const getHandlers = captureHandlers()
    const onSnapshot = vi.fn()

    await startProcessStream(onSnapshot)
    const handlers = getHandlers()

    const fullLine = psLine({ pid: 20, name: 'b' })
    const half = Math.floor(fullLine.length / 2)

    // Prima metà della riga: nessun marker ancora, non deve emettere nulla
    handlers.onStdout?.(fullLine.slice(0, half))
    expect(onSnapshot).not.toHaveBeenCalled()

    // Seconda metà + marker: ora sì
    handlers.onStdout?.(fullLine.slice(half) + `\n${STREAM_MARKER}\n`)
    expect(onSnapshot).toHaveBeenCalledTimes(1)
    expect(onSnapshot.mock.calls[0]![0][0]).toMatchObject({ pid: 20, name: 'b' })
  })

  it('gestisce più chunk completi arrivati in un\'unica onStdout', async () => {
    const getHandlers = captureHandlers()
    const onSnapshot = vi.fn()

    await startProcessStream(onSnapshot)
    const handlers = getHandlers()

    const data =
      `${psLine({ pid: 1 })}\n${STREAM_MARKER}\n` +
      `${psLine({ pid: 2 })}\n${STREAM_MARKER}\n`
    handlers.onStdout?.(data)

    expect(onSnapshot).toHaveBeenCalledTimes(2)
  })

  it('inoltra stderr a onError', async () => {
    const getHandlers = captureHandlers()
    const onError = vi.fn()

    await startProcessStream(vi.fn(), onError)
    const handlers = getHandlers()

    handlers.onStderr?.('qualcosa è andato storto\n')
    expect(onError).toHaveBeenCalledWith('qualcosa è andato storto')
  })

  it('segnala solo le uscite con codice diverso da 0', async () => {
    const getHandlers = captureHandlers()
    const onError = vi.fn()

    await startProcessStream(vi.fn(), onError)
    const handlers = getHandlers()

    handlers.onExit?.(0)
    expect(onError).not.toHaveBeenCalled()

    handlers.onExit?.(1)
    expect(onError).toHaveBeenCalledTimes(1)
  })
})

describe('kill / terminate / renice', () => {
  beforeEach(() => {
    mockRunCmd.mockReset()
    mockRunCmd.mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 })
  })

  it('killProcess usa SIGKILL (-9) via pkexec', async () => {
    await killProcess(1234)
    expect(mockRunCmd).toHaveBeenCalledWith('pkexec kill -9 1234')
  })

  it('terminateProcess usa SIGTERM (-15) via pkexec', async () => {
    await terminateProcess(1234)
    expect(mockRunCmd).toHaveBeenCalledWith('pkexec kill -15 1234')
  })

  it('reniceProcess passa il valore invariato se dentro il range -20..19', async () => {
    await reniceProcess(1234, 5)
    expect(mockRunCmd).toHaveBeenCalledWith('pkexec renice 5 -p 1234')
  })

  it('reniceProcess clampa i valori sopra 19', async () => {
    await reniceProcess(1234, 100)
    expect(mockRunCmd).toHaveBeenCalledWith('pkexec renice 19 -p 1234')
  })

  it('reniceProcess clampa i valori sotto -20', async () => {
    await reniceProcess(1234, -100)
    expect(mockRunCmd).toHaveBeenCalledWith('pkexec renice -20 -p 1234')
  })
})