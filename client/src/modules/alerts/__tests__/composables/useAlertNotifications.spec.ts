import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AlertEvent, SourceHealth } from '@/types/alert'

const neutralino = vi.hoisted(() => ({
  showNotification: vi.fn(),
  getPath: vi.fn(),
  createDirectory: vi.fn(),
  writeFile: vi.fn(),
}))

vi.mock('@neutralinojs/lib', () => ({
  os: {
    showNotification: neutralino.showNotification,
    getPath: neutralino.getPath,
  },
  filesystem: {
    createDirectory: neutralino.createDirectory,
    writeFile: neutralino.writeFile,
  },
}))

import { exportAlertLog } from '@/modules/alerts/composables/useAlertExport'
import { notifyTriggeredAlert } from '@/modules/alerts/composables/useAlertNotifications'

const event: AlertEvent = {
  id: 'resources.cpu-high:host',
  presetKey: 'resources.cpu-high',
  category: 'resources',
  resourceKey: 'host',
  severity: 'critical',
  state: 'triggered',
  observedValue: 95,
  threshold: 90,
  firstDetectedAt: 1_000,
  lastUpdatedAt: 1_000,
  acknowledgedAt: null,
  resolvedAt: null,
  transitions: [{ state: 'triggered', at: 1_000, observedValue: 95 }],
}

const sourceHealth: SourceHealth[] = [{
  source: 'resources',
  category: 'resources',
  status: 'degraded',
  message: 'CPU usage above threshold',
  updatedAt: 1_000,
}]

describe('notifyTriggeredAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (window as { NL_PORT?: number }).NL_PORT
    delete (window as { Neutralino?: unknown }).Neutralino
  })

  it('does not call Neutralino in browser tests', async () => {
    await notifyTriggeredAlert(event)
    expect(neutralino.showNotification).not.toHaveBeenCalled()
  })

  it('surfaces notification failures', async () => {
    ;(window as { NL_PORT?: number }).NL_PORT = 1234
    ;(window as { Neutralino?: { os: { showNotification: typeof neutralino.showNotification } } }).Neutralino = {
      os: { showNotification: neutralino.showNotification },
    }
    neutralino.showNotification.mockRejectedValue(new Error('permission denied'))

    await expect(notifyTriggeredAlert(event)).rejects.toThrow('permission denied')
  })
})

describe('exportAlertLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete (window as { NL_PORT?: number }).NL_PORT
    delete (window as { Neutralino?: unknown }).Neutralino
  })

  it('does not call Neutralino in browser tests and resolves without writing', async () => {
    await expect(exportAlertLog([event], sourceHealth)).resolves.toBeUndefined()
    expect(neutralino.writeFile).not.toHaveBeenCalled()
  })

  it('writes a JSON export when running in Neutralino', async () => {
    ;(window as { NL_PORT?: number }).NL_PORT = 1234
    ;(window as { Neutralino?: { os: { getPath: typeof neutralino.getPath }; filesystem: { createDirectory: typeof neutralino.createDirectory; writeFile: typeof neutralino.writeFile } } }).Neutralino = {
      os: { getPath: neutralino.getPath },
      filesystem: {
        createDirectory: neutralino.createDirectory,
        writeFile: neutralino.writeFile,
      },
    }
    neutralino.getPath.mockResolvedValue('/home/test/Documents')
    neutralino.createDirectory.mockResolvedValue(undefined)
    neutralino.writeFile.mockResolvedValue(undefined)

    await expect(exportAlertLog([event], sourceHealth)).resolves.toBeUndefined()
    expect(neutralino.getPath).toHaveBeenCalledWith('documents')
    expect(neutralino.createDirectory).toHaveBeenCalled()
    expect(neutralino.writeFile).toHaveBeenCalledTimes(1)
    expect(neutralino.writeFile.mock.calls[0][0]).toMatch(/\.json$/)
    expect(neutralino.writeFile.mock.calls[0][1]).toContain('"version": 1')
  })
})
