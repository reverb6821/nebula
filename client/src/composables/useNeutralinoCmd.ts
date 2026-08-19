import * as Neutralino from '@neutralinojs/lib'

export interface CmdResult {
  stdout: string
  stderr: string
  exitCode: number
}

export async function runCmd(cmd: string): Promise<CmdResult> {
  if (typeof window.NL_PORT === 'undefined') {
    console.debug('[neu mock] runCmd:', cmd)
    return { stdout: '', stderr: '', exitCode: 0 }
  }
  const result = await Neutralino.os.execCommand(cmd)
  return {
    stdout: result.stdOut ?? '',
    stderr: result.stdErr ?? '',
    exitCode: result.exitCode ?? 0,
  }
}

// ─── Streaming (processo long-running) ─────────────────────────────────────
// Usa os.spawnProcess invece di execCommand: il processo resta vivo e ci
// notifica via evento 'spawnedProcess' invece di dover essere rilanciato
// da un setInterval lato JS. Utile per sostituire un polling con un unico
// processo nativo persistente.

export interface CmdStream {
  id: number
  stop: () => Promise<void>
}

export interface StreamHandlers {
  onStdout?: (data: string) => void
  onStderr?: (data: string) => void
  onExit?: (code: number) => void
}

export async function spawnStream(cmd: string, handlers: StreamHandlers): Promise<CmdStream> {
  if (typeof window.NL_PORT === 'undefined') {
    console.debug('[neu mock] spawnStream:', cmd)
    return { id: -1, stop: async () => {} }
  }

  const proc = await Neutralino.os.spawnProcess(cmd)

  const listener = (evt: CustomEvent<{ id: number; action: string; data: string }>) => {
    if (evt.detail.id !== proc.id) return
    switch (evt.detail.action) {
      case 'stdOut':
        handlers.onStdout?.(evt.detail.data)
        break
      case 'stdErr':
        handlers.onStderr?.(evt.detail.data)
        break
      case 'exit':
        handlers.onExit?.(Number(evt.detail.data))
        Neutralino.events.off('spawnedProcess', listener as EventListener)
        break
    }
  }

  Neutralino.events.on('spawnedProcess', listener as EventListener)

  return {
    id: proc.id,
    stop: async () => {
      Neutralino.events.off('spawnedProcess', listener as EventListener)
      try {
        await Neutralino.os.updateSpawnedProcess(proc.id, 'exit')
      } catch {
        // già terminato: va bene così
      }
    },
  }
}