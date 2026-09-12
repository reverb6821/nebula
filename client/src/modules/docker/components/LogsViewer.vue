<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { X, Download, ArrowDown } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  containerName: string
  lines: string[]
}>()

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

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

// Colori legati ai token semantici (destructive/warning) invece di
// red-400/90 e amber-400/90 hardcoded.
function lineClass(line: string) {
  if (/error|err|fatal/i.test(line)) return 'text-destructive/90'
  if (/warn|warning/i.test(line)) return 'text-warning/90'
  if (/info|success|ok/i.test(line)) return 'text-foreground/90'
  return 'text-muted-foreground'
}
</script>

<template lang="pug">
  //- bg-[#080809] → bg-background: era un nero custom leggermente diverso dal token reale, ora coerente col resto dell'app.
  div(class="flex h-full flex-col border-l border-border bg-background")
    //- Header
    div(class="flex shrink-0 items-center justify-between border-b border-border px-4 py-3")
      div(class="min-w-0")
        p(class="truncate font-mono text-sm font-semibold text-foreground") {{ containerName }}
        p(class="mt-0.5 font-mono text-xs text-muted-foreground")
          | {{ t('docker.logsLines', { n: lines.length }) }}
          span(class="mx-1 text-muted-foreground/60") ·
          span(class="text-muted-foreground") {{ t('docker.logsLive') }}
      div(class="flex shrink-0 items-center gap-0.5")
        Button(
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-muted-foreground hover:bg-accent hover:text-foreground"
          :aria-label="t('docker.logsDownload')"
          @click="downloadLogs"
        )
          Download(class="h-3.5 w-3.5" aria-hidden="true")
        Button(
          variant="ghost"
          size="icon"
          class="h-7 w-7 text-muted-foreground hover:bg-accent hover:text-foreground"
          :aria-label="t('common.close')"
          @click="emit('close')"
        )
          X(class="h-3.5 w-3.5" aria-hidden="true")

    //- Log lines
    div(
      ref="scrollEl"
      class="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-5"
      @scroll="onScroll"
    )
      div(v-if="lines.length === 0" class="py-8 text-center text-xs text-muted-foreground/70") {{ t('docker.logsWaiting') }}
      div(
        v-for="(line, i) in lines"
        :key="i"
        class="whitespace-pre-wrap break-all py-px transition-colors"
        :class="lineClass(line)"
      ) {{ line }}

    //- Scroll-to-bottom nudge
    Transition(
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    )
      button(
        v-if="!autoScroll"
        class="flex w-full shrink-0 cursor-pointer items-center justify-center gap-1.5 border-t border-border bg-muted py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        @click="scrollToBottom"
      )
        ArrowDown(class="h-3 w-3" aria-hidden="true")
        | {{ t('docker.logsResumeTail') }}
</template>
