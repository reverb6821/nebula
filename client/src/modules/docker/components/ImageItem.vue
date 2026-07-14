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

<template>
  <Item
    variant="outline"
    class="group border-white/[0.06] bg-white/[0.02] transition-all duration-150 hover:border-white/[0.1] hover:bg-white/[0.04]"
  >
    <ItemMedia>
      <HardDrive class="h-3.5 w-3.5 text-zinc-600" />
    </ItemMedia>

    <ItemContent>
      <ItemTitle class="flex flex-wrap gap-x-2 font-mono text-sm text-zinc-200">
        <span v-for="tag in image.repoTags" :key="tag">{{ tag }}</span>
      </ItemTitle>
      <ItemDescription class="mt-0.5 flex items-center gap-2 font-mono text-xs text-zinc-600">
        <span class="truncate">{{ image.id }}</span>
        <span class="text-zinc-700">·</span>
        <span class="shrink-0 tabular-nums text-zinc-400">{{ formatBytes(image.size) }}</span>
        <span class="text-zinc-700">·</span>
        <span class="shrink-0 text-zinc-500">{{ formatDate(image.created) }}</span>
      </ItemDescription>
    </ItemContent>

    <ItemActions class="opacity-0 transition-opacity duration-150 group-hover:opacity-100">
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending"
            :icon="Trash2"
            class="h-7 w-7 text-zinc-600 hover:bg-red-500/10 hover:text-red-400"
            @click="emit('remove')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ t('docker.removeImage') }}</TooltipContent>
      </Tooltip>
    </ItemActions>
  </Item>
</template>