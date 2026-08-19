import { runCmd } from '@/composables/useNeutralinoCmd'

export interface CpuCoreLoad { id: number; percent: number }

export interface SystemMeters {
  cores: CpuCoreLoad[]
  memUsedBytes: number
  memTotalBytes: number
  swapUsedBytes: number
  swapTotalBytes: number
  loadAvg: [number, number, number]
  uptimeSeconds: number
}

interface RawCpu { total: number; idle: number }
interface RawCounters {
  overall: RawCpu
  cores: (RawCpu & { id: number })[]
}

const DELIM = '@@SYS_METERS@@'

function parseCpuLine(line: string): { label: string } & RawCpu {
  const parts = line.trim().split(/\s+/)
  const label = parts[0] ?? ''
  const nums = parts.slice(1).map((n) => parseInt(n, 10) || 0)
  const idle = (nums[3] ?? 0) + (nums[4] ?? 0) // idle + iowait
  const total = nums.reduce((a, b) => a + b, 0)
  return { label, total, idle }
}

function parseStat(raw: string): RawCounters {
  const lines = raw.split('\n').filter((l) => l.startsWith('cpu'))
  const overallLine = lines.find((l) => l.startsWith('cpu '))
  const overall = overallLine
    ? (() => { const { total, idle } = parseCpuLine(overallLine); return { total, idle } })()
    : { total: 0, idle: 0 }
  const cores = lines
    .filter((l) => /^cpu\d/.test(l))
    .map((l) => {
      const { label, total, idle } = parseCpuLine(l)
      return { id: parseInt(label.slice(3), 10) || 0, total, idle }
    })
  return { overall, cores }
}

function parseMemKb(raw: string, key: string): number {
  const match = raw.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'))
  return match ? parseInt(match[1]!, 10) : 0
}

function pct(p: RawCpu, c: RawCpu): number {
  const dTotal = c.total - p.total
  const dIdle  = c.idle  - p.idle
  if (dTotal <= 0) return 0
  return Math.max(0, Math.min(100, ((dTotal - dIdle) / dTotal) * 100))
}

// Factory invece di stato a livello di modulo: ogni istanza (es. ogni
// ProcessMeters.vue montato) tiene il proprio "campione precedente" senza
// condividerlo con altre eventuali istanze.
export function createSystemMetersSampler() {
  let prev: RawCounters | null = null

  return async function sample(): Promise<SystemMeters | null> {
    const { stdout, exitCode } = await runCmd(
      `cat /proc/stat; echo "${DELIM}"; cat /proc/meminfo; echo "${DELIM}"; cat /proc/loadavg; echo "${DELIM}"; cat /proc/uptime`,
    )
    if (exitCode !== 0) return null

    const [statRaw, memRaw, loadRaw, uptimeRaw] = stdout.split(DELIM)
    const curr = parseStat(statRaw ?? '')

    const memTotalKb     = parseMemKb(memRaw ?? '', 'MemTotal')
    const memAvailableKb = parseMemKb(memRaw ?? '', 'MemAvailable')
    const swapTotalKb    = parseMemKb(memRaw ?? '', 'SwapTotal')
    const swapFreeKb     = parseMemKb(memRaw ?? '', 'SwapFree')

    const loadParts = (loadRaw ?? '').trim().split(/\s+/).map(Number)
    const loadAvg: [number, number, number] = [
      loadParts[0] || 0, loadParts[1] || 0, loadParts[2] || 0,
    ]
    const uptimeSeconds = parseFloat((uptimeRaw ?? '').trim().split(/\s+/)[0] ?? '0') || 0

    let cores: CpuCoreLoad[] = curr.cores.map((c) => ({ id: c.id, percent: 0 }))
    if (prev) {
      cores = curr.cores.map((c) => {
        const p = prev!.cores.find((x) => x.id === c.id)
        return { id: c.id, percent: p ? pct(p, c) : 0 }
      })
    }
    prev = curr

    return {
      cores,
      memUsedBytes: Math.max(0, (memTotalKb - memAvailableKb) * 1024),
      memTotalBytes: memTotalKb * 1024,
      swapUsedBytes: Math.max(0, (swapTotalKb - swapFreeKb) * 1024),
      swapTotalBytes: swapTotalKb * 1024,
      loadAvg,
      uptimeSeconds,
    }
  }
}