<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Trash2, HardDrive } from '@lucide/vue'
import type { DockerImage } from '@/types/docker'
import { SharedButton } from '@/components/shared'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

defineProps<{
  image: DockerImage
  pending: boolean
}>()

const emit = defineEmits<{ remove: [] }>()

const { t } = useI18n()

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template lang="pug">
  Card(class="py-2 group cyber-panel cursor-pointer transition-shadow duration-150 hover:bg-accent hover:shadow-cyber-signal rounded-lg")
    //- Header with Icon + tags
    CardHeader(class="space-y-1.5")
      div(class="flex items-start gap-2.5")
        div(class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md cyber-panel")
          HardDrive(class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true")
        div(class="min-w-0 flex-1")
          div(class="flex flex-wrap gap-1")
            CardTitle(
              v-for="tag in image.repoTags"
              :key="tag"
              class="block truncate font-mono text-sm font-semibold leading-tight text-foreground"
            ) {{ tag }}

    //- Content with Image details and stats
    CardContent(class="space-y-3")
      //- ID
      p(class="truncate font-mono text-[10px] text-muted-foreground/70") {{ image.id }}

      //- Stat tiles
      div(class="grid grid-cols-2 gap-1.5")
        div(class="cyber-panel rounded-md px-2.5 py-1.5")
          p(class="cyber-label") {{ t('docker.imageSizeLabel') }}
          p(class="mt-0.5 font-mono text-xs font-medium tabular-nums text-foreground") {{ formatBytes(image.size) }}
        div(class="cyber-panel rounded-md px-2.5 py-1.5")
          p(class="cyber-label") {{ t('docker.imageCreatedLabel') }}
          p(class="mt-0.5 font-mono text-xs font-medium text-foreground") {{ formatDate(image.created) }}

    //- Footer: azione primaria (remove) come pill etichettata — stessa grammatica
    //- del bottone start/stop di DaemonCard/ContainerCard.
    div(class="flex w-full items-center justify-end border-t border-border px-3 py-1" @click.stop)
      Tooltip
        TooltipTrigger(as-child)
          SharedButton(
            variant="ghost"
            size="sm"
            :disabled="pending"
            :aria-label="t('docker.removeImage')"
            class="h-7 gap-1.5 rounded-md px-2.5 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/15"
            @click="emit('remove')"
          )
            Trash2(class="h-3 w-3" aria-hidden="true")
            | {{ t('common.remove') }}
        TooltipContent {{ t('docker.removeImage') }}
</template>