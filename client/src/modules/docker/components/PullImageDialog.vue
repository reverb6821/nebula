<script setup lang="ts">
import { ref } from 'vue'
import { Download } from '@lucide/vue'
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

const store = useDockerStore()
const { pulling, pullProgress } = storeToRefs(store)

const open = ref(false)
const imageName = ref('')

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
      <Button variant="outline" size="sm" class="gap-2 border-zinc-700 text-zinc-300 hover:text-zinc-100">
        <Download class="h-3.5 w-3.5" />
        Pull image
      </Button>
    </DialogTrigger>

    <DialogContent class="border-zinc-800 bg-zinc-950 sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="text-zinc-100">Pull Docker image</DialogTitle>
      </DialogHeader>

      <div class="flex flex-col gap-4 pt-2">
        <Input
          v-model="imageName"
          placeholder="e.g. nginx:latest, ubuntu:22.04"
          class="font-mono"
          :disabled="pulling"
          @keydown.enter="handlePull"
        />

        <!-- Progress -->
        <div v-if="pulling || pullProgress" class="rounded-md border border-zinc-800 bg-zinc-900 p-3 font-mono text-xs text-zinc-400">
          <div v-if="pulling && !pullProgress">Connecting…</div>
          <template v-else-if="pullProgress">
            <div>{{ pullProgress.status }}</div>
            <div v-if="pullProgress.id" class="text-zinc-600">{{ pullProgress.id }}</div>
            <div v-if="pullProgress.progressDetail?.total" class="mt-1">
              <div class="h-1 w-full rounded bg-zinc-800">
                <div
                  class="h-1 rounded bg-indigo-500 transition-all"
                  :style="{
                    width: `${Math.round(((pullProgress.progressDetail.current ?? 0) / pullProgress.progressDetail.total) * 100)}%`
                  }"
                />
              </div>
            </div>
            <div v-if="pullProgress.error" class="text-red-400">{{ pullProgress.error }}</div>
          </template>
        </div>

        <Button
          :disabled="pulling || !imageName.trim()"
          class="bg-indigo-600 hover:bg-indigo-500"
          @click="handlePull"
        >
          {{ pulling ? 'Pulling…' : 'Pull' }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>