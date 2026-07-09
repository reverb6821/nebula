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