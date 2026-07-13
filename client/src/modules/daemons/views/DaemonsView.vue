<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RefreshCw } from '@lucide/vue'
import { useDaemonsStore } from '../store'
import DaemonList from '../components/DaemonList.vue'
import DaemonFilters from '../components/DaemonFilters.vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SharedButton, SharedAlert } from '@/components/shared'

const store = useDaemonsStore()
const { loading, error, stats, daemons } = storeToRefs(store)

onMounted(() => store.fetch())
</script>

<template>
  <div class="flex h-full flex-col gap-5 bg-[#080809] px-6 py-5">

    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-base font-semibold tracking-tight text-zinc-100">Daemons</h1>
        <p class="mt-1 text-xs text-zinc-600">
          <span class="text-emerald-400 tabular-nums">{{ stats.active }}</span>
          <span class="text-zinc-700"> running · </span>
          <span class="tabular-nums" :class="stats.failed > 0 ? 'text-red-400' : 'text-zinc-500'">{{ stats.failed }}</span>
          <span class="text-zinc-700"> failed · </span>
          <span class="tabular-nums text-zinc-500">{{ stats.shown }}</span>
          <span class="text-zinc-700"> / </span>
          <span class="tabular-nums text-zinc-500">{{ stats.total }}</span>
          <span class="text-zinc-700"> shown</span>
        </p>
      </div>

      <SharedButton
        variant="ghost"
        size="icon"
        :disabled="loading"
        class="h-8 w-8 text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
        @click="store.fetch()"
      >
        <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
      </SharedButton>
    </div>

    <!-- Error -->
    <SharedAlert v-if="error" variant="destructive" title="Error" :description="error" />

    <!-- Filters -->
    <div class="relative">
      <DaemonFilters />
    </div>

    <!-- List -->
    <ScrollArea class="min-h-0 flex-1">
      <div v-if="loading && daemons.length === 0" class="space-y-1 pr-3">
        <div v-for="i in 10" :key="i" class="h-14 animate-pulse rounded-xl bg-white/[0.03]" />
      </div>
      <div v-else class="pr-3">
        <DaemonList />
      </div>
    </ScrollArea>

  </div>
</template>