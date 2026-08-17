<script setup lang="ts">
import { onMounted, onUnmounted, onActivated, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useProcessesStore } from '../store'
import { usePageHeader } from '@/composables/usePageHeader'
import ProcessesToolbar from '../components/ProcessToolbar.vue'
import ProcessTableHeader from '../components/ProcessTableHeader.vue'
import ProcessRow from '../components/ProcessRow.vue'

const store = useProcessesStore()
const { filtered, loading, error, sortKey, sortDir, pendingPids, stats } = storeToRefs(store)
const { setHeader, clearHeader } = usePageHeader()

const subtitle = computed(() =>
  `${stats.value.running} running · ${stats.value.shown} / ${stats.value.total} shown`
)

function syncHeader() {
  setHeader({
    title: 'Processes',
    subtitle: subtitle.value,
    toolsComponent: ProcessesToolbar,
    onRefresh: () => store.fetch(),
    refreshLoading: loading.value,
  })
}

onMounted(() => {
  syncHeader()
  store.fetch()
})

// Necessario se la route è tenuta in keep-alive: al ritorno sulla pagina
// onMounted non viene richiamato, solo onActivated — senza questo l'header
// resterebbe quello dell'ultima pagina visitata.
onActivated(syncHeader)

watch([subtitle, loading], syncHeader)

onUnmounted(clearHeader)
</script>

<template>
  <div class="flex h-full flex-col gap-4">

    <!-- Error -->
    <div
      v-if="error"
      class="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-400"
    >
      {{ error }}
    </div>

    <!-- Table -->
    <div class="min-h-0 flex-1 overflow-auto">
      <!-- Skeleton -->
      <div v-if="loading && filtered.length === 0" class="space-y-1">
        <div
          v-for="i in 15"
          :key="i"
          class="h-10 animate-pulse rounded bg-white/[0.03]"
        />
      </div>

      <table v-else class="w-full border-collapse">
        <thead class="sticky top-0 z-10 bg-[#080809]">
          <tr class="border-b border-zinc-800">
            <ProcessTableHeader
              label="Name"
              sort-key="name"
              :active-sort-key="sortKey"
              :sort-dir="sortDir"
              @sort="store.setSort"
            />
            <ProcessTableHeader
              label="PID"
              sort-key="pid"
              :active-sort-key="sortKey"
              :sort-dir="sortDir"
              @sort="store.setSort"
            />
            <ProcessTableHeader
              label="User"
              sort-key="user"
              :active-sort-key="sortKey"
              :sort-dir="sortDir"
              @sort="store.setSort"
            />
            <ProcessTableHeader
              label="Status"
              sort-key="status"
              :active-sort-key="sortKey"
              :sort-dir="sortDir"
              @sort="store.setSort"
            />
            <ProcessTableHeader
              label="CPU %"
              sort-key="cpuPercent"
              :active-sort-key="sortKey"
              :sort-dir="sortDir"
              align="right"
              @sort="store.setSort"
            />
            <ProcessTableHeader
              label="Memory"
              sort-key="memBytes"
              :active-sort-key="sortKey"
              :sort-dir="sortDir"
              align="right"
              @sort="store.setSort"
            />
            <ProcessTableHeader label="Time" align="right" :active-sort-key="sortKey" :sort-dir="sortDir" />
            <th class="w-8" />
          </tr>
        </thead>
        <tbody>
          <ProcessRow
            v-for="proc in filtered"
            :key="proc.pid"
            :process="proc"
            :pending="pendingPids.has(proc.pid)"
            @kill="store.kill(proc.pid)"
            @terminate="store.terminate(proc.pid)"
            @renice="store.renice(proc.pid, $event)"
          />
        </tbody>
      </table>

      <div
        v-if="!loading && filtered.length === 0"
        class="py-16 text-center text-sm text-zinc-600"
      >
        No processes match your search.
      </div>
    </div>

  </div>
</template>