import * as Neutralino from '@neutralinojs/lib'
import type { AlertEvent } from '@/types/alert'

function hasNeutralinoNotificationRuntime(): boolean {
  if (typeof window === 'undefined') return false
  const hasRuntime = typeof (window as Window & { NL_PORT?: number }).NL_PORT !== 'undefined'
  const hasApi = !!(window as Window & { Neutralino?: { os?: { showNotification?: (title: string, content: string) => Promise<void> } } }).Neutralino?.os?.showNotification
  return hasRuntime && hasApi
}

export async function notifyTriggeredAlert(event: AlertEvent): Promise<void> {
  if (!hasNeutralinoNotificationRuntime()) return

  const title = `${event.severity.toUpperCase()} alert: ${event.presetKey}`
  const detail = `${event.category} ${event.resourceKey} triggered at ${event.lastUpdatedAt}`

  await Neutralino.os.showNotification(title, detail)
}
