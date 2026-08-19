import { runCmd, spawnStream } from '@/composables/useNeutralinoCmd'
import type { CmdStream } from '@/composables/useNeutralinoCmd'
import type { Process, ProcessStatus } from '@/types/process'

// ─── Comando ps (stile htop) ────────────────────────────────────────────────
// PID PPID USER PRI NI VIRT RES STAT %CPU %MEM TIME+ COMMAND
// SHR (memoria condivisa) non è esposta da ps: si legge da /proc/<pid>/statm
// (3° campo, in pagine) in un secondo comando batch — vedi readShrMap.

const PS_FIELDS = 'pid,ppid,user,pri,ni,vsz,rss,stat,pcpu,pmem,time,comm,args'
const PS_CMD = `ps -eo ${PS_FIELDS} --no-headers --sort=-pcpu`
const STREAM_MARKER = '__PS_SNAPSHOT_END__'
const PAGE_SIZE_KB = 4 // dimensione pagina tipica Linux x86_64/arm64

function parsePs(raw: string, shrMap: Map<number, number>): Process[] {
  return raw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line): Process | null => {
      const cols = line.trimStart().split(/\s+/)
      if (cols.length < 12) return null

      const pid        = parseInt(cols[0] ?? '0', 10)
      const ppid       = parseInt(cols[1] ?? '0', 10)
      const user       = cols[2] ?? '?'
      const pri        = parseInt(cols[3] ?? '0', 10) || 0
      const ni         = parseInt(cols[4] ?? '0', 10) || 0
      const vszKb       = parseInt(cols[5] ?? '0', 10) || 0
      const rssKb       = parseInt(cols[6] ?? '0', 10) || 0
      const status      = (cols[7]?.[0] ?? '?') as ProcessStatus
      const cpuPercent  = parseFloat(cols[8] ?? '0') || 0
      const memPercent  = parseFloat(cols[9] ?? '0') || 0
      const cpuTime     = cols[10] ?? '-'
      const name        = cols[11] ?? '?'
      const cmd         = cols.slice(12).join(' ') || name

      if (isNaN(pid)) return null

      return {
        pid, ppid, user, pri, ni, status, cpuPercent, memPercent, cpuTime, name, cmd,
        virtBytes: vszKb * 1024,
        resBytes: rssKb * 1024,
        shrBytes: (shrMap.get(pid) ?? 0) * PAGE_SIZE_KB * 1024,
      }
    })
    .filter((p): p is Process => p !== null)
}

async function readShrMap(pids: number[]): Promise<Map<number, number>> {
  const map = new Map<number, number>()
  if (pids.length === 0) return map

  const cmd = `for p in ${pids.join(' ')}; do awk -v pid="$p" '{print pid, $3}' /proc/$p/statm 2>/dev/null; done`
  const { stdout } = await runCmd(cmd)

  for (const line of stdout.trim().split('\n')) {
    const [pidStr, pagesStr] = line.trim().split(/\s+/)
    const pid = parseInt(pidStr ?? '', 10)
    const pages = parseInt(pagesStr ?? '', 10)
    if (!isNaN(pid) && !isNaN(pages)) map.set(pid, pages)
  }
  return map
}

// ─── One-shot (caricamento iniziale / refresh manuale) ─────────────────────
// Unico punto in cui SHR viene ricalcolato per intero: richiede un comando
// extra per pid, quindi non lo rifacciamo ad ogni tick dello stream (vedi sotto).

export async function listProcesses(): Promise<Process[]> {
  const { stdout, exitCode } = await runCmd(PS_CMD)
  if (exitCode !== 0 || !stdout.trim()) return []

  const pids = stdout.trim().split('\n')
    .map((l) => parseInt(l.trimStart().split(/\s+/)[0] ?? '0', 10))
    .filter((n) => !isNaN(n))

  const shrMap = await readShrMap(pids)
  return parsePs(stdout, shrMap)
}

// ─── Stream (auto-refresh) ──────────────────────────────────────────────────
// Ogni tick aggiorna tutto tranne SHR (che lo store mantiene "appiccicato"
// dall'ultimo fetch, per non aggiungere N letture di /proc/<pid>/statm al secondo).

export function startProcessStream(
  onSnapshot: (processes: Process[]) => void,
  onError?: (message: string) => void,
  intervalSeconds = 1,
): Promise<CmdStream> {
  let buffer = ''
  const emptyShrMap = new Map<number, number>()

  const loopCmd = `bash -c '
    while true; do
      ${PS_CMD}
      echo "${STREAM_MARKER}"
      sleep ${intervalSeconds}
    done
  '`

  return spawnStream(loopCmd, {
    onStdout: (data) => {
      buffer += data
      const chunks = buffer.split(`${STREAM_MARKER}\n`)
      buffer = chunks.pop() ?? ''
      for (const chunk of chunks) {
        if (chunk.trim()) onSnapshot(parsePs(chunk, emptyShrMap))
      }
    },
    onStderr: (data) => onError?.(data.trim()),
    onExit: (code) => {
      if (code !== 0) onError?.(`process stream terminato inaspettatamente (exit ${code})`)
    },
  })
}

// ─── Kill / Nice ─────────────────────────────────────────────────────────────

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