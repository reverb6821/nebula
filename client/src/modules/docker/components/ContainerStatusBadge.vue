<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DockerContainer } from '@/types/docker'
import { SharedStatusBadge } from '@/components/shared'
import { Play, Square, RotateCcw, AlertCircle, Clock, HelpCircle } from '@lucide/vue'

defineProps<{ status: DockerContainer['status'] }>()

const { t } = useI18n()

type StatusConfig = {
  tone: 'success' | 'warning' | 'destructive' | 'neutral' | 'primary'
  icon: unknown
  labelKey: string
  pulse?: boolean
  spin?: boolean
}

const config: Record<string, StatusConfig> = {
  running:    { tone: 'success', icon: Play,        labelKey: 'docker.statusRunning', pulse: true },
  paused:     { tone: 'warning', icon: Square,      labelKey: 'docker.statusPaused' },
  restarting: { tone: 'primary', icon: RotateCcw,   labelKey: 'docker.statusRestarting' },
  dead:       { tone: 'destructive', icon: AlertCircle, labelKey: 'docker.statusDead' },
  exited:     { tone: 'neutral', icon: Square,      labelKey: 'docker.statusExited' },
  created:    { tone: 'neutral', icon: Clock,       labelKey: 'docker.statusCreated' },
}

const fallback: StatusConfig = { tone: 'neutral', icon: HelpCircle, labelKey: '' }
</script>

<template lang="pug">
  SharedStatusBadge(
    :label="(config[status] ?? fallback).labelKey ? t((config[status] ?? fallback).labelKey) : status"
    :tone="(config[status] ?? fallback).tone"
    :icon="(config[status] ?? fallback).icon"
    :animation="status === 'restarting' ? 'spin' : status === 'running' ? 'pulse' : undefined"
  )
</template>
