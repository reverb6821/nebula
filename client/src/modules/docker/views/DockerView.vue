<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RefreshCw, Search, AlertTriangle } from '@lucide/vue'
import { useDockerStore } from '../store'
import DockerList from '../components/DockerList.vue'
import LogsViewer from '../components/LogsViewer.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SharedButton, SharedAlert } from '@/components/shared'

const store = useDockerStore()
const {
  connected, loading, error,
  activeTab, search,
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
          <h1 class="text-base font-semibold tracking-tight text-zinc-100">Docker</h1>
          <p class="mt-1 text-xs text-zinc-600">
            <template v-if="connected">
              <span class="text-emerald-400 tabular-nums">{{ runningCount }}</span>
              <span class="text-zinc-700"> running · </span>
              <span class="tabular-nums text-zinc-500">{{ containers.length }}</span>
              <span class="text-zinc-700"> containers · </span>
              <span class="tabular-nums text-zinc-500">{{ images.length }}</span>
              <span class="text-zinc-700"> images</span>
            </template>
            <span v-else class="text-zinc-700">Not connected</span>
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

      <!-- Not connected banner -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
      >
          <SharedAlert v-if="!connected && !loading" variant="warning" title="Docker not reachable" description="Make sure Docker is installed and the daemon is running." />
      </Transition>

      <!-- Error -->
      <SharedAlert v-if="error" variant="destructive" title="Error" :description="error" />


      <!-- Tabs + Search -->
      <div class="flex items-center gap-2">
        <!-- Tabs -->
        <div class="flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
          <SharedButton
            v-for="tab in (['containers', 'images'] as const)"
            :key="tab"
            class="rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all duration-150"
            :class="activeTab === tab
              ? 'bg-white/[0.08] text-zinc-100 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'"
            @click="store.activeTab = tab"
          >
            {{ tab }}
          </SharedButton>
        </div>

        <!-- Search -->
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <Input
            v-model="search"
            placeholder="Filter…"
            class="h-8 border-white/[0.06] bg-white/[0.02] pl-8 text-xs text-zinc-300 placeholder:text-zinc-700 focus:border-white/[0.1] focus:ring-white/[0.05]"
          />
        </div>
      </div>

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