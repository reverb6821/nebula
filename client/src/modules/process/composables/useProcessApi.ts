import { runCmd } from '@/composables/useNeutralinoCmd'
import type { Process, ProcessStatus } from '@/types/process'

// ─── Parser ───────────────────────────────────────────────────────────────────
// ps -eo pid,ppid,user,stat,pcpu,pmem,etime,comm,args --no-headers
// Output: "  1234  5678 root     S  0.0  0.1  02:14:33 systemd /sbin/init"

function parsePs(raw: string): Process[] {
  return raw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line): Process | null => {
      // Usa campi separati da spazi — etime può contenere ':'
      const cols = line.trimStart().split(/\s+/)
      if (cols.length < 8) return null

      const pid        = parseInt(cols[0] ?? '0', 10)
      const ppid       = parseInt(cols[1] ?? '0', 10)
      const user       = cols[2] ?? '?'
      const status     = (cols[3]?.[0] ?? '?') as ProcessStatus
      const cpuPercent = parseFloat(cols[4] ?? '0') || 0
      const memPercent = parseFloat(cols[5] ?? '0') || 0
      const elapsed    = cols[6] ?? '-'
      const name       = cols[7] ?? '?'
      const cmd        = cols.slice(8).join(' ') || name

      if (isNaN(pid)) return null

      return { pid, ppid, name, cmd, user, status, cpuPercent, memPercent, memBytes: 0, elapsed }
    })
    .filter((p): p is Process => p !== null)
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function listProcesses(): Promise<Process[]> {
  const { stdout, exitCode } = await runCmd(
    'ps -eo pid,ppid,user,stat,pcpu,pmem,etime,comm,args --no-headers --sort=-pcpu',
  )

  if (exitCode !== 0 || !stdout.trim()) return []

  const procs = parsePs(stdout)

  // Arricchisci con memoria in bytes tramite /proc/<pid>/status (Linux)
  // In batch: leggi VmRSS da /proc in un solo comando
  const pids = procs.map((p) => p.pid)
  if (pids.length === 0) return procs

  try {
    const memCmd = pids
      .map((pid) => `awk '/VmRSS/{print "${pid} " $2}' /proc/${pid}/status 2>/dev/null`)
      .join('; ')

    const { stdout: memOut } = await runCmd(`{ ${memCmd}; }`)
    const memMap = new Map<number, number>()

    for (const line of memOut.trim().split('\n')) {
      const [pidStr, kbStr] = line.trim().split(/\s+/)
      const pid = parseInt(pidStr ?? '', 10)
      const kb  = parseInt(kbStr  ?? '', 10)
      if (!isNaN(pid) && !isNaN(kb)) memMap.set(pid, kb * 1024)
    }

    return procs.map((p) => ({
      ...p,
      memBytes: memMap.get(p.pid) ?? 0,
    }))
  } catch {
    return procs
  }
}

// ─── Kill ─────────────────────────────────────────────────────────────────────

export async function killProcess(pid: number): Promise<void> {
  await runCmd(`pkexec kill -9 ${pid}`)
}

export async function terminateProcess(pid: number): Promise<void> {
  await runCmd(`pkexec kill -15 ${pid}`)
}

export async function reniceProcess(pid: number, nice: number): Promise<void> {
  const clamped = Math.max(-20, Math.min(19, nice))
  await runCmd(`pkexec renice ${clamped} -p ${pid}`)
}