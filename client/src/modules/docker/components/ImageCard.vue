<script setup lang="ts">
import { Trash2, HardDrive } from '@lucide/vue'
import type { DockerImage } from '@/types/docker'
import { SharedButton } from '@/components/shared'
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
  <div class="flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:bg-zinc-900">
    <!-- Icon + tags -->
    <div class="flex items-start gap-2">
      <HardDrive class="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
      <div class="min-w-0 flex-1 flex flex-wrap gap-1">
        <span
          v-for="tag in image.repoTags"
          :key="tag"
          class="font-mono text-sm text-zinc-100 truncate"
        >
          {{ tag }}
        </span>
      </div>
    </div>

    <!-- ID -->
    <p class="font-mono text-xs text-zinc-600 truncate">{{ image.id }}</p>

    <!-- Size + date + action -->
    <div class="flex items-center justify-between border-t border-zinc-800 pt-2">
      <div class="flex flex-col gap-0.5">
        <span class="text-xs text-zinc-400">{{ formatBytes(image.size) }}</span>
        <span class="text-xs text-zinc-600">{{ formatDate(image.created) }}</span>
      </div>

      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending"
            :icon="Trash2"
            class="h-7 w-7 text-zinc-400 hover:text-red-400 hover:bg-transparent"
            @click="emit('remove')"
          />
        </TooltipTrigger>
        <TooltipContent>Remove image</TooltipContent>
      </Tooltip>
    </div>
  </div>
</template>