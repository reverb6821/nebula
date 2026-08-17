export type ProcessStatus = 'R' | 'S' | 'D' | 'Z' | 'T' | 'I' | '?'

export interface Process {
  pid: number
  ppid: number
  name: string
  cmd: string
  user: string
  status: ProcessStatus
  cpuPercent: number
  memBytes: number
  memPercent: number
  elapsed: string // e.g. "02:14:33"
}

export type SortKey = 'pid' | 'name' | 'user' | 'cpuPercent' | 'memBytes' | 'status'
export type SortDir = 'asc' | 'desc'