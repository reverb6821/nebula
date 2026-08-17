<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Minus, ChevronDown, ArrowUpDown } from '@lucide/vue'
import type { Process } from '@/types/process'
import ProcessStatusBadge from './ProcessStatusBadge.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { SharedButton } from '@/components/shared'

const props = defineProps<{
  process: Process
  pending: boolean
}>()

const emit = defineEmits<{
  kill: []
  terminate: []
  renice: [nice: number]
}>()

const { t } = useI18n()
const niceValues = [-20, -10, -5, 0, 5, 10, 19]

function formatBytes(bytes: number): string {
  if (bytes === 0) return '—'
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}
</script>

<template>
  <tr
    class="group border-b border-zinc-800/60 transition-colors hover:bg-zinc-800/30"
    :class="{ 'opacity-50': pending }"
  >
    <!-- Name -->
    <td class="py-2 pl-2 pr-4">
      <div class="flex flex-col">
        <span class="max-w-[180px] truncate font-mono text-xs font-medium text-zinc-200">
          {{ process.name }}
        </span>
        <span class="max-w-[180px] truncate text-[10px] text-zinc-600" :title="process.cmd">
          {{ process.cmd }}
        </span>
      </div>
    </td>

    <!-- PID -->
    <td class="py-2 pr-4 font-mono text-xs text-zinc-400 tabular-nums">
      {{ process.pid }}
    </td>

    <!-- User -->
    <td class="py-2 pr-4 text-xs text-zinc-500">
      {{ process.user }}
    </td>

    <!-- Status -->
    <td class="py-2 pr-4">
      <ProcessStatusBadge :status="process.status" />
    </td>

    <!-- CPU% -->
    <td class="py-2 pr-4 text-right font-mono text-xs tabular-nums"
      :class="process.cpuPercent > 10 ? 'text-amber-400' : process.cpuPercent > 0 ? 'text-zinc-300' : 'text-zinc-600'"
    >
      {{ process.cpuPercent > 0 ? `${process.cpuPercent.toFixed(1)} %` : '—' }}
    </td>

    <!-- Memory -->
    <td class="py-2 pr-4 text-right font-mono text-xs text-zinc-400 tabular-nums">
      {{ formatBytes(process.memBytes) }}
    </td>

    <!-- Elapsed -->
    <td class="py-2 pr-4 text-right font-mono text-xs text-zinc-600 tabular-nums">
      {{ process.elapsed }}
    </td>

    <!-- Actions -->
    <td class="py-2 pr-2 text-right">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SharedButton
            variant="ghost"
            size="icon"
            class="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            :disabled="pending"
          >
            <ChevronDown class="h-3 w-3 text-zinc-500" />
          </SharedButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          class="w-48 border-zinc-800 bg-zinc-950"
        >
          <DropdownMenuLabel class="text-[10px] text-zinc-600">
            {{ t('processes.pid') }} {{ process.pid }}
          </DropdownMenuLabel>
          <DropdownMenuSeparator class="bg-zinc-800" />

          <DropdownMenuItem
            class="gap-2 text-xs text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
            @click="emit('terminate')"
          >
            <Minus class="h-3.5 w-3.5 text-yellow-400" />
            {{ t('processes.terminate') }}
          </DropdownMenuItem>

          <DropdownMenuItem
            class="gap-2 text-xs text-red-400 focus:bg-red-500/10 focus:text-red-300"
            @click="emit('kill')"
          >
            <X class="h-3.5 w-3.5" />
            {{ t('processes.kill') }}
          </DropdownMenuItem>

          <DropdownMenuSeparator class="bg-zinc-800" />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              class="gap-2 text-xs text-zinc-300 focus:bg-zinc-800"
            >
              <ArrowUpDown class="h-3.5 w-3.5 text-zinc-500" />
              {{ t('processes.changePriority') }}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent class="border-zinc-800 bg-zinc-950">
              <DropdownMenuItem
                v-for="n in niceValues"
                :key="n"
                class="font-mono text-xs text-zinc-300 focus:bg-zinc-800"
                @click="emit('renice', n)"
              >
                {{ n > 0 ? `+${n}` : n }}
                <span class="ml-2 text-[10px] text-zinc-600">
                  {{ n < 0 ? 'higher' : n === 0 ? 'default' : 'lower' }}
                </span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </td>
  </tr>
</template>