<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog, FilterChips, SearchField, SharedAlert } from '@/components/shared'
import type { FilterChip } from '@/components/shared/FilterChips.vue'
import { usePageHeader } from '@/composables/usePageHeader'
import type { ProcessStatus } from '@/types/process'
import { useProcessesStore } from '../store'
import ProcessMeters from '../components/ProcessMeters.vue'
import ProcessDataTable from '../components/ProcessDataTable.vue'
import ProcessPagination from '../components/ProcessPagination.vue'
import { createProcessColumns } from '../utils/processColumns'

type ProcessFilter = 'all' | ProcessStatus

const { t } = useI18n()
const store = useProcessesStore()
const {
  processes, filtered, paginated, loading, error, sortKey, sortDir, pendingPids, stats,
  page, pageSize, totalPages, selectedPid, search, statusFilter, autoRefresh,
} = storeToRefs(store)

const { setHeader, clearHeader } = usePageHeader()

const columns = computed(() => createProcessColumns(sortKey.value, sortDir.value, store.setSort))

const subtitle = computed(() => t('processes.headerSubtitle', { total: stats.value.total, running: stats.value.running }))

function syncHeader() {
  setHeader({
    title: t('processes.title'),
    subtitle: subtitle.value,
    toolsComponent: null,
    onRefresh: () => store.fetch(),
    refreshLoading: loading.value,
  })
}

onMounted(() => {
  syncHeader()
  void store.fetch()
})
watch([subtitle, loading], syncHeader)
onUnmounted(clearHeader)

// ─── Filtri ─────────────────────────────────────────────────────────────────

function countStatus(status: ProcessStatus) {
  return processes.value.filter((p) => p.status === status).length
}

const chips = computed<FilterChip<ProcessFilter>[]>(() => [
  { value: 'all', label: t('processes.filterAll'), count: stats.value.total },
  { value: 'R', label: t('processes.filterRunning'), count: stats.value.running },
  { value: 'S', label: t('processes.filterSleeping'), count: countStatus('S') },
  { value: 'D', label: t('processes.filterDiskWait'), count: countStatus('D') },
  { value: 'Z', label: t('processes.filterZombie'), count: countStatus('Z'), tone: 'destructive' },
])

const activeFilter = computed<ProcessFilter>(() =>
  statusFilter.value.length === 1 ? statusFilter.value[0]! : 'all',
)

function setFilter(value: ProcessFilter | ProcessFilter[]) {
  const next = Array.isArray(value) ? value[0] ?? 'all' : value
  store.setStatusFilter(next === 'all' ? [] : [next])
}

// ─── Selezione e azioni ─────────────────────────────────────────────────────

const selected = computed(() => processes.value.find((p) => p.pid === selectedPid.value) ?? null)
const selectedPending = computed(() => selected.value !== null && pendingPids.value.has(selected.value.pid))

type ConfirmKind = 'terminate' | 'kill'
const confirmKind = ref<ConfirmKind | null>(null)
const confirmOpen = computed({
  get: () => confirmKind.value !== null,
  set: (open: boolean) => { if (!open) confirmKind.value = null },
})

const confirmTitle = computed(() => {
  if (!selected.value || !confirmKind.value) return ''
  return confirmKind.value === 'kill'
    ? t('processes.confirmKillTitle', { name: selected.value.name })
    : t('processes.confirmEndTitle', { name: selected.value.name })
})

const confirmDescription = computed(() => {
  if (!selected.value || !confirmKind.value) return ''
  return confirmKind.value === 'kill'
    ? t('processes.confirmKillDescription', { pid: selected.value.pid })
    : t('processes.confirmEndDescription', { pid: selected.value.pid })
})

async function runConfirmed() {
  const process = selected.value
  const kind = confirmKind.value
  confirmKind.value = null
  if (!process || !kind) return
  try {
    if (kind === 'kill') await store.kill(process.pid)
    else await store.terminate(process.pid)
  } catch (e) {
    store.setError(e instanceof Error ? e.message : String(e))
  }
}

async function changePriority(delta: number) {
  if (!selected.value) return
  try {
    await store.niceStep(selected.value.pid, delta)
  } catch (e) {
    store.setError(e instanceof Error ? e.message : String(e))
  }
}
</script>

<template lang="pug">
div(class="mx-auto flex w-full max-w-[1320px] flex-col gap-[18px] px-8 pt-2 pb-10")
  ProcessMeters(:tasks-total="stats.total" :tasks-running="stats.running")

  div(class="flex flex-wrap items-center gap-2.5")
    SearchField(
      v-model="search"
      class="min-h-10 flex-[1_1_320px] rounded-[9px] px-3"
      :label="t('processes.searchLabel')"
      :placeholder="t('processes.searchPlaceholder')"
    )
    FilterChips(
      :items="chips"
      :model-value="activeFilter"
      :label="t('processes.filterLabel')"
      @update:model-value="setFilter"
    )
    label(class="ml-auto flex min-h-10 items-center gap-2 text-13 text-group-foreground")
      | {{ t('processes.liveUpdates') }}
      Switch(v-model="autoRefresh" :aria-label="t('processes.liveUpdates')")

  SharedAlert(v-if="error" variant="destructive" :title="t('common.error')" :description="error")

  section(:aria-label="t('processes.listLabel')" class="overflow-hidden rounded-lg border border-border bg-card")
    div(v-if="loading && processes.length === 0" aria-hidden="true")
      div(v-for="i in 12" :key="i" class="h-10 animate-pulse border-b border-white/4")
    div(v-else class="max-h-[calc(100svh-360px)] min-h-60 overflow-auto")
      ProcessDataTable(
        :columns="columns"
        :data="paginated"
        :selected-pid="selectedPid"
        :pending-pids="pendingPids"
        :sort-key="sortKey"
        :sort-dir="sortDir"
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

    //- Barra azioni sulla riga selezionata
    div(class="flex flex-wrap items-center gap-2.5 border-t border-white/8 bg-muted px-4 py-3")
      span(v-if="selected" class="flex min-w-[200px] flex-1 flex-wrap items-baseline gap-x-1.5 text-13 text-group-foreground")
        span {{ t('processes.selected') }}
        strong(class="text-white") {{ selected.name }}
        span(class="font-mono text-muted-foreground") PID {{ selected.pid }}
      span(v-else class="min-w-[200px] flex-1 text-13 text-muted-foreground") {{ t('processes.noSelection') }}
      DropdownMenu
        DropdownMenuTrigger(as-child)
          Button(variant="secondary" :disabled="!selected || selectedPending")
            | {{ t('processes.changePriority') }}
            ChevronDown(class="size-4" aria-hidden="true")
        DropdownMenuContent(align="end")
          DropdownMenuItem(@select="changePriority(-1)") {{ t('processes.raisePriority', { ni: (selected?.ni ?? 0) - 1 }) }}
          DropdownMenuItem(@select="changePriority(1)") {{ t('processes.lowerPriority', { ni: (selected?.ni ?? 0) + 1 }) }}
      Button(
        variant="secondary"
        :disabled="!selected || selectedPending"
        @click="confirmKind = 'kill'"
      ) {{ t('processes.killProcess') }}
      Button(
        variant="destructive"
        :disabled="!selected || selectedPending"
        @click="confirmKind = 'terminate'"
      ) {{ t('processes.endProcess') }}

  ConfirmDialog(
    v-model:open="confirmOpen"
    :title="confirmTitle"
    :description="confirmDescription"
    :confirm-label="confirmKind === 'kill' ? t('processes.killProcess') : t('processes.endProcess')"
    :cancel-label="t('common.cancel')"
    @confirm="runConfirmed"
  )
</template>
