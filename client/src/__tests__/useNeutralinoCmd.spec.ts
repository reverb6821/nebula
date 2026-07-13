import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Neutralino from '@neutralinojs/lib'
import { runCmd } from '@/composables/useNeutralinoCmd' 

vi.mock('@neutralinojs/lib', () => ({
  os: {
    execCommand: vi.fn()
  }
}))

describe('runCmd', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('restituisce un mock vuoto e logga in debug se window.NL_PORT non è definito', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    
    vi.stubGlobal('window', { NL_PORT: undefined })

    const result = await runCmd('echo "hello"')

    expect(result).toEqual({ stdout: '', stderr: '', exitCode: 0 })
    expect(debugSpy).toHaveBeenCalledWith('[neu mock] runCmd:', 'echo "hello"')
  })

  it('chiama Neutralino.os.execCommand se window.NL_PORT è definito', async () => {
    vi.stubGlobal('window', { NL_PORT: 1234 })
    
    vi.mocked(Neutralino.os.execCommand).mockResolvedValue({
        stdOut: 'success output',
        stdErr: '',
        exitCode: 0,
        pid: 0
    })

    const result = await runCmd('docker ps')

    expect(Neutralino.os.execCommand).toHaveBeenCalledWith('docker ps')
    expect(result).toEqual({
      stdout: 'success output',
      stderr: '',
      exitCode: 0
    })
  })

  it('gestisce i valori di fallback se la risposta di Neutralino contiene proprietà nulle o indefinite', async () => {
    vi.stubGlobal('window', { NL_PORT: 1234 })
    
    vi.mocked(Neutralino.os.execCommand).mockResolvedValue({
      exitCode: undefined
    } as any)

    const result = await runCmd('unknown-cmd')

    expect(result).toEqual({
      stdout: '',
      stderr: '',
      exitCode: 0
    })
  })
})