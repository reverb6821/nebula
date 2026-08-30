import type { ProcessStatus } from '@/types/process'

// Prima queste tre mappe esistevano duplicate identiche in
// ProcessStatusBadge.vue e ProcessToolbar.vue — un cambiamento in una
// poteva facilmente non essere replicato nell'altra. Unica fonte di
// verità qui.

export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
  R: 'Running',
  S: 'Sleeping',
  D: 'Disk wait',
  Z: 'Zombie',
  T: 'Stopped',
  I: 'Idle',
  '?': 'Unknown',
}

// Bucket semantico sui token del tema (success/warning/destructive/
// muted), non più emerald/red/yellow/orange/zinc hardcoded:
//   R (running)   → success     — stato attivo/salutare
//   Z (zombie)    → destructive — stato di errore effettivo
//   D (disk wait) → warning     — attenzione, spesso sintomo di I/O bloccato
//   T (stopped)   → warning     — messo in pausa, richiede attenzione
//   S/I/? (sleeping/idle/unknown) → muted — neutro/inattivo
export const PROCESS_STATUS_DOT: Record<ProcessStatus, string> = {
  R: 'bg-success animate-pulse',
  S: 'bg-muted-foreground/50',
  D: 'bg-warning',
  Z: 'bg-destructive',
  T: 'bg-warning',
  I: 'bg-muted-foreground/50',
  '?': 'bg-muted-foreground/30',
}

export const PROCESS_STATUS_TEXT: Record<ProcessStatus, string> = {
  R: 'text-success',
  S: 'text-muted-foreground',
  D: 'text-warning',
  Z: 'text-destructive',
  T: 'text-warning',
  I: 'text-muted-foreground',
  '?': 'text-muted-foreground/70',
}