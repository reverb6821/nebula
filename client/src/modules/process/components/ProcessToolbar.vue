<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProcessesStore } from '../store'
import SharedFilter, { type FilterGroup, type ActiveChip } from '@/components/shared/SharedFilter.vue'
import { SharedSwitch } from '@/components/shared'
import type { ProcessStatus } from '@/types/process'

const store = useProcessesStore()
const { search, statusFilter, hasActiveFilters, autoRefresh } = storeToRefs(store)

// ─── Status filter group ──────────────────────────────────────────────────────

const statusLabels: Record<ProcessStatus, string> = {
  R: 'Running',
  S: 'Sleeping',
  D: 'Disk wait',
  Z: 'Zombie',
  T: 'Stopped',
  I: 'Idle',
  '?': 'Unknown',
}

const statusDots: Record<ProcessStatus, string> = {
  R: 'bg-emerald-400',
  S: 'bg-zinc-500',
  D: 'bg-yellow-400',
  Z: 'bg-red-500',
  T: 'bg-orange-400',
  I: 'bg-zinc-600',
  '?': 'bg-zinc-700',
}

const statusOrder: ProcessStatus[] = ['R', 'S', 'D', 'Z', 'T', 'I']

const filterGroups = computed<FilterGroup<ProcessStatus>[]>(() => [
  {
    label: 'Status',
    options: statusOrder.map((value) => ({
      value,
      label: statusLabels[value],
      dotClass: statusDots[value],
    })),
    active: statusFilter.value,
    onToggle: (value) => store.toggleStatusFilter(value),
  },
])

const activeChips = computed<ActiveChip[]>(() =>
  statusFilter.value.map((s) => ({
    label: statusLabels[s],
    onRemove: () => store.toggleStatusFilter(s),
  })),
)
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- Auto-refresh -->
    <div class="flex items-center gap-2">
      <span class="text-[10px] uppercase tracking-widest text-zinc-600">Auto</span>
      <SharedSwitch
        :model-value="autoRefresh"
        @update:model-value="autoRefresh = $event"
      />
    </div>

    <SharedFilter
      v-model:search="search"
      placeholder="Search name, PID, user, command…"
      :filter-groups="filterGroups"
      :active-chips="activeChips"
      :has-active-filters="hasActiveFilters"
      class="w-80"
      @reset="store.resetFilters()"
    />
  </div>
</template>