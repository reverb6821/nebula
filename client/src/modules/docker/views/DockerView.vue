<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RefreshCw, Search, AlertTriangle } from '@lucide/vue'
import { useDockerStore } from '../store'
import ContainerCard from '../components/ContainerCard.vue'
import ImageCard from '../components/ImageCard.vue'
import LogsViewer from '../components/LogsViewer.vue'
import PullImageDialog from '../components/PullImageDialog.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const store = useDockerStore()
const {
  connected, loading, error,
  activeTab, search,
  filteredContainers, filteredImages,
  pendingIds, stats,
  selectedContainerId, selectedContainer,
  selectedLogs,
  runningCount,
  images, containers,
} = storeToRefs(store)

onMounted(() => store.connect())
</script>

<template>
  <div class="flex h-full overflow-hidden">

    <!-- Main panel -->
    <div class="flex flex-1 flex-col gap-4 overflow-hidden p-6">

      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-lg font-semibold text-zinc-100">Docker</h1>
          <p class="mt-0.5 text-sm text-zinc-500">
            <span v-if="connected">
              <span class="text-emerald-400">{{ runningCount }} running</span>
              <span class="mx-1.5 text-zinc-700">·</span>
              {{ containers.length }} containers
              <span class="mx-1.5 text-zinc-700">·</span>
              {{ images.length }} images
            </span>
            <span v-else class="text-zinc-600">Not connected</span>
          </p>
        </div>
        <Button variant="ghost" size="icon" :disabled="loading" @click="store.refresh()">
          <RefreshCw
            class="h-4 w-4 text-zinc-400"
            :class="{ 'animate-spin': loading }"
          />
        </Button>
      </div>

      <!-- Not connected banner -->
      <div
        v-if="!connected && !loading"
        class="flex items-start gap-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400"
      >
        <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p class="font-medium">Docker not reachable</p>
          <p class="mt-0.5 text-xs text-yellow-400/70">
            Make sure Docker is installed and the daemon is running.
          </p>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
      >
        {{ error }}
      </div>

      <!-- Tabs + search + pull -->
      <div class="flex items-center gap-3">
        <div class="flex rounded-md border border-zinc-800 p-0.5">
          <button
            v-for="tab in (['containers', 'images'] as const)"
            :key="tab"
            :class="[
              'rounded px-3 py-1 text-sm capitalize transition-colors',
              activeTab === tab
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300',
            ]"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input v-model="search" placeholder="Filter…" class="pl-9" />
        </div>

        <PullImageDialog v-if="activeTab === 'images'" />
      </div>

      <!-- List -->
      <div class="flex-1 space-y-1.5 overflow-y-auto">
        <!-- Skeleton -->
        <template v-if="loading && containers.length === 0 && images.length === 0">
          <div
            v-for="i in 6"
            :key="i"
            class="h-[64px] animate-pulse rounded-lg bg-zinc-800/60"
          />
        </template>

        <!-- Containers -->
        <template v-else-if="activeTab === 'containers'">
          <ContainerCard
            v-for="c in filteredContainers"
            :key="c.id"
            :container="c"
            :stats="stats.get(c.id)"
            :pending="pendingIds.has(c.id)"
            :selected="selectedContainerId === c.id"
            @start="store.start(c.id)"
            @stop="store.stop(c.id)"
            @restart="store.restart(c.id)"
            @remove="store.remove(c.id)"
            @logs="store.selectContainer(selectedContainerId === c.id ? null : c.id)"
          />
          <div
            v-if="filteredContainers.length === 0"
            class="py-16 text-center text-sm text-zinc-600"
          >
            No containers found.
          </div>
        </template>

        <!-- Images -->
        <template v-else>
          <ImageCard
            v-for="img in filteredImages"
            :key="img.id"
            :image="img"
            :pending="pendingIds.has(img.id)"
            @remove="store.deleteImage(img.id)"
          />
          <div
            v-if="filteredImages.length === 0"
            class="py-16 text-center text-sm text-zinc-600"
          >
            No images found.
          </div>
        </template>
      </div>
    </div>

    <!-- Logs panel (slide in from right) -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-full opacity-0"
    >
      <div v-if="selectedContainerId && selectedContainer" class="w-[480px] shrink-0">
        <LogsViewer
          :container-name="selectedContainer.name"
          :lines="selectedLogs"
          @close="store.selectContainer(null)"
        />
      </div>
    </Transition>

  </div>
</template>