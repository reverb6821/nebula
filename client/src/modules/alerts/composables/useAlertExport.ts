import * as Neutralino from '@neutralinojs/lib'
import type { AlertEvent, SourceHealth } from '@/types/alert'
import { serializeAlertLog } from '@/modules/alerts/utils/serializeAlertLog'

function hasNeutralinoExportRuntime(): boolean {
  if (typeof window === 'undefined') return false
  const hasRuntime = typeof (window as Window & { NL_PORT?: number }).NL_PORT !== 'undefined'
  const hasExportApis = !!(
    (window as Window & {
      Neutralino?: {
        os?: { getPath?: (name: string) => Promise<string> }
        filesystem?: {
          createDirectory?: (path: string) => Promise<void>
          writeFile?: (path: string, data: string) => Promise<void>
        }
      }
    }).Neutralino?.os?.getPath
    && (window as Window & {
      Neutralino?: {
        os?: { getPath?: (name: string) => Promise<string> }
        filesystem?: {
          createDirectory?: (path: string) => Promise<void>
          writeFile?: (path: string, data: string) => Promise<void>
        }
      }
    }).Neutralino?.filesystem?.createDirectory
    && (window as Window & {
      Neutralino?: {
        os?: { getPath?: (name: string) => Promise<string> }
        filesystem?: {
          createDirectory?: (path: string) => Promise<void>
          writeFile?: (path: string, data: string) => Promise<void>
        }
      }
    }).Neutralino?.filesystem?.writeFile
  )
  return hasRuntime && hasExportApis
}

function createExportSessionId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  return `alert-export-${Date.now()}`
}

export async function exportAlertLog(events: AlertEvent[], sourceHealth: SourceHealth[]): Promise<void> {
  if (!hasNeutralinoExportRuntime()) return

  const basePath = await Neutralino.os.getPath('documents')
  const exportDirectory = `${basePath}/nebula-alerts`
  const exportFileName = `nebula-alert-log-${Date.now()}.json`

  await Neutralino.filesystem.createDirectory(exportDirectory)
  const payload = serializeAlertLog(events, sourceHealth, createExportSessionId(), Date.now())
  await Neutralino.filesystem.writeFile(`${exportDirectory}/${exportFileName}`, payload)
}
