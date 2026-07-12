<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { X, Download, ArrowDown } from '@lucide/vue'
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

function scrollToBottom() {
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  autoScroll.value = true
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

function lineClass(line: string) {
  if (/error|err|fatal/i.test(line)) return 'text-red-400/90'
  if (/warn|warning/i.test(line)) return 'text-amber-400/90'
  if (/info|success|ok/i.test(line)) return 'text-zinc-300'
  return 'text-zinc-500'
}
</script>

<template>
  <div class="flex h-full flex-col border-l border-white/[0.06] bg-[#080809]">
    <!-- Header -->
    <div class="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
      <div class="min-w-0">
        <p class="truncate font-mono text-sm font-semibold text-zinc-100">{{ containerName }}</p>
        <p class="mt-0.5 font-mono text-xs text-zinc-600">
          <span class="tabular-nums text-zinc-500">{{ lines.length }}</span> lines
          <span class="mx-1 text-zinc-700">·</span>
          <span class="text-zinc-600">live</span>
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
          @click="downloadLogs"
        >
          <Download class="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
          @click="emit('close')"
        >
          <X class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>

    <!-- Log lines -->
    <div
      ref="scrollEl"
      class="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-5"
      @scroll="onScroll"
    >
      <div v-if="lines.length === 0" class="py-8 text-center text-xs text-zinc-700">
        Waiting for logs…
      </div>
      <div
        v-for="(line, i) in lines"
        :key="i"
        class="whitespace-pre-wrap break-all py-px transition-colors"
        :class="lineClass(line)"
      >{{ line }}</div>
    </div>

    <!-- Scroll-to-bottom nudge -->
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <button
        v-if="!autoScroll"
        class="flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 border-t border-white/[0.06] bg-white/[0.03] py-2 text-xs text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-300"
        @click="scrollToBottom"
      >
        <ArrowDown class="h-3 w-3" />
        Resume live tail
      </button>
    </Transition>
  </div>
</template>