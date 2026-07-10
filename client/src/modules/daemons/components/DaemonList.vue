<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDaemonsStore } from '../store'
import DaemonCard from './DaemonCard.vue'

const store = useDaemonsStore()
const { filtered, pendingNames, hasMore, stats, search } = storeToRefs(store)

const MIN_SEARCH_CHARS = 3
</script>

<template>
  <div class="flex h-full flex-col gap-3">

    <!-- Hint: digita ancora N caratteri -->
    <p
      v-if="search.length > 0 && search.length < MIN_SEARCH_CHARS"
      class="text-xs text-zinc-600"
    >
      Type {{ MIN_SEARCH_CHARS - search.length }} more
      {{ MIN_SEARCH_CHARS - search.length === 1 ? 'character' : 'characters' }}
      to search…
    </p>

    <!-- Lista -->
    <div class="space-y-1.5">
      <DaemonCard
        v-for="daemon in filtered"
        :key="daemon.name"
        :daemon="daemon"
        :pending="pendingNames.has(daemon.name)"
        @start="store.start(daemon.name)"
        @stop="store.stop(daemon.name)"
        @restart="store.restart(daemon.name)"
        @toggle-enabled="store.toggleEnabled(daemon.name)"
      />
    </div>

    <!-- Empty state -->
    <div
      v-if="filtered.length === 0"
      class="py-16 text-center text-sm text-zinc-600"
    >
      {{ search.length >= MIN_SEARCH_CHARS ? 'No daemons match your search.' : 'No daemons found.' }}
    </div>

    <!-- Load more -->
    <button
      v-if="hasMore"
      class="w-full rounded-lg border border-zinc-800 py-2.5 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
      @click="store.loadMore()"
    >
      Load more — {{ stats.matching - stats.shown }} remaining
    </button>

  </div>
</template>