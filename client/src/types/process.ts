export type ProcessStatus = 'R' | 'S' | 'D' | 'Z' | 'T' | 'I' | '?'

export interface Process {
  pid: number
  ppid: number
  user: string
  pri: number
  ni: number
  status: ProcessStatus
  cpuPercent: number
  memPercent: number
  virtBytes: number   // VIRT
  resBytes: number    // RES
  shrBytes: number    // SHR
  cpuTime: string     // TIME+ (tempo CPU cumulativo, formato ps: [[DD-]HH:]MM:SS)
  name: string
  cmd: string
}

export type SortKey = Extract<
  keyof Process,
  'pid' | 'user' | 'pri' | 'ni' | 'virtBytes' | 'resBytes' | 'shrBytes' |
  'cpuPercent' | 'memPercent' | 'name'
>

export type SortDir = 'asc' | 'desc'