<script setup lang="ts">
import { Trash2, HardDrive } from '@lucide/vue'
import type { DockerImage } from '@/types/docker'
import { Button } from '@/components/ui/button'
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
  <div class="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3 hover:bg-zinc-900 transition-colors">
    <HardDrive class="h-4 w-4 shrink-0 text-zinc-600" />

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap gap-1">
        <span
          v-for="tag in image.repoTags"
          :key="tag"
          class="font-mono text-sm text-zinc-100"
        >{{ tag }}</span>
      </div>
      <p class="mt-0.5 font-mono text-xs text-zinc-600">{{ image.id }}</p>
    </div>

    <div class="flex shrink-0 flex-col items-end gap-0.5">
      <span class="text-xs text-zinc-400">{{ formatBytes(image.size) }}</span>
      <span class="text-xs text-zinc-600">{{ formatDate(image.created) }}</span>
    </div>

    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 text-zinc-400 hover:text-red-400"
          :disabled="pending"
          @click="emit('remove')"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Remove image</TooltipContent>
    </Tooltip>
  </div>
</template>