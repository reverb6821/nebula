<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { ActivitySquare, LayoutGrid, List, Star } from '@lucide/vue'
import { useDaemonsStore } from '../store'
import DaemonItem from './DaemonItem.vue'
import DaemonCard from './DaemonCard.vue'
import { ItemGroup } from '@/components/ui/item'
import { SharedButton, SharedEmpty } from '@/components/shared'

const { t } = useI18n()

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
const hasAny = () => filteredFavorites.value.length > 0 || filteredNonFav.value.length > 0
</script>

<template>
  <div class="flex flex-col gap-3">

    <!-- Controls bar -->
    <div class="flex items-center justify-between">
      <p class="text-xs text-zinc-700">
        <template v-if="search.length > 0 && search.length < MIN_SEARCH_CHARS">
          {{ t('daemons.searchHint', { n: MIN_SEARCH_CHARS - search.length, char: t('daemons.searchHintChar', MIN_SEARCH_CHARS - search.length) }) }}
        </template>
        <template v-else>
          {{ t('daemons.daemonsCount', { n: stats.shown }) }}
          <span v-if="filteredFavorites.length > 0" class="ml-1 text-amber-500/60">
            · {{ t('daemons.pinnedCount', { n: filteredFavorites.length }) }}
          </span>
        </template>
      </p>

      <!-- View toggle -->
      <div class="flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
        <SharedButton
          variant="ghost"
          size="icon"
          class="h-6 w-6 transition-all duration-150"
          :class="viewMode === 'list' ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'"
          @click="viewMode = 'list'"
        >
          <List class="h-3.5 w-3.5" />
        </SharedButton>
        <SharedButton
          variant="ghost"
          size="icon"
          class="h-6 w-6 transition-all duration-150"
          :class="viewMode === 'grid' ? 'bg-white/[0.08] text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'"
          @click="viewMode = 'grid'"
        >
          <LayoutGrid class="h-3.5 w-3.5" />
        </SharedButton>
      </div>
    </div>

    <!-- Empty state -->
    <SharedEmpty v-if="!hasAny()" :icon="ActivitySquare">
      <template #title>
        {{ search.length >= MIN_SEARCH_CHARS ? t('daemons.noMatch') : t('daemons.notFound') }}
      </template>
      <template #description>{{ t('daemons.filtersModifyHint') }}</template>
    </SharedEmpty>

    <template v-else>

      <!-- ── LIST ─────────────────────────────────────────────────── -->
      <template v-if="viewMode === 'list'">

        <!-- Pinned -->
        <template v-if="filteredFavorites.length > 0">
          <div class="flex items-center gap-2">
            <Star class="h-2.5 w-2.5 fill-current text-amber-400" />
            <span class="text-[10px] font-semibold uppercase tracking-widest text-amber-500/60">{{ t('daemons.pinned') }}</span>
          </div>
          <ItemGroup class="gap-2">
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

          <div v-if="filteredNonFav.length > 0" class="flex items-center gap-3">
            <div class="h-px flex-1 bg-white/[0.05]" />
            <span class="text-[10px] uppercase tracking-widest text-zinc-700">{{ t('daemons.allSection') }}</span>
            <div class="h-px flex-1 bg-white/[0.05]" />
          </div>
        </template>

        <!-- Rest -->
        <ItemGroup v-if="filteredNonFav.length > 0" class="gap-2">
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

      <!-- ── GRID ─────────────────────────────────────────────────── -->
      <template v-else>

        <!-- Pinned -->
        <template v-if="filteredFavorites.length > 0">
          <div class="flex items-center gap-2">
            <Star class="h-2.5 w-2.5 fill-current text-amber-400" />
            <span class="text-[10px] font-semibold uppercase tracking-widest text-amber-500/60">{{ t('daemons.pinned') }}</span>
          </div>
          <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
            <div class="h-px flex-1 bg-white/[0.05]" />
            <span class="text-[10px] uppercase tracking-widest text-zinc-700">{{ t('daemons.allSection') }}</span>
            <div class="h-px flex-1 bg-white/[0.05]" />
          </div>
        </template>

        <!-- Rest -->
        <div v-if="filteredNonFav.length > 0" class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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

    <!-- Load more -->
    <button
      v-if="hasMore"
      class="w-full rounded-xl border border-white/[0.06] py-2.5 text-xs text-zinc-600 transition-all duration-150 hover:border-white/[0.1] hover:bg-white/[0.02] hover:text-zinc-400"
      @click="store.loadMore()"
    >
      {{ t('daemons.loadMoreRemaining', { n: stats.matching - stats.shown }) }}
    </button>

  </div>
</template>