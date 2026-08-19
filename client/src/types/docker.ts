// ─── Images ──────────────────────────────────────────────────────────────────

export interface DockerImage {
  id: string
  repoTags: string[]
  size: number
  created: number
}

// ─── Containers ───────────────────────────────────────────────────────────────

export type ContainerStatus =
  | 'running'
  | 'exited'
  | 'paused'
  | 'restarting'
  | 'dead'
  | 'created'
  | 'removing'
  | 'unknown'

export interface DockerContainer {
  id: string
  shortId: string
  name: string
  image: string
  status: ContainerStatus
  state: string
  ports: string[]
  created: number
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface ContainerStats {
  id: string
  cpuPercent: number
  memUsage: number   // bytes
  memLimit: number   // bytes
  memPercent: number
  netRx: number      // bytes
  netTx: number      // bytes
}

// ─── Pull progress ───────────────────────────────────────────────────────────

export interface PullProgress {
  status: string
  progressDetail?: { current?: number; total?: number }
  id?: string
  error?: string
  done: boolean
}