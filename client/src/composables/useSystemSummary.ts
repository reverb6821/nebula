import { onScopeDispose, ref } from 'vue'
import { spawnStream, type CmdStream } from '@/composables/useNeutralinoCmd'

// Riepilogo leggero per il footer della sidebar: utente, uptime e load
// average. Lettura sola di /proc, nessuna modifica alla raccolta dati.
const DELIM = '@@NEBULA_SUMMARY@@'
const POLL_MS = 30_000

export interface SystemSummary {
  user: string
  uptimeSeconds: number
  load1: number
}

export function parseSystemSummary(stdout: string): SystemSummary | null {
  const [userRaw, uptimeRaw, loadRaw] = stdout.split(DELIM)
  const user = (userRaw ?? '').trim()
  const uptimeSeconds = Number.parseFloat((uptimeRaw ?? '').trim().split(/\s+/)[0] ?? '')
  const load1 = Number.parseFloat((loadRaw ?? '').trim().split(/\s+/)[0] ?? '')
  if (!user && Number.isNaN(uptimeSeconds)) return null
  return {
    user,
    uptimeSeconds: Number.isNaN(uptimeSeconds) ? 0 : uptimeSeconds,
    load1: Number.isNaN(load1) ? 0 : load1,
  }
}

export function formatUptime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3_600)
  const minutes = Math.floor((total % 3_600) / 60)
  const mm = String(minutes).padStart(2, '0')
  return days > 0 ? `${days}d ${hours}h ${mm}m` : `${hours}h ${mm}m`
}

const RECORD_END = '@@NEBULA_SUMMARY_END@@'

// Divide il buffer dello stream in record completi; l'ultimo pezzo
// (eventualmente parziale) resta nel buffer per il prossimo chunk.
export function splitSummaryRecords(buffer: string): { records: string[]; rest: string } {
  const parts = buffer.split(RECORD_END)
  const rest = parts.pop() ?? ''
  return { records: parts, rest }
}

export function useSystemSummary() {
  const summary = ref<SystemSummary | null>(null)
  let stream: CmdStream | null = null
  let disposed = false
  let buffer = ''

  // Un solo processo shell persistente (spawnStream) invece di rilanciare
  // runCmd con setInterval: stampa un record ogni POLL_MS.
  const seconds = Math.round(POLL_MS / 1000)
  const command =
    `while true; do id -un; echo "${DELIM}"; cat /proc/uptime; echo "${DELIM}"; ` +
    `cat /proc/loadavg; echo "${RECORD_END}"; sleep ${seconds}; done`

  void spawnStream(command, {
    onStdout(data) {
      const { records, rest } = splitSummaryRecords(buffer + data)
      buffer = rest
      const last = records[records.length - 1]
      if (last === undefined) return
      const parsed = parseSystemSummary(last)
      if (parsed) summary.value = parsed
    },
  }).then((handle) => {
    if (disposed) void handle.stop()
    else stream = handle
  }).catch(() => {
    // Sorgente non disponibile: il footer mostra solo la versione.
  })

  onScopeDispose(() => {
    disposed = true
    void stream?.stop()
    stream = null
  })

  return { summary }
}
