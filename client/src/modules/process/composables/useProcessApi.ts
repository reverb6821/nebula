import { runCmd, spawnStream } from '@/composables/useNeutralinoCmd'
import type { CmdStream } from '@/composables/useNeutralinoCmd'
import type { Process, ProcessStatus } from '@/types/process'

// ─── Comando ps ─────────────────────────────────────────────────────────────
// rss è già espresso in KB da ps: non serve più leggere /proc/<pid>/status
// a mano per la memoria, un solo comando basta.
// Output: "  1234  5678 root     S  0.0  0.1  02:14:33  4120 systemd /sbin/init"

const PS_FIELDS = 'pid,ppid,user,stat,pcpu,pmem,etime,rss,comm,args'
const PS_CMD = `ps -eo ${PS_FIELDS} --no-headers --sort=-pcpu`
const STREAM_MARKER = '__PS_SNAPSHOT_END__'

// ─── Parser ───────────────────────────────────────────────────────────────────

function parsePs(raw: string): Process[] {
  return raw
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line): Process | null => {
      // Usa campi separati da spazi — etime può contenere ':'
      const cols = line.trimStart().split(/\s+/)
      if (cols.length < 9) return null

      const pid        = parseInt(cols[0] ?? '0', 10)
      const ppid       = parseInt(cols[1] ?? '0', 10)
      const user       = cols[2] ?? '?'
      const status     = (cols[3]?.[0] ?? '?') as ProcessStatus
      const cpuPercent = parseFloat(cols[4] ?? '0') || 0
      const memPercent = parseFloat(cols[5] ?? '0') || 0
      const elapsed    = cols[6] ?? '-'
      const rssKb       = parseInt(cols[7] ?? '0', 10) || 0
      const name        = cols[8] ?? '?'
      const cmd         = cols.slice(9).join(' ') || name

      if (isNaN(pid)) return null

      return {
        pid, ppid, name, cmd, user, status,
        cpuPercent, memPercent, elapsed,
        memBytes: rssKb * 1024,
      }
    })
    .filter((p): p is Process => p !== null)
}

// ─── One-shot (caricamento iniziale / refresh manuale) ─────────────────────

export async function listProcesses(): Promise<Process[]> {
  const { stdout, exitCode } = await runCmd(PS_CMD)
  if (exitCode !== 0 || !stdout.trim()) return []
  return parsePs(stdout)
}

// ─── Stream (auto-refresh) ──────────────────────────────────────────────────
// Un solo processo bash persistente ristampa lo snapshot ogni
// `intervalSeconds` e lo notifica via evento — al posto di un setInterval
// lato JS che rilancia execCommand (quindi un roundtrip IPC + fork/exec di
// ps) ad ogni tick.

export function startProcessStream(
  onSnapshot: (processes: Process[]) => void,
  onError?: (message: string) => void,
  intervalSeconds = 3,
): Promise<CmdStream> {
  let buffer = ''

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
      buffer = chunks.pop() ?? '' // ultimo pezzo: snapshot ancora incompleto
      for (const chunk of chunks) {
        if (chunk.trim()) onSnapshot(parsePs(chunk))
      }
    },
    onStderr: (data) => onError?.(data.trim()),
    onExit: (code) => {
      if (code !== 0) onError?.(`process stream terminato inaspettatamente (exit ${code})`)
    },
  })
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