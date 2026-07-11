<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ActivitySquare, LayoutGrid, List, Star } from '@lucide/vue'
import { useDaemonsStore } from '../store'
import DaemonItem from './DaemonItem.vue'
import DaemonCard from './DaemonCard.vue'
import { ItemGroup } from '@/components/ui/item'
import { SharedButton, SharedEmpty } from '@/components/shared'

const store = useDaemonsStore()
const {
  filteredFavorites,
  filteredNonFav,
  pendingNames,
  favoritesArray,
  hasMore,
  stats,
  search,
  viewMode,
} = storeToRefs(store)

const MIN_SEARCH_CHARS = 3

const hasAny = () =>
  filteredFavorites.value.length > 0 || filteredNonFav.value.length > 0
</script>

<template>
  <div class="flex h-full flex-col gap-3">

    <!-- Barra controlli vista -->
    <div class="flex items-center justify-between">
      <p v-if="search.length > 0 && search.length < MIN_SEARCH_CHARS" class="text-xs text-zinc-600">
        Type {{ MIN_SEARCH_CHARS - search.length }} more
        {{ MIN_SEARCH_CHARS - search.length === 1 ? 'character' : 'characters' }}
        to search…
      </p>
      <div v-else class="text-xs text-zinc-600">
        Showing {{ stats.shown }} daemons
        <span v-if="filteredFavorites.length > 0" class="ml-1 text-amber-500/70">
          · {{ filteredFavorites.length }} pinned
        </span>
      </div>

      <!-- Toggle Vista -->
      <div class="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
        <SharedButton
          variant="ghost"
          size="icon"
          class="h-7 w-7 hover:bg-zinc-800 hover:text-zinc-100"
          :class="viewMode === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'"
          @click="viewMode = 'list'"
        >
          <List class="h-3.5 w-3.5" />
        </SharedButton>
        <SharedButton
          variant="ghost"
          size="icon"
          class="h-7 w-7 hover:bg-zinc-800 hover:text-zinc-100"
          :class="viewMode === 'grid' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'"
          @click="viewMode = 'grid'"
        >
          <LayoutGrid class="h-3.5 w-3.5" />
        </SharedButton>
      </div>
    </div>

    <!-- Empty state globale -->
    <SharedEmpty v-if="!hasAny()" :icon="ActivitySquare">
      <template #title>
        {{ search.length >= MIN_SEARCH_CHARS ? 'No daemons match your search.' : 'No daemons found.' }}
      </template>
      <template #description>Try to modify or clean your filters</template>
    </SharedEmpty>

    <template v-else>

      <!-- ── LISTA ──────────────────────────────────────────────────── -->
      <template v-if="viewMode === 'list'">

        <!-- Favoriti -->
        <template v-if="filteredFavorites.length > 0">
          <div class="flex items-center gap-2">
            <Star class="h-3 w-3 fill-current text-amber-400" />
            <span class="text-[10px] font-semibold uppercase tracking-widest text-amber-500/70">
              Pinned
            </span>
          </div>
          <ItemGroup>
            <DaemonItem
              v-for="daemon in filteredFavorites"
              :key="daemon.name"
              :daemon="daemon"
              :pending="pendingNames.has(daemon.name)"
              :favorite="favoritesArray.includes(daemon.name)"
              @start="store.start(daemon.name)"
              @stop="store.stop(daemon.name)"
              @restart="store.restart(daemon.name)"
              @toggle-enabled="store.toggleEnabled(daemon.name)"
              @toggle-favorite="store.toggleFavorite(daemon.name)"
            />
          </ItemGroup>

          <!-- Separatore tra favoriti e resto -->
          <div v-if="filteredNonFav.length > 0" class="flex items-center gap-3">
            <div class="h-px flex-1 bg-zinc-800" />
            <span class="text-[10px] uppercase tracking-widest text-zinc-700">All</span>
            <div class="h-px flex-1 bg-zinc-800" />
          </div>
        </template>

        <!-- Non favoriti -->
        <ItemGroup v-if="filteredNonFav.length > 0">
          <DaemonItem
            v-for="daemon in filteredNonFav"
            :key="daemon.name"
            :daemon="daemon"
            :pending="pendingNames.has(daemon.name)"
            :favorite="favoritesArray.includes(daemon.name)"
            @start="store.start(daemon.name)"
            @stop="store.stop(daemon.name)"
            @restart="store.restart(daemon.name)"
            @toggle-enabled="store.toggleEnabled(daemon.name)"
            @toggle-favorite="store.toggleFavorite(daemon.name)"
          />
        </ItemGroup>

      </template>

      <!-- ── GRIGLIA ────────────────────────────────────────────────── -->
      <template v-else>

        <!-- Favoriti -->
        <template v-if="filteredFavorites.length > 0">
          <div class="flex items-center gap-2">
            <Star class="h-3 w-3 fill-current text-amber-400" />
            <span class="text-[10px] font-semibold uppercase tracking-widest text-amber-500/70">
              Pinned
            </span>
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DaemonCard
              v-for="daemon in filteredFavorites"
              :key="daemon.name"
              :daemon="daemon"
              :pending="pendingNames.has(daemon.name)"
              :favorite="favoritesArray.includes(daemon.name)"
              @start="store.start(daemon.name)"
              @stop="store.stop(daemon.name)"
              @restart="store.restart(daemon.name)"
              @toggle-enabled="store.toggleEnabled(daemon.name)"
              @toggle-favorite="store.toggleFavorite(daemon.name)"
            />
          </div>

          <div v-if="filteredNonFav.length > 0" class="flex items-center gap-3">
            <div class="h-px flex-1 bg-zinc-800" />
            <span class="text-[10px] uppercase tracking-widest text-zinc-700">All</span>
            <div class="h-px flex-1 bg-zinc-800" />
          </div>
        </template>

        <!-- Non favoriti -->
        <div v-if="filteredNonFav.length > 0" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DaemonCard
            v-for="daemon in filteredNonFav"
            :key="daemon.name"
            :daemon="daemon"
            :pending="pendingNames.has(daemon.name)"
            :favorite="favoritesArray.includes(daemon.name)"
            @start="store.start(daemon.name)"
            @stop="store.stop(daemon.name)"
            @restart="store.restart(daemon.name)"
            @toggle-enabled="store.toggleEnabled(daemon.name)"
            @toggle-favorite="store.toggleFavorite(daemon.name)"
          />
        </div>

      </template>

    </template>

    <!-- Load more (solo non-favoriti) -->
    <SharedButton
      v-if="hasMore"
      class="w-full rounded-lg border border-zinc-800 py-2.5 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
      @click="store.loadMore()"
    >
      Load more — {{ stats.matching - stats.shown }} remaining
    </SharedButton>

  </div>
</template>