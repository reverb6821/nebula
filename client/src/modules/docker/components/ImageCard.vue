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
  Card(class="py-2 group cursor-pointer border-border bg-card transition-all duration-150 hover:bg-accent rounded-lg")
    //- Header with Icon + tags
    CardHeader(class="space-y-1.5")
      div(class="flex items-start gap-2.5")
        div(class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted ring-1 ring-border")
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
        div(class="rounded-md bg-muted px-2.5 py-1.5 ring-1 ring-border")
          p(class="text-[9px] uppercase tracking-widest text-muted-foreground/70") {{ t('docker.imageSizeLabel') }}
          p(class="mt-0.5 font-mono text-xs font-medium tabular-nums text-foreground") {{ formatBytes(image.size) }}
        div(class="rounded-md bg-muted px-2.5 py-1.5 ring-1 ring-border")
          p(class="text-[9px] uppercase tracking-widest text-muted-foreground/70") {{ t('docker.imageCreatedLabel') }}
          p(class="mt-0.5 font-mono text-xs font-medium text-foreground") {{ formatDate(image.created) }}

    //- Footer actions matching ContainerCard spacing
    div(class="flex items-center justify-end gap-0.5 border-t border-border px-3 py-1" @click.stop)
      Tooltip
        TooltipTrigger(as-child)
          SharedButton(
            variant="ghost"
            size="icon"
            :disabled="pending"
            :icon="Trash2"
            :aria-label="t('docker.removeImage')"
            class="h-7 w-7 rounded-md text-destructive hover:bg-destructive/15 hover:text-destructive transition-all duration-150"
            @click="emit('remove')"
          )
        TooltipContent {{ t('docker.removeImage') }}
</template>
