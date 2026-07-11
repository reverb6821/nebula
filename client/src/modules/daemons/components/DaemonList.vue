<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ActivitySquare, LayoutGrid, List } from '@lucide/vue'
import { useDaemonsStore } from '../store'
import DaemonItem from './DaemonItem.vue'
import DaemonCard from './DaemonCard.vue'
import { ItemGroup } from '@/components/ui/item'
import SharedEmpty from '@/components/shared/SharedEmpty.vue'
import SharedButton from '@/components/shared/SharedButton.vue'

const store = useDaemonsStore()
const { filtered, pendingNames, hasMore, stats, search } = storeToRefs(store)

const MIN_SEARCH_CHARS = 3

const viewMode = ref<'list' | 'grid'>('list')
</script>

<template>
  <div class="flex h-full flex-col gap-3">

    <!-- Barra controlli vista ed eventuali info di ricerca -->
    <div class="flex items-center justify-between">
      <p v-if="search.length > 0 && search.length < MIN_SEARCH_CHARS" class="text-xs text-zinc-600">
        Type {{ MIN_SEARCH_CHARS - search.length }} more
        {{ MIN_SEARCH_CHARS - search.length === 1 ? 'character' : 'characters' }}
        to search…
      </p>
      <div v-else class="text-xs text-zinc-600">
        Showing {{ filtered.length }} daemons
      </div>

      <!-- Toggle Vista -->
      <div class="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
        <SharedButton variant="ghost" size="icon" class="h-7 w-7"
          :class="viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'"
          @click="viewMode = 'list'">
          <List class="h-3.5 w-3.5" />
        </SharedButton>
        <SharedButton variant="ghost" size="icon" class="h-7 w-7"
          :class="viewMode === 'grid' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'"
          @click="viewMode = 'grid'">
          <LayoutGrid class="h-3.5 w-3.5" />
        </SharedButton>
      </div>
    </div>

    <!-- Lista: DaemonItem con ItemGroup -->
    <ItemGroup v-if="viewMode === 'list' && filtered.length > 0" class="gap-2">
      <DaemonItem v-for="daemon in filtered" :key="daemon.name" :daemon="daemon"
        :pending="pendingNames.has(daemon.name)" @start="store.start(daemon.name)" @stop="store.stop(daemon.name)"
        @restart="store.restart(daemon.name)" @toggle-enabled="store.toggleEnabled(daemon.name)" />
    </ItemGroup>

    <!-- Griglia: DaemonCard con shadcn Card -->
    <div v-else-if="viewMode === 'grid' && filtered.length > 0"
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <DaemonCard v-for="daemon in filtered" :key="daemon.name" :daemon="daemon"
        :pending="pendingNames.has(daemon.name)" @start="store.start(daemon.name)" @stop="store.stop(daemon.name)"
        @restart="store.restart(daemon.name)" @toggle-enabled="store.toggleEnabled(daemon.name)" />
    </div>

    <!-- Empty state -->
    <SharedEmpty v-if="filtered.length === 0" :icon="ActivitySquare">
      <template #title>{{ search.length >= MIN_SEARCH_CHARS ? 'No daemons match your search.' : 'No daemons found.'
        }}</template>
      <template #description>Try to modify or clean your filters</template>
    </SharedEmpty>

    <!-- Load more -->
    <SharedButton v-if="hasMore"
      class="w-full rounded-lg border border-zinc-800 py-2.5 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
      @click="store.loadMore()">
      Load more — {{ stats.matching - stats.shown }} remaining
    </SharedButton>

  </div>
</template>