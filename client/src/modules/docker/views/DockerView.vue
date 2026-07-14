<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { RefreshCw } from '@lucide/vue'
import { useDockerStore } from '../store'
import DockerToolbar from '../components/DockerToolbar.vue'
import DockerList from '../components/DockerList.vue'
import LogsViewer from '../components/LogsViewer.vue'
import { SharedButton, SharedAlert } from '@/components/shared'

const { t } = useI18n()
const store = useDockerStore()
const {
  connected, loading, error,
  selectedContainerId, selectedContainer,
  selectedLogs,
  runningCount,
  images, containers,
} = storeToRefs(store)

onMounted(() => store.connect())
</script>

<template>
  <div class="flex h-full overflow-hidden bg-[#080809]">

    <!-- Main panel -->
    <div class="flex flex-1 flex-col gap-5 overflow-hidden px-6 py-5">

      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-base font-semibold tracking-tight text-zinc-100">{{ t('docker.title') }}</h1>
          <p class="mt-1 text-xs text-zinc-600">
            <template v-if="connected">
              {{ t('docker.running', { n: runningCount }) }} ·
              {{ t('docker.containers', { n: containers.length }) }} ·
              {{ t('docker.images', { n: images.length }) }}
            </template>
            <span v-else class="text-zinc-700">{{ t('docker.notConnected') }}</span>
          </p>
        </div>
        <SharedButton
          variant="ghost"
          size="icon"
          :disabled="loading"
          class="h-8 w-8 text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
          @click="store.refresh()"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
        </SharedButton>
      </div>

      <!-- Alerts -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
      >
        <SharedAlert v-if="!connected && !loading" variant="warning" :title="t('docker.notReachable')" :description="t('docker.notReachableHint')" />
      </Transition>
      <SharedAlert v-if="error" variant="destructive" title="Error" :description="error" />

      <DockerToolbar />

      <!-- List -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        <DockerList />
      </div>
    </div>

    <!-- Logs panel -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="translate-x-4 opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-4 opacity-0"
    >
      <div v-if="selectedContainerId && selectedContainer" class="w-[420px] shrink-0">
        <LogsViewer
          :container-name="selectedContainer.name"
          :lines="selectedLogs"
          @close="store.selectContainer(null)"
        />
      </div>
    </Transition>

  </div>
</template>