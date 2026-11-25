import type { AlertLifecycle } from '@/types/alert'
import type { AlertFilters } from '@/modules/alerts/store'

// Chip di stato della pagina Alerts (selezione singola) mappati sui
// filtri multipli dello store: 'all' = nessun vincolo sugli stati.
export type AlertStateFilter = 'all' | Exclude<AlertLifecycle, 'pending'>

export function stateFilterOf(filters: AlertFilters): AlertStateFilter {
  const [only] = filters.states
  if (filters.states.length === 1 && only && only !== 'pending') return only
  return 'all'
}

// Restituisce nuovi filtri (non muta l'input): categorie e gravita' restano.
export function withStateFilter(filters: AlertFilters, state: AlertStateFilter): AlertFilters {
  return {
    states: state === 'all' ? [] : [state],
    categories: [...filters.categories],
    severities: [...filters.severities],
  }
}
