<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDaemonsStore } from '../store'
import DaemonCard from './DaemonCard.vue'

const store = useDaemonsStore()
const { filtered, pendingNames } = storeToRefs(store)
</script>

<template>
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

    <div
      v-if="filtered.length === 0"
      class="py-16 text-center text-sm text-zinc-500"
    >
      No daemons match your search.
    </div>
  </div>
</template>