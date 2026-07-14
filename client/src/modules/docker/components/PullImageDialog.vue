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

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button
        variant="outline"
        size="sm"
        class="gap-1.5 border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-zinc-100"
      >
        <Download class="h-3.5 w-3.5" />
        {{ t('docker.pullImage') }}
      </Button>
    </DialogTrigger>

    <DialogContent class="border-white/[0.08] bg-[#0c0c0e] sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="text-base font-semibold text-zinc-100">{{ t('docker.pullImageTitle') }}</DialogTitle>
      </DialogHeader>

      <div class="flex flex-col gap-4 pt-1">
        <Input
          v-model="imageName"
          placeholder="nginx:latest, ubuntu:22.04…"
          class="border-white/[0.08] bg-white/[0.04] font-mono text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20"
          :disabled="pulling"
          @keydown.enter="handlePull"
        />

        <!-- Progress block -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div
            v-if="pulling || pullProgress"
            class="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <div v-if="pulling && !pullProgress" class="flex items-center gap-2 font-mono text-xs text-zinc-500">
              <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
              {{ t('docker.pullConnecting') }}
            </div>
            <template v-else-if="pullProgress">
              <div class="flex items-center justify-between gap-2">
                <p class="font-mono text-xs text-zinc-300">{{ pullProgress.status }}</p>
                <span v-if="progressPercent !== null" class="font-mono text-xs tabular-nums text-zinc-500">
                  {{ progressPercent }}%
                </span>
              </div>
              <p v-if="pullProgress.id" class="mt-0.5 font-mono text-[10px] text-zinc-600">{{ pullProgress.id }}</p>

              <!-- Progress bar -->
              <div v-if="progressPercent !== null" class="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  class="h-full rounded-full bg-indigo-500 transition-all duration-300"
                  :style="{ width: `${progressPercent}%` }"
                />
              </div>

              <p v-if="pullProgress.error" class="mt-2 font-mono text-xs text-red-400">{{ pullProgress.error }}</p>
            </template>
          </div>
        </Transition>

        <Button
          :disabled="pulling || !imageName.trim()"
          class="gap-2 bg-indigo-600 font-medium hover:bg-indigo-500 disabled:opacity-40"
          @click="handlePull"
        >
          <template v-if="pulling">
            <span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {{ t('docker.pullPulling') }}
          </template>
          <template v-else>
            {{ t('docker.pullButton') }}
            <ArrowRight class="h-3.5 w-3.5" />
          </template>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>