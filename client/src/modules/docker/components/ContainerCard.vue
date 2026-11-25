<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Box, FileText, Play, RotateCcw, Square, Trash2 } from '@lucide/vue'
import type { DockerContainer } from '@/types/docker'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared'

// Card container (source/Docker.dc.html): icona colorata per stato, nome,
// immagine mono, badge stato; footer con Logs e azioni icona.
const props = defineProps<{
  container: DockerContainer
  pending: boolean
}>()

const emit = defineEmits<{
  logs: []
  start: []
  stop: []
  restart: []
  remove: []
}>()

const { t } = useI18n()

const running = computed(() => props.container.status === 'running')
const statusLabel = computed(() => t(`overview.containerStatus.${props.container.status}`))
</script>

<template lang="pug">
article(class="flex flex-col gap-3.5 rounded-lg border border-border bg-card p-[18px]")
  div(class="flex items-start gap-3")
    span(
      class="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px]"
      :class="running ? 'bg-success/12 text-success' : 'bg-white/7 text-group-foreground'"
      aria-hidden="true"
    )
      Box(class="size-5")
    div(class="flex min-w-0 flex-1 flex-col gap-[3px]")
      h3(class="truncate text-15 font-bold") {{ container.name }}
      span(class="truncate font-mono text-xs text-muted-foreground" :title="container.image") {{ container.image }}
    StatusBadge(
      :tone="running ? 'running' : container.status === 'dead' ? 'failed' : 'exited'"
      :label="statusLabel"
      class="px-[9px] py-[3px]"
    )
  div(class="flex gap-1 border-t border-border pt-3")
    Button(variant="secondary" class="min-h-9 bg-white/7 px-3" @click="emit('logs')")
      FileText(class="size-[15px]" aria-hidden="true")
      | {{ t('docker.logs') }}
    div(class="flex-1")
    Button(
      v-if="running"
      variant="ghost"
      size="icon"
      :disabled="pending"
      :aria-label="t('docker.stopContainer', { name: container.name })"
      @click="emit('stop')"
    )
      Square(class="size-4" aria-hidden="true")
    Button(
      v-else
      variant="ghost"
      size="icon"
      class="text-success hover:text-success"
      :disabled="pending"
      :aria-label="t('docker.startContainer', { name: container.name })"
      @click="emit('start')"
    )
      Play(class="size-4" aria-hidden="true")
    Button(
      variant="ghost"
      size="icon"
      :disabled="pending"
      :aria-label="t('docker.restartContainer', { name: container.name })"
      @click="emit('restart')"
    )
      RotateCcw(class="size-4" :class="{ 'animate-spin': pending }" aria-hidden="true")
    Button(
      variant="ghost"
      size="icon"
      class="text-destructive-text hover:text-destructive-text"
      :disabled="pending"
      :aria-label="t('docker.removeContainer', { name: container.name })"
      @click="emit('remove')"
    )
      Trash2(class="size-4" aria-hidden="true")
</template>
