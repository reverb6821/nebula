import { runCmd } from '@/composables/useNeutralinoCmd'
import type {
  DockerImage,
  DockerContainer,
  ContainerStats,
  ContainerStatus,
  PullProgress,
} from '@/types/docker'

// ─── Date parser ─────────────────────────────────────────────────────────────
// Docker CLI restituisce date in formati non standard che rompono new Date():
//   '2024-01-15 10:23:45 +0000 UTC'          (docker images)
//   '2024-01-15 10:23:45 +0000 UTC m=+123.4' (monotonic clock suffix)
//   '2024-01-15 10:23:45 +0100 CET'          (named timezone)
//   '2025-07-16T10:23:45.123456789Z'          (ISO 8601, ok)
// Restituisce unix timestamp in secondi, 0 se non parsabile.

function parseDockerDate(s: string): number {
  if (!s) return 0
  // 1. rimuove il suffisso monotonic clock 'm=+123.456'
  const clean = s.replace(/\s+m=[+-][\d.]+/, '').trim()
  // 2. normalizza il formato spazio-separato in ISO 8601:
  //    '2024-01-15 10:23:45 +0100 CET' -> '2024-01-15T10:23:45+0100'
  //    '2024-01-15 10:23:45 +0000 UTC' -> '2024-01-15T10:23:45Z'
  const normalized = clean
    .replace(
      /^(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2}:\d{2})\s([+-]\d{4})\s\w+$/,
      '$1T$2$3',
    )
    .replace(
      /^(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2}:\d{2})\sUTC$/,
      '$1T$2Z',
    )
  const ms = new Date(normalized).getTime()
  return isNaN(ms) ? 0 : Math.floor(ms / 1000)
}

// ─── Health ───────────────────────────────────────────────────────────────────

export async function pingDocker(): Promise<boolean> {
  try {
    const { exitCode } = await runCmd('docker info --format "ok"')
    return exitCode === 0
  } catch {
    return false
  }
}

// ─── Size parser ──────────────────────────────────────────────────────────────
// Handles: 128MB, 1.2GB, 512kB, 128MiB, 1.2GiB, 512KiB (docker CLI mixes these)

function parseSize(s: string): number {
  if (!s) return 0
  const n = parseFloat(s)
  const u = s.replace(/[\d.,\s]/g, '').toLowerCase()
  if (u.startsWith('g')) return n * 1024 ** 3
  if (u.startsWith('m')) return n * 1024 ** 2
  if (u.startsWith('k')) return n * 1024
  return n
}

// ─── Images ───────────────────────────────────────────────────────────────────

interface RawImageCli {
  ID: string
  Repository: string
  Tag: string
  Size: string
  CreatedAt: string
}

export async function fetchImages(): Promise<DockerImage[]> {
  const { stdout } = await runCmd('docker images --format "{{json .}}"')

  return stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const raw = JSON.parse(line) as RawImageCli
      const tag = raw.Tag === '<none>' ? '' : `:${raw.Tag}`
      const repo = raw.Repository === '<none>' ? '<none>' : raw.Repository
      return {
        id: raw.ID,
        repoTags: [`${repo}${tag}`],
        size: parseSize(raw.Size),
        created: parseDockerDate(raw.CreatedAt),
      } satisfies DockerImage
    })
}

export async function removeImage(id: string, force = true): Promise<void> {
  await runCmd(`docker rmi ${force ? '-f' : ''} ${id}`)
}

// ─── Pull ─────────────────────────────────────────────────────────────────────

export async function pullImage(
  name: string,
  onProgress: (p: PullProgress) => void,
): Promise<void> {
  onProgress({ status: `Pulling ${name}…`, done: false })

  const { stdout, stderr, exitCode } = await runCmd(`docker pull ${name}`)

  if (exitCode !== 0) {
    const msg = stderr || stdout || 'Pull failed'
    onProgress({ status: msg, done: true, error: msg })
    throw new Error(msg)
  }

  const lines = (stdout + '\n' + stderr).trim().split('\n').filter(Boolean)
  for (const line of lines) {
    onProgress({ status: line, done: false })
  }
  onProgress({ status: 'Pull complete', done: true })
}

// ─── Containers ───────────────────────────────────────────────────────────────

interface RawContainerCli {
  ID: string
  Names: string
  Image: string
  Status: string
  State: string
  Ports: string
  CreatedAt: string
}

function mapStatus(state: string): ContainerStatus {
  const map: Record<string, ContainerStatus> = {
    running: 'running',
    exited: 'exited',
    paused: 'paused',
    restarting: 'restarting',
    dead: 'dead',
    created: 'created',
    removing: 'removing',
  }
  return map[state.toLowerCase()] ?? 'unknown'
}

export async function fetchContainers(): Promise<DockerContainer[]> {
  const { stdout } = await runCmd('docker ps -a --format "{{json .}}"')

  return stdout
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const raw = JSON.parse(line) as RawContainerCli
      return {
        id: raw.ID,
        shortId: raw.ID.slice(0, 12),
        name: raw.Names.replace(/^\//, ''),
        image: raw.Image,
        status: mapStatus(raw.State),
        state: raw.Status,
        ports: raw.Ports ? raw.Ports.split(', ').filter(Boolean) : [],
        created: parseDockerDate(raw.CreatedAt),
      } satisfies DockerContainer
    })
}

export async function startContainer(id: string): Promise<void> {
  const { exitCode, stderr } = await runCmd(`docker start ${id}`)
  if (exitCode !== 0) throw new Error(stderr || `Failed to start ${id}`)
}

export async function stopContainer(id: string): Promise<void> {
  const { exitCode, stderr } = await runCmd(`docker stop ${id}`)
  if (exitCode !== 0) throw new Error(stderr || `Failed to stop ${id}`)
}

export async function restartContainer(id: string): Promise<void> {
  const { exitCode, stderr } = await runCmd(`docker restart ${id}`)
  if (exitCode !== 0) throw new Error(stderr || `Failed to restart ${id}`)
}

export async function removeContainer(id: string, force = true): Promise<void> {
  const { exitCode, stderr } = await runCmd(`docker rm ${force ? '-f' : ''} ${id}`)
  if (exitCode !== 0) throw new Error(stderr || `Failed to remove ${id}`)
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
// execCommand non supporta 2>&1 — leggiamo stdout e stderr separatamente
// e li uniamo, preservando i timestamp per l'ordinamento

export async function fetchLogs(id: string, tail = 200): Promise<string[]> {
  // stderr separato: docker logs scrive su stderr per default
  const { stdout, stderr } = await runCmd(
    `docker logs --tail ${tail} --timestamps ${id}`,
  )

  // Unisci stdout + stderr e riordina per timestamp (format: 2024-01-01T...)
  const lines = [...stdout.split('\n'), ...stderr.split('\n')]
    .filter(Boolean)
    .sort((a, b) => {
      // Prova a estrarre il timestamp ISO dalla riga
      const tsA = a.match(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z/)?.[0] ?? ''
      const tsB = b.match(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z/)?.[0] ?? ''
      return tsA.localeCompare(tsB)
    })

  return lines
}

// ─── Stats ────────────────────────────────────────────────────────────────────

interface RawStatsCli {
  ID: string
  CPUPerc: string  // "0.5%"
  MemUsage: string // "128MiB / 2GiB"
  MemPerc: string  // "6.25%"
  NetIO: string    // "1.2kB / 500B"
}

function parsePerc(s: string): number {
  return parseFloat(s.replace('%', '')) || 0
}

function parseMem(s: string): { usage: number; limit: number } {
  const parts = s.split(' / ')
  return {
    usage: parseSize(parts[0] ?? '0'),
    limit: parseSize(parts[1] ?? '1'),
  }
}

function parseNet(s: string): { rx: number; tx: number } {
  const parts = s.split(' / ')
  return {
    rx: parseSize(parts[0] ?? '0'),
    tx: parseSize(parts[1] ?? '0'),
  }
}

export async function fetchStats(id: string): Promise<ContainerStats> {
  const { stdout, exitCode } = await runCmd(
    `docker stats ${id} --no-stream --format "{{json .}}"`,
  )

  if (exitCode !== 0 || !stdout.trim()) {
    // Container non in running — restituisce stats vuote
    return { id, cpuPercent: 0, memUsage: 0, memLimit: 0, memPercent: 0, netRx: 0, netTx: 0 }
  }

  const raw = JSON.parse(stdout.trim()) as RawStatsCli
  const mem = parseMem(raw.MemUsage)
  const net = parseNet(raw.NetIO)

  return {
    id,
    cpuPercent: parsePerc(raw.CPUPerc),
    memUsage: mem.usage,
    memLimit: mem.limit,
    memPercent: parsePerc(raw.MemPerc),
    netRx: net.rx,
    netTx: net.tx,
  } satisfies ContainerStats
}