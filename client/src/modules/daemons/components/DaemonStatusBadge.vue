<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DaemonStatus } from '@/types/daemon'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertCircle, HelpCircle } from '@lucide/vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ status: DaemonStatus }>()

const { t } = useI18n()

// Colori legati ai token semantici di main.css (--success/--warning/
// --destructive), non più hex/emerald/red hardcoded: cambiando tema
// questi badge restano coerenti automaticamente.
const classes: Record<DaemonStatus, string> = {
  active:   'bg-success/10 text-success hover:bg-success/15 border-success/25 font-medium',
  inactive: 'bg-muted text-muted-foreground hover:bg-accent border-border font-medium',
  failed:   'bg-destructive/10 text-destructive hover:bg-destructive/15 border-destructive/25 font-medium',
  unknown:  'bg-warning/10 text-warning hover:bg-warning/15 border-warning/25 font-medium',
}

// Prima stampava lo stato grezzo ('active'/'failed'/…) non tradotto,
// inconsistente col resto dell'app (DaemonFilters usa già queste chiavi
// per le stesse etichette nel pannello filtri).
const statusLabel = computed(() => {
  const key: Record<DaemonStatus, string> = {
    active: 'daemons.statusActive',
    inactive: 'daemons.statusInactive',
    failed: 'daemons.statusFailed',
    unknown: 'daemons.statusUnknown',
  }
  return t(key[props.status])
})
</script>

<template>
  <Badge
    variant="outline"
    :class="cn('gap-1 px-2 py-0.5 rounded-full border font-mono text-[10px]', classes[status])"
  >
    <CheckCircle2 v-if="status === 'active'"   class="h-3 w-3 animate-pulse" aria-hidden="true" />
    <XCircle      v-else-if="status === 'inactive'" class="h-3 w-3" aria-hidden="true" />
    <AlertCircle  v-else-if="status === 'failed'"   class="h-3 w-3" aria-hidden="true" />
    <HelpCircle   v-else                             class="h-3 w-3" aria-hidden="true" />
    {{ statusLabel }}
  </Badge>
</template>