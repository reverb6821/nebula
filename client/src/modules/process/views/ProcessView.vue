<script setup lang="ts">
import { onMounted, onUnmounted, onActivated, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useProcessesStore } from '../store'
import ProcessesToolbar from '../components/ProcessToolbar.vue'
import ProcessMeters from '../components/ProcessMeters.vue'
import ProcessDataTable from '../components/ProcessDataTable.vue'
import ProcessPagination from '../components/ProcessPagination.vue'
import ProcessFunctionBar from '../components/ProcessFunctionBar.vue'
import { createProcessColumns } from '../utils/processColumns'
import { SharedAlert } from '@/components/shared'
import { usePageHeader } from '@/composables/usePageHeader'

const store = useProcessesStore()
const {
  filtered, paginated, loading, error, sortKey, sortDir, pendingPids, stats,
  page, pageSize, totalPages, selectedPid,
} = storeToRefs(store)

const { setHeader, clearHeader } = usePageHeader()

const columns = computed(() => createProcessColumns(sortKey.value, sortDir.value, store.setSort))

const subtitle = computed(
  () => `${stats.value.running} running · ${stats.value.shown}/${stats.value.total} shown`,
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

onActivated(syncHeader)

watch([subtitle, loading], syncHeader)

onUnmounted(clearHeader)
</script>

<template>
  <div class="flex h-full flex-col bg-zinc-950">
    <ProcessMeters :tasks-total="stats.total" :tasks-running="stats.running" />

    <SharedAlert v-if="error" variant="destructive" title="Error" :description="error" />

    <div class="min-h-0 flex-1 overflow-auto">
      <ProcessDataTable
        :columns="columns"
        :data="paginated"
        :selected-pid="selectedPid"
        :pending-pids="pendingPids"
        @select="store.select($event)"
      />
    </div>

    <ProcessPagination
      v-if="filtered.length > 0"
      :page="page"
      :page-size="pageSize"
      :total="filtered.length"
      :total-pages="totalPages"
      @update:page="store.setPage($event)"
      @update:page-size="store.setPageSize($event)"
    />

    <ProcessFunctionBar
      :has-selection="selectedPid !== null"
      @kill="selectedPid !== null && store.kill(selectedPid)"
      @nice-down="selectedPid !== null && store.niceStep(selectedPid, -1)"
      @nice-up="selectedPid !== null && store.niceStep(selectedPid, 1)"
    />
  </div>
</template>