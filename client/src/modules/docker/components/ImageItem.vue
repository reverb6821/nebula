<script setup lang="ts">
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

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString()
}
</script>

<template>
  <Item
    variant="outline"
    class="border-zinc-800 bg-zinc-900/60 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
  >
    <ItemMedia>
      <HardDrive class="h-3.5 w-3.5 text-zinc-600" />
    </ItemMedia>

    <ItemContent>
      <ItemTitle class="font-mono text-sm text-zinc-100">
        <span v-for="tag in image.repoTags" :key="tag">{{ tag }}</span>
      </ItemTitle>
      <ItemDescription class="font-mono text-xs text-zinc-600">
        {{ image.id }}
        <span class="mx-1.5 text-zinc-700">·</span>
        {{ formatBytes(image.size) }}
        <span class="mx-1.5 text-zinc-700">·</span>
        {{ formatDate(image.created) }}
      </ItemDescription>
    </ItemContent>

    <ItemActions>
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending"
            :icon="Trash2"
            class="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-transparent"
            @click="emit('remove')"
          />
        </TooltipTrigger>
        <TooltipContent>Remove image</TooltipContent>
      </Tooltip>
    </ItemActions>
  </Item>
</template>