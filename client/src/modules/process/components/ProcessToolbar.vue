<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProcessesStore } from '../store'
import SharedFilter, { type FilterGroup, type ActiveChip } from '@/components/shared/SharedFilter.vue'
import { SharedSwitch } from '@/components/shared'
import type { ProcessStatus } from '@/types/process'
import { PROCESS_STATUS_LABELS, PROCESS_STATUS_DOT } from '../utils/processStatus'

const store = useProcessesStore()
const { search, statusFilter, hasActiveFilters, autoRefresh } = storeToRefs(store)

const statusOrder: ProcessStatus[] = ['R', 'S', 'D', 'Z', 'T', 'I']

const filterGroups = computed<FilterGroup<ProcessStatus>[]>(() => [
  {
    label: 'Status',
    options: statusOrder.map((value) => ({
      value,
      label: PROCESS_STATUS_LABELS[value],
      dotClass: PROCESS_STATUS_DOT[value],
    })),
    active: statusFilter.value,
    onToggle: (value) => store.toggleStatusFilter(value),
  },
])

const activeChips = computed<ActiveChip[]>(() =>
  statusFilter.value.map((s) => ({
    label: PROCESS_STATUS_LABELS[s],
    onRemove: () => store.toggleStatusFilter(s),
  })),
)
</script>

<template lang="pug">
div(class="flex items-center gap-3")
  //- Auto-refresh
  div(class="flex items-center gap-2")
    span(class="text-[10px] uppercase tracking-widest text-muted-foreground") Auto
    SharedSwitch(
      :model-value="autoRefresh"
      aria-label="Aggiornamento automatico"
      @update:model-value="autoRefresh = $event"
    )

  SharedFilter(
    v-model:search="search"
    placeholder="Search name, PID, user, command…"
    :filter-groups="filterGroups"
    :active-chips="activeChips"
    :has-active-filters="hasActiveFilters"
    class="w-80"
    @reset="store.resetFilters()"
  )
</template>