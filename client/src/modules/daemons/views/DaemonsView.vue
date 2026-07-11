<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RefreshCw } from '@lucide/vue'
import { useDaemonsStore } from '../store'
import DaemonList from '../components/DaemonList.vue'
import DaemonFilters from '../components/DaemonFilters.vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import SharedButton from '@/components/shared/SharedButton.vue'
import SharedAlert from '@/components/shared/SharedAlert.vue'

const store = useDaemonsStore()
const { loading, error, stats, daemons } = storeToRefs(store)

onMounted(() => store.fetch())
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-6">

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
          {{ stats.shown }} / {{ stats.total }} shown
        </p>
      </div>

      <SharedButton variant="ghost" size="icon" :disabled="loading" @click="store.fetch()">
        <RefreshCw class="h-4 w-4 text-zinc-400" :class="{ 'animate-spin': loading }" />
      </SharedButton>
    </div>

    <!-- Error -->
    <div v-if="error">
      <SharedAlert variant="destructive" title="ERROR!" :description="error" />
    </div>

    <!-- Filtri -->
    <div class="relative">
      <DaemonFilters />
    </div>

    <!-- List -->
    <ScrollArea class="min-h-0 flex-1">
      <div v-if="loading && daemons.length === 0" class="space-y-1.5 pr-3">
        <div v-for="i in 10" :key="i" class="h-[60px] animate-pulse rounded-lg bg-zinc-800/60" />
      </div>
      <div v-else class="pr-3">
        <DaemonList />
      </div>
    </ScrollArea>

  </div>
</template>