export type Severity = 'destructive' | 'warning' | 'success'

/**
 * Soglie di gravità condivise — prima duplicate quasi identiche in
 * kpiColorFor() e tempColor() dentro DashboardView.vue (stessa idea,
 * soglie leggermente diverse: 60 vs 65 per il warning, preservate
 * esattamente come nell'originale).
 */
export function severityFor(value: number, opts: { danger: number; warning: number }): Severity {
  if (value >= opts.danger) return 'destructive'
  if (value >= opts.warning) return 'warning'
  return 'success'
}

// Mappe con stringhe letterali complete: Tailwind analizza staticamente
// il codice sorgente cercando nomi di classe scritti per intero. Una
// concatenazione a runtime tipo `text-${severity}` NON verrebbe mai
// rilevata e la classe non finirebbe nel CSS finale — bug silenzioso,
// nessun errore, semplicemente lo stile non esiste in produzione.
const TEXT_CLASS: Record<Severity, string> = {
  destructive: 'text-destructive',
  warning: 'text-warning',
  success: 'text-success',
}

const BG_CLASS: Record<Severity, string> = {
  destructive: 'bg-destructive',
  warning: 'bg-warning',
  success: 'bg-success',
}

export function severityTextClass(value: number, opts: { danger: number; warning: number }): string {
  return TEXT_CLASS[severityFor(value, opts)]
}

export function severityBgClass(value: number, opts: { danger: number; warning: number }): string {
  return BG_CLASS[severityFor(value, opts)]
}