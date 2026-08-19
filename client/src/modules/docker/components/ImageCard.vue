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

<template>
  <Card
    class="py-2 group cursor-pointer border-white/[0.06] bg-white/[0.02] transition-all duration-150 hover:border-white/[0.1] hover:bg-white/[0.04] rounded-xl"
  >
    <!-- Header with Icon + tags -->
    <CardHeader class="space-y-1.5">
      <div class="flex items-start gap-2.5">
        <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/[0.08]">
          <HardDrive class="h-3.5 w-3.5 text-zinc-500" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap gap-1">
            <CardTitle
              v-for="tag in image.repoTags"
              :key="tag"
              class="block truncate font-mono text-sm font-semibold leading-tight text-zinc-100"
            >
              {{ tag }}
            </CardTitle>
          </div>
        </div>
      </div>
    </CardHeader>

    <!-- Content with Image details and stats -->
    <CardContent class="space-y-3">
      <!-- ID -->
      <p class="truncate font-mono text-[10px] text-zinc-600">{{ image.id }}</p>

      <!-- Stat tiles -->
      <div class="grid grid-cols-2 gap-1.5">
        <div class="rounded-lg bg-white/[0.03] px-2.5 py-1.5 ring-1 ring-white/[0.05]">
          <p class="text-[9px] uppercase tracking-widest text-zinc-600">{{ t('docker.imageSizeLabel') }}</p>
          <p class="mt-0.5 font-mono text-xs font-medium tabular-nums text-zinc-300">{{ formatBytes(image.size) }}</p>
        </div>
        <div class="rounded-lg bg-white/[0.03] px-2.5 py-1.5 ring-1 ring-white/[0.05]">
          <p class="text-[9px] uppercase tracking-widest text-zinc-600">{{ t('docker.imageCreatedLabel') }}</p>
          <p class="mt-0.5 font-mono text-xs font-medium text-zinc-300">{{Number(image.created) }}</p>
        </div>
      </div>
    </CardContent>

    <!-- Footer actions matching ContainerCard spacing -->
    <div
      class="flex items-center justify-end gap-0.5 border-t border-white/[0.05] px-3 py-1"
      @click.stop
    >
      <Tooltip>
        <TooltipTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            :disabled="pending"
            :icon="Trash2"
            class="h-7 w-7 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-400 transition-all duration-150"
            @click="emit('remove')"
          />
        </TooltipTrigger>
        <TooltipContent>{{ t('docker.removeImage') }}</TooltipContent>
      </Tooltip>
    </div>
  </Card>
</template>