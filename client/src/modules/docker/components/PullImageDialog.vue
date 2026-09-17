<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, ArrowRight } from '@lucide/vue'
import { useDockerStore } from '../store'
import { storeToRefs } from 'pinia'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { SharedButton } from '@/components/shared'

const { t } = useI18n()
const store = useDockerStore()
const { pulling, pullProgress } = storeToRefs(store)

const open = ref(false)
const imageName = ref('')

const progressPercent = computed(() => {
  const d = pullProgress.value?.progressDetail
  if (!d?.total) return null
  return Math.round(((d.current ?? 0) / d.total) * 100)
})

async function handlePull() {
  if (!imageName.value.trim()) return
  await store.pull(imageName.value.trim())
  if (pullProgress.value?.done) {
    imageName.value = ''
    open.value = false
  }
}
</script>

<template lang="pug">
  Dialog(v-model:open="open")
    DialogTrigger(as-child)
      SharedButton(
        variant="outline"
        size="sm"
        class="gap-1.5 border-border bg-card text-muted-foreground hover:border-ring/40 hover:bg-accent hover:text-foreground"
      )
        Download(class="h-3.5 w-3.5" aria-hidden="true")
        | {{ t('docker.pullImage') }}

    DialogContent(class="border-border bg-popover sm:max-w-md")
      DialogHeader
        DialogTitle(class="text-base font-semibold text-foreground") {{ t('docker.pullImageTitle') }}

      div(class="flex flex-col gap-4 pt-1")
        Input(
          v-model="imageName"
          placeholder="nginx:latest, ubuntu:22.04…"
          class="rounded-md border-border bg-muted font-mono text-foreground placeholder:text-muted-foreground/70 focus:border-ring/50 focus:ring-ring/20"
          :disabled="pulling"
          @keydown.enter="handlePull"
        )

        Transition(
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
        )
          div(v-if="pulling || pullProgress" class="cyber-panel rounded-md p-3")
            div(v-if="pulling && !pullProgress" class="flex items-center gap-2 font-mono text-xs text-muted-foreground")
              span(class="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true")
              | {{ t('docker.pullConnecting') }}
            template(v-else-if="pullProgress")
              div(class="flex items-center justify-between gap-2")
                p(class="font-mono text-xs text-foreground") {{ pullProgress.status }}
                span(v-if="progressPercent !== null" class="font-mono text-xs tabular-nums text-muted-foreground") {{ progressPercent }}%
              p(v-if="pullProgress.id" class="mt-0.5 font-mono text-[10px] text-muted-foreground/70") {{ pullProgress.id }}

              //- Progress bar
              div(v-if="progressPercent !== null" class="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-muted")
                div(
                  class="h-full rounded-full bg-primary transition-all duration-300"
                  :style="{ width: `${progressPercent}%` }"
                )

              p(v-if="pullProgress.error" class="mt-2 font-mono text-xs text-destructive") {{ pullProgress.error }}

        SharedButton(
          variant="default"
          :disabled="pulling || !imageName.trim()"
          class="gap-2 font-medium disabled:opacity-40 shadow-sm"
          @click="handlePull"
        )
          template(v-if="pulling")
            span(class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" aria-hidden="true")
            | {{ t('docker.pullPulling') }}
          template(v-else)
            | {{ t('docker.pullButton') }}
            ArrowRight(class="h-3.5 w-3.5" aria-hidden="true")
</template>