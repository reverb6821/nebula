<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Trash2, HardDrive } from '@lucide/vue'
import type { DockerImage } from '@/types/docker'
import { SharedButton } from '@/components/shared'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
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
  Item(
    variant="outline"
    class="group rounded-lg cyber-panel transition-shadow duration-150 hover:bg-accent hover:shadow-cyber-signal"
  )
    ItemMedia
      HardDrive(class="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true")

    ItemContent
      ItemTitle(class="flex flex-wrap gap-x-2 font-mono text-sm text-foreground")
        span(v-for="tag in image.repoTags" :key="tag") {{ tag }}
      ItemDescription(class="mt-0.5 flex items-center gap-2 font-mono text-xs text-muted-foreground")
        span(class="truncate") {{ image.id }}
        span(class="text-muted-foreground/60") ·
        span(class="shrink-0 tabular-nums text-foreground/80") {{ formatBytes(image.size) }}
        span(class="text-muted-foreground/60") ·
        span(class="shrink-0 text-muted-foreground") {{ formatDate(image.created) }}

    ItemActions
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