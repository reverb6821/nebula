<script setup lang="ts">
import { onMounted, onUnmounted, onActivated, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useProcessesStore } from '../store'
import ProcessesToolbar from '../components/ProcessToolbar.vue'
import ProcessMeters from '../components/ProcessMeters.vue'
import ProcessDataTable from '../components/ProcessDataTable.vue'
import ProcessPagination from '../components/ProcessPagination.vue'
import { createProcessColumns } from '../utils/processColumns'
import { SharedAlert } from '@/components/shared'
import { usePageHeader } from '@/composables/usePageHeader'

const { t } = useI18n()
const store = useProcessesStore()
const {
  processes, filtered, paginated, loading, error, sortKey, sortDir, pendingPids, stats,
  page, pageSize, totalPages, selectedPid,
} = storeToRefs(store)

const { setHeader, clearHeader } = usePageHeader()

const columns = computed(() => createProcessColumns(sortKey.value, sortDir.value, store.setSort))

const subtitle = computed(
  () => t('processes.subtitle', { running: stats.value.running, shown: stats.value.shown, total: stats.value.total }),
)

function syncHeader() {
  setHeader({
    title: t('processes.title'),
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

<template lang="pug">
div(class="flex h-full flex-col bg-background")
  ProcessMeters(:tasks-total="stats.total" :tasks-running="stats.running")

  SharedAlert(v-if="error" variant="destructive" :title="t('common.error')" :description="error")

  div(class="min-h-0 flex-1 overflow-auto")
    div(v-if="loading && processes.length === 0" class="space-y-1 p-2" aria-hidden="true")
      div(v-for="i in 12" :key="i" class="h-8 animate-pulse rounded-md bg-muted")
    ProcessDataTable(
      v-else
      :columns="columns"
      :data="paginated"
      :selected-pid="selectedPid"
      :pending-pids="pendingPids"
      @select="store.select($event)"
    )

  ProcessPagination(
    v-if="filtered.length > 0"
    :page="page"
    :page-size="pageSize"
    :total="filtered.length"
    :total-pages="totalPages"
    @update:page="store.setPage($event)"
    @update:page-size="store.setPageSize($event)"
  )
</template>