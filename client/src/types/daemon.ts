export type DaemonStatus = 'active' | 'inactive' | 'failed' | 'unknown'
export type DaemonEnabled = 'enabled' | 'disabled' | 'static' | 'unknown'

export interface Daemon {
  name: string
  description: string
  status: DaemonStatus
  enabled: DaemonEnabled
  pid?: number
}