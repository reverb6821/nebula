import { runCmd } from '@/composables/useNeutralinoCmd'
import type { ResourcesSnapshot } from '@/types/resources'

const DELIM = '@@RES@@'

interface RawCpu { total: number; idle: number }
interface RawCounters {
  timestamp: number
  cpuOverall: RawCpu
  cpuCores: (RawCpu & { id: number })[]
  memTotalKb: number
  memAvailableKb: number
  cachedKb: number
  buffersKb: number
  swapTotalKb: number
  swapFreeKb: number
  netRxBytes: number
  netTxBytes: number
  diskReadSectors: number
  diskWriteSectors: number
}

function parseCpuLine(line: string): { label: string } & RawCpu {
  const parts = line.trim().split(/\s+/)
  const label = parts[0] ?? ''
  const nums = parts.slice(1).map((n) => parseInt(n, 10) || 0)
  const idle = (nums[3] ?? 0) + (nums[4] ?? 0) // idle + iowait
  const total = nums.reduce((a, b) => a + b, 0)
  return { label, total, idle }
}

function parseStat(raw: string) {
  const lines = raw.split('\n').filter((l) => l.startsWith('cpu'))
  const overallLine = lines.find((l) => l.startsWith('cpu '))
  const cpuOverall = overallLine
    ? (() => { const { total, idle } = parseCpuLine(overallLine); return { total, idle } })()
    : { total: 0, idle: 0 }
  const cpuCores = lines
    .filter((l) => /^cpu\d/.test(l))
    .map((l) => {
      const { label, total, idle } = parseCpuLine(l)
      return { id: parseInt(label.slice(3), 10) || 0, total, idle }
    })
  return { cpuOverall, cpuCores }
}

function parseMemKb(raw: string, key: string): number {
  const match = raw.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'))
  return match ? parseInt(match[1]!, 10) : 0
}

// Solo dischi interi, non partizioni: sda (non sda1), nvme0n1 (non nvme0n1p1).
const WHOLE_DISK_RE = /^(sd[a-z]+|vd[a-z]+|hd[a-z]+|xvd[a-z]+|nvme\d+n\d+|mmcblk\d+)$/

function parseNetDev(raw: string): { rx: number; tx: number } {
  let rx = 0
  let tx = 0
  for (const line of raw.split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const iface = line.slice(0, idx).trim()
    if (!iface || iface === 'lo') continue
    const fields = line.slice(idx + 1).trim().split(/\s+/).map(Number)
    rx += fields[0] || 0
    tx += fields[8] || 0
  }
  return { rx, tx }
}

function parseDiskStats(raw: string): { readSectors: number; writeSectors: number } {
  let readSectors = 0
  let writeSectors = 0
  for (const line of raw.trim().split('\n')) {
    const cols = line.trim().split(/\s+/)
    const name = cols[2]
    if (!name || !WHOLE_DISK_RE.test(name)) continue
    readSectors += parseInt(cols[5] ?? '0', 10) || 0
    writeSectors += parseInt(cols[9] ?? '0', 10) || 0
  }
  return { readSectors, writeSectors }
}

async function readRawCounters(): Promise<RawCounters | null> {
  const { stdout, exitCode } = await runCmd(
    `cat /proc/stat; echo "${DELIM}"; cat /proc/meminfo; echo "${DELIM}"; cat /proc/net/dev; echo "${DELIM}"; cat /proc/diskstats`,
  )
  if (exitCode !== 0) return null

  const [statRaw, memRaw, netRaw, diskRaw] = stdout.split(DELIM)
  const { cpuOverall, cpuCores } = parseStat(statRaw ?? '')
  const { rx, tx } = parseNetDev(netRaw ?? '')
  const { readSectors, writeSectors } = parseDiskStats(diskRaw ?? '')

  return {
    timestamp: Date.now(),
    cpuOverall,
    cpuCores,
    memTotalKb: parseMemKb(memRaw ?? '', 'MemTotal'),
    memAvailableKb: parseMemKb(memRaw ?? '', 'MemAvailable'),
    cachedKb: parseMemKb(memRaw ?? '', 'Cached'),
    buffersKb: parseMemKb(memRaw ?? '', 'Buffers'),
    swapTotalKb: parseMemKb(memRaw ?? '', 'SwapTotal'),
    swapFreeKb: parseMemKb(memRaw ?? '', 'SwapFree'),
    netRxBytes: rx,
    netTxBytes: tx,
    diskReadSectors: readSectors,
    diskWriteSectors: writeSectors,
  }
}

function pct(p: RawCpu, c: RawCpu): number {
  const dTotal = c.total - p.total
  const dIdle = c.idle - p.idle
  if (dTotal <= 0) return 0
  return Math.max(0, Math.min(100, ((dTotal - dIdle) / dTotal) * 100))
}

function diffCounters(prev: RawCounters, curr: RawCounters): ResourcesSnapshot {
  const dt = Math.max(0.001, (curr.timestamp - prev.timestamp) / 1000)

  const cpuOverallPercent = pct(prev.cpuOverall, curr.cpuOverall)
  const cpuCores = curr.cpuCores.map((c) => {
    const p = prev.cpuCores.find((x) => x.id === c.id)
    return { id: c.id, percent: p ? pct(p, c) : 0 }
  })

  const memTotalBytes = curr.memTotalKb * 1024
  const memUsedBytes = Math.max(0, (curr.memTotalKb - curr.memAvailableKb) * 1024)
  const memCacheBytes = (curr.cachedKb + curr.buffersKb) * 1024
  const swapTotalBytes = curr.swapTotalKb * 1024
  const swapUsedBytes = Math.max(0, (curr.swapTotalKb - curr.swapFreeKb) * 1024)

  const netRxRate = Math.max(0, (curr.netRxBytes - prev.netRxBytes) / dt)
  const netTxRate = Math.max(0, (curr.netTxBytes - prev.netTxBytes) / dt)
  const diskReadRate = Math.max(0, ((curr.diskReadSectors - prev.diskReadSectors) * 512) / dt)
  const diskWriteRate = Math.max(0, ((curr.diskWriteSectors - prev.diskWriteSectors) * 512) / dt)

  return {
    cpuOverallPercent,
    cpuCores,
    memTotalBytes,
    memUsedBytes,
    memUsedPercent: memTotalBytes > 0 ? (memUsedBytes / memTotalBytes) * 100 : 0,
    memCacheBytes,
    swapTotalBytes,
    swapUsedBytes,
    swapUsedPercent: swapTotalBytes > 0 ? (swapUsedBytes / swapTotalBytes) * 100 : 0,
    netRxRate,
    netTxRate,
    netRxTotal: curr.netRxBytes,
    netTxTotal: curr.netTxBytes,
    diskReadRate,
    diskWriteRate,
    diskReadTotal: curr.diskReadSectors * 512,
    diskWriteTotal: curr.diskWriteSectors * 512,
  }
}

// Factory: ogni istanza tiene il proprio "campione precedente" — stesso
// pattern di useSystemMeters.ts nel modulo processi, per non condividere
// stato tra eventuali più istanze montate insieme.
export function createResourcesSampler() {
  let prev: RawCounters | null = null

  return async function sample(): Promise<ResourcesSnapshot | null> {
    const curr = await readRawCounters()
    if (!curr) return null
    const snapshot = prev ? diffCounters(prev, curr) : null
    prev = curr
    return snapshot
  }
}