<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RefreshCw, Search } from '@lucide/vue'
import { useDaemonsStore } from '../store'
import DaemonList from '../components/DaemonList.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const store = useDaemonsStore()
const { loading, error, search, stats, daemons } = storeToRefs(store)

onMounted(() => store.fetch())
</script>

<template>
  <div class="flex h-full flex-col gap-6 p-6">

    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-lg font-semibold text-zinc-100">Daemons</h1>
        <p class="mt-0.5 text-sm text-zinc-500">
          <span class="text-emerald-400">{{ stats.active }} running</span>
          <span class="mx-1.5 text-zinc-700">·</span>
          <span :class="stats.failed > 0 ? 'text-red-400' : ''">
            {{ stats.failed }} failed
          </span>
          <span class="mx-1.5 text-zinc-700">·</span>
          {{ stats.total }} total
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        :disabled="loading"
        @click="store.fetch()"
      >
        <RefreshCw
          class="h-4 w-4 text-zinc-400"
          :class="{ 'animate-spin': loading }"
        />
      </Button>
    </div>

    <!-- Error banner -->
    <div
      v-if="error"
      class="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
    >
      {{ error }}
    </div>

    <!-- Search -->
    <div class="relative">
      <Search
        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
      />
      <Input
        v-model="search"
        placeholder="Filter by name or description…"
        class="pl-9"
      />
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto">
      <!-- Skeleton -->
      <div v-if="loading && daemons.length === 0" class="space-y-1.5">
        <div
          v-for="i in 10"
          :key="i"
          class="h-[60px] animate-pulse rounded-lg bg-zinc-800/60"
        />
      </div>

      <DaemonList v-else />
    </div>

  </div>
</template>