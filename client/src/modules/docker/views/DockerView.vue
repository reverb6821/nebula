<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RefreshCw, Search, AlertTriangle, List, LayoutGrid } from '@lucide/vue'
import { useDockerStore } from '../store'
import ContainerItem from '../components/ContainerItem.vue'
import ContainerCard from '../components/ContainerCard.vue'
import ImageItem from '../components/ImageItem.vue'
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
  pendingIds, stats, favoritesArray,
  selectedContainerId, selectedContainer,
  selectedLogs,
  runningCount,
  images, containers,
  viewMode,
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
        <Button
          variant="ghost"
          size="icon"
          :disabled="loading"
          class="h-8 w-8 text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
          @click="store.refresh()"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>

      <!-- Not connected banner -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div
          v-if="!connected && !loading"
          class="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3"
        >
          <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p class="text-sm font-medium text-amber-400">Docker not reachable</p>
            <p class="mt-0.5 text-xs text-amber-500/60">Make sure Docker is installed and the daemon is running.</p>
          </div>
        </div>
      </Transition>

      <!-- Error -->
      <div
        v-if="error"
        class="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400"
      >
        {{ error }}
      </div>

      <!-- Toolbar -->
      <div class="flex items-center gap-2">
        <!-- Tabs -->
        <div class="flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
          <button
            v-for="tab in (['containers', 'images'] as const)"
            :key="tab"
            class="rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all duration-150"
            :class="activeTab === tab
              ? 'bg-white/[0.08] text-zinc-100 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300'"
            @click="store.activeTab = tab"
          >
            {{ tab }}
          </button>
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

        <!-- View toggle -->
        <div class="flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
          <button
            class="rounded-md p-1.5 transition-all duration-150"
            :class="viewMode === 'list' ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'"
            @click="store.viewMode = 'list'"
          >
            <List class="h-3.5 w-3.5" />
          </button>
          <button
            class="rounded-md p-1.5 transition-all duration-150"
            :class="viewMode === 'grid' ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'"
            @click="store.viewMode = 'grid'"
          >
            <LayoutGrid class="h-3.5 w-3.5" />
          </button>
        </div>

        <PullImageDialog v-if="activeTab === 'images'" />
      </div>

      <!-- Content -->
      <div
        class="flex-1 overflow-y-auto"
        :class="viewMode === 'grid' ? 'grid grid-cols-2 gap-2.5 xl:grid-cols-3 content-start' : 'flex flex-col gap-1'"
      >
        <!-- Skeleton -->
        <template v-if="loading && containers.length === 0 && images.length === 0">
          <div
            v-for="i in 6"
            :key="i"
            class="animate-pulse rounded-xl bg-white/[0.03]"
            :class="viewMode === 'grid' ? 'h-44' : 'h-14'"
          />
        </template>

        <!-- Containers -->
        <template v-else-if="activeTab === 'containers'">
          <template v-if="viewMode === 'list'" >
            <ContainerItem
              v-for="c in filteredContainers"
              :key="c.id"
              :container="c"
              :stats="stats.get(c.id)"
              :pending="pendingIds.has(c.id)"
              :selected="selectedContainerId === c.id"
              :favorite="favoritesArray.includes(c.id)"
              @start="store.start(c.id)"
              @stop="store.stop(c.id)"
              @restart="store.restart(c.id)"
              @remove="store.remove(c.id)"
              @logs="store.selectContainer(selectedContainerId === c.id ? null : c.id)"
              @toggle-favorite="store.toggleFavorite(c.id)"
            />
          </template>
          <template v-else>
            <ContainerCard
              v-for="c in filteredContainers"
              :key="c.id"
              :container="c"
              :stats="stats.get(c.id)"
              :pending="pendingIds.has(c.id)"
              :selected="selectedContainerId === c.id"
              :favorite="favoritesArray.includes(c.id)"
              @start="store.start(c.id)"
              @stop="store.stop(c.id)"
              @restart="store.restart(c.id)"
              @remove="store.remove(c.id)"
              @logs="store.selectContainer(selectedContainerId === c.id ? null : c.id)"
              @toggle-favorite="store.toggleFavorite(c.id)"
            />
          </template>
          <div
            v-if="filteredContainers.length === 0"
            class="col-span-full py-16 text-center text-xs text-zinc-700"
          >
            No containers found.
          </div>
        </template>

        <!-- Images -->
        <template v-else>
          <template v-if="viewMode === 'list'">
            <ImageItem
              v-for="img in filteredImages"
              :key="img.id"
              :image="img"
              :pending="pendingIds.has(img.id)"
              @remove="store.deleteImage(img.id)"
            />
          </template>
          <template v-else>
            <ImageCard
              v-for="img in filteredImages"
              :key="img.id"
              :image="img"
              :pending="pendingIds.has(img.id)"
              @remove="store.deleteImage(img.id)"
            />
          </template>
          <div
            v-if="filteredImages.length === 0"
            class="col-span-full py-16 text-center text-xs text-zinc-700"
          >
            No images found.
          </div>
        </template>
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