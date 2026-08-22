<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DockerContainer } from '@/types/docker'
import { Badge } from '@/components/ui/badge'
import { Play, Square, RotateCcw, AlertCircle, Clock, HelpCircle } from '@lucide/vue'
import { cn } from '@/lib/utils'

defineProps<{ status: DockerContainer['status'] }>()

const { t } = useI18n()

type StatusConfig = { class: string; icon: unknown; labelKey: string }

// Colori legati ai token del tema invece di emerald/amber/blue/red/zinc
// hardcoded. "restarting" usa --primary (blu acciaio): è uno stato
// transitorio "in corso", non un vero successo/errore/attenzione, e
// l'accento primario è già il colore che l'app usa per "operazione
// attiva" altrove (tab/righe selezionate).
const config: Record<string, StatusConfig> = {
  running:    { class: 'bg-success/15 text-success hover:bg-success/20 border-success/30', icon: Play,        labelKey: 'docker.statusRunning' },
  paused:     { class: 'bg-warning/15 text-warning hover:bg-warning/20 border-warning/30',  icon: Square,      labelKey: 'docker.statusPaused' },
  restarting: { class: 'bg-primary/15 text-primary hover:bg-primary/20 border-primary/30',  icon: RotateCcw,   labelKey: 'docker.statusRestarting' },
  dead:       { class: 'bg-destructive/15 text-destructive hover:bg-destructive/20 border-destructive/30', icon: AlertCircle, labelKey: 'docker.statusDead' },
  exited:     { class: 'bg-muted text-muted-foreground hover:bg-accent border-border',      icon: Square,      labelKey: 'docker.statusExited' },
  created:    { class: 'bg-muted text-muted-foreground hover:bg-accent border-border',      icon: Clock,       labelKey: 'docker.statusCreated' },
}

const fallback: StatusConfig = { class: 'bg-muted text-muted-foreground hover:bg-accent border-border', icon: HelpCircle, labelKey: '' }
</script>

<template>
  <Badge
    variant="outline"
    :class="cn('gap-1 px-2 py-0.5 rounded-full border font-mono text-[10px] font-medium', (config[status] ?? fallback).class)"
  >
    <component
      :is="(config[status] ?? fallback).icon"
      class="h-3 w-3"
      :class="{ 'animate-pulse': status === 'running', 'animate-spin': status === 'restarting' }"
      aria-hidden="true"
    />
    {{ (config[status] ?? fallback).labelKey ? t((config[status] ?? fallback).labelKey) : status }}
  </Badge>
</template>