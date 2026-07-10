<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { X, Download } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  containerName: string
  lines: string[]
}>()

const emit = defineEmits<{ close: [] }>()

const scrollEl = ref<HTMLDivElement | null>(null)
const autoScroll = ref(true)

watch(
  () => props.lines.length,
  () => {
    if (autoScroll.value) {
      nextTick(() => {
        if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
      })
    }
  },
)

function onScroll() {
  if (!scrollEl.value) return
  const { scrollTop, scrollHeight, clientHeight } = scrollEl.value
  autoScroll.value = scrollHeight - scrollTop - clientHeight < 40
}

function downloadLogs() {
  const blob = new Blob([props.lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.containerName}-logs.txt`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex h-full flex-col border-l border-zinc-800 bg-[#0d0d0f]">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
      <div>
        <p class="text-sm font-medium text-zinc-100">{{ containerName }}</p>
        <p class="text-xs text-zinc-500">{{ lines.length }} lines · polling every 2s</p>
      </div>
      <div class="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-zinc-400 hover:text-zinc-200"
          @click="downloadLogs"
        >
          <Download class="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-zinc-400 hover:text-zinc-200"
          @click="emit('close')"
        >
          <X class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>

    <!-- Log lines -->
    <div
      ref="scrollEl"
      class="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed text-zinc-300"
      @scroll="onScroll"
    >
      <div v-if="lines.length === 0" class="text-zinc-600">No logs yet…</div>
      <div
        v-for="(line, i) in lines"
        :key="i"
        class="whitespace-pre-wrap break-all"
        :class="{
          'text-red-400': line.includes('ERROR') || line.includes('error'),
          'text-yellow-400': line.includes('WARN') || line.includes('warn'),
        }"
      >{{ line }}</div>
    </div>

    <!-- Auto-scroll nudge -->
    <div
      v-if="!autoScroll"
      class="cursor-pointer border-t border-zinc-800 px-4 py-1.5 text-center text-xs text-zinc-500 hover:text-zinc-300"
      @click="autoScroll = true; scrollEl && (scrollEl.scrollTop = scrollEl.scrollHeight)"
    >
      ↓ Scroll to bottom to resume auto-scroll
    </div>
  </div>
</template>