<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Box, LayoutGrid, List, Star } from '@lucide/vue'
import { useDockerStore } from '../store'
import ContainerItem from './ContainerItem.vue'
import ContainerCard from './ContainerCard.vue'
import ImageItem from './ImageItem.vue'
import ImageCard from './ImageCard.vue'
import PullImageDialog from './PullImageDialog.vue'
import { ItemGroup } from '@/components/ui/item'
import { SharedButton, SharedEmpty } from '@/components/shared'

const store = useDockerStore()
const {
    activeTab,
    filteredContainers,
    filteredImages,
    pendingIds,
    stats,
    favoritesArray,
    selectedContainerId,
    viewMode,
    loading,
    containers,
    images,
} = storeToRefs(store)

// containers suddivisi in favoriti / resto
const favContainers = computed(() => filteredContainers.value.filter(c => favoritesArray.value.includes(c.id)))
const restContainers = computed(() => filteredContainers.value.filter(c => !favoritesArray.value.includes(c.id)))

const hasAny = computed(() =>
    activeTab.value === 'containers'
        ? filteredContainers.value.length > 0
        : filteredImages.value.length > 0
)
</script>

<template>
    <div class="flex flex-col gap-3">

        <!-- Controls bar -->
        <div class="flex items-center justify-between">
            <p class="text-xs text-zinc-700">
                <template v-if="activeTab === 'containers'">
                    <span class="tabular-nums text-zinc-500">{{ filteredContainers.length }}</span> containers
                    <span v-if="favContainers.length > 0" class="ml-1 text-amber-500/60">
                        · <span class="tabular-nums">{{ favContainers.length }}</span> pinned
                    </span>
                </template>
                <template v-else>
                    <span class="tabular-nums text-zinc-500">{{ filteredImages.length }}</span> images
                </template>
            </p>

            <div class="flex items-center gap-2">
                <PullImageDialog v-if="activeTab === 'images'" />

                <!-- View toggle -->
                <div class="flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
                    <SharedButton variant="ghost" size="icon" class="h-6 w-6 transition-all duration-150"
                        :class="viewMode === 'list' ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'"
                        @click="store.viewMode = 'list'">
                        <List class="h-3.5 w-3.5" />
                    </SharedButton>
                    <SharedButton variant="ghost" size="icon" class="h-6 w-6 transition-all duration-150"
                        :class="viewMode === 'grid' ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'"
                        @click="store.viewMode = 'grid'">
                        <LayoutGrid class="h-3.5 w-3.5" />
                    </SharedButton>
                </div>
            </div>
        </div>

        <!-- Skeleton -->
        <template v-if="loading && containers.length === 0 && images.length === 0">
            <div v-for="i in 6" :key="i" class="animate-pulse rounded-xl bg-white/[0.03]"
                :class="viewMode === 'grid' ? 'h-44' : 'h-14'" />
        </template>

        <!-- Empty -->
        <SharedEmpty v-else-if="!hasAny" :icon="Box">
            <template #title>
                {{ activeTab === 'containers' ? 'No containers found.' : 'No images found.' }}
            </template>
            <template #description>Try modifying your search or filters</template>
        </SharedEmpty>

        <template v-else>

            <!-- ── CONTAINERS ────────────────────────────────────────────── -->
            <template v-if="activeTab === 'containers'">

                <!-- LIST -->
                <template v-if="viewMode === 'list'">

                    <!-- Pinned -->
                    <template v-if="favContainers.length > 0">
                        <div class="flex items-center gap-2">
                            <Star class="h-2.5 w-2.5 fill-current text-amber-400" />
                            <span
                                class="text-[10px] font-semibold uppercase tracking-widest text-amber-500/60">Pinned</span>
                        </div>
                        <ItemGroup class="gap-2">
                            <ContainerItem v-for="c in favContainers" :key="c.id" :container="c"
                                :stats="stats.get(c.id)" :pending="pendingIds.has(c.id)"
                                :selected="selectedContainerId === c.id" :favorite="true" @start="store.start(c.id)"
                                @stop="store.stop(c.id)" @restart="store.restart(c.id)" @remove="store.remove(c.id)"
                                @logs="store.selectContainer(selectedContainerId === c.id ? null : c.id)"
                                @toggle-favorite="store.toggleFavorite(c.id)" />
                        </ItemGroup>

                        <div v-if="restContainers.length > 0" class="flex items-center gap-3">
                            <div class="h-px flex-1 bg-white/[0.05]" />
                            <span class="text-[10px] uppercase tracking-widest text-zinc-700">All</span>
                            <div class="h-px flex-1 bg-white/[0.05]" />
                        </div>
                    </template>

                    <!-- Rest -->
                    <ItemGroup v-if="restContainers.length > 0" class="gap-2">
                        <ContainerItem v-for="c in restContainers" :key="c.id" :container="c" :stats="stats.get(c.id)"
                            :pending="pendingIds.has(c.id)" :selected="selectedContainerId === c.id" :favorite="false"
                            @start="store.start(c.id)" @stop="store.stop(c.id)" @restart="store.restart(c.id)"
                            @remove="store.remove(c.id)"
                            @logs="store.selectContainer(selectedContainerId === c.id ? null : c.id)"
                            @toggle-favorite="store.toggleFavorite(c.id)" />
                    </ItemGroup>

                </template>

                <!-- GRID -->
                <template v-else>

                    <!-- Pinned -->
                    <template v-if="favContainers.length > 0">
                        <div class="flex items-center gap-2">
                            <Star class="h-2.5 w-2.5 fill-current text-amber-400" />
                            <span
                                class="text-[10px] font-semibold uppercase tracking-widest text-amber-500/60">Pinned</span>
                        </div>
                        <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                            <ContainerCard v-for="c in favContainers" :key="c.id" :container="c"
                                :stats="stats.get(c.id)" :pending="pendingIds.has(c.id)"
                                :selected="selectedContainerId === c.id" :favorite="true" @start="store.start(c.id)"
                                @stop="store.stop(c.id)" @restart="store.restart(c.id)" @remove="store.remove(c.id)"
                                @logs="store.selectContainer(selectedContainerId === c.id ? null : c.id)"
                                @toggle-favorite="store.toggleFavorite(c.id)" />
                        </div>

                        <div v-if="restContainers.length > 0" class="flex items-center gap-3">
                            <div class="h-px flex-1 bg-white/[0.05]" />
                            <span class="text-[10px] uppercase tracking-widest text-zinc-700">All</span>
                            <div class="h-px flex-1 bg-white/[0.05]" />
                        </div>
                    </template>

                    <!-- Rest -->
                    <div v-if="restContainers.length > 0"
                        class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        <ContainerCard v-for="c in restContainers" :key="c.id" :container="c" :stats="stats.get(c.id)"
                            :pending="pendingIds.has(c.id)" :selected="selectedContainerId === c.id" :favorite="false"
                            @start="store.start(c.id)" @stop="store.stop(c.id)" @restart="store.restart(c.id)"
                            @remove="store.remove(c.id)"
                            @logs="store.selectContainer(selectedContainerId === c.id ? null : c.id)"
                            @toggle-favorite="store.toggleFavorite(c.id)" />
                    </div>

                </template>

            </template>

            <!-- ── IMAGES ─────────────────────────────────────────────────── -->
            <template v-else>

                <!-- LIST -->
                <ItemGroup v-if="viewMode === 'list'" class="gap-2">
                    <ImageItem v-for="img in filteredImages" :key="img.id" :image="img"
                        :pending="pendingIds.has(img.id)" @remove="store.deleteImage(img.id)" />
                </ItemGroup>

                <!-- GRID -->
                <div v-else class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    <ImageCard v-for="img in filteredImages" :key="img.id" :image="img"
                        :pending="pendingIds.has(img.id)" @remove="store.deleteImage(img.id)" />
                </div>

            </template>

        </template>

    </div>
</template>