<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useDaemonsStore } from '../store'
import SharedFilter, {
  type FilterGroup,
  type ActiveChip,
} from '@/components/shared/SharedFilter.vue'
import type { DaemonStatus, DaemonEnabled } from '@/types/daemon'

const { t } = useI18n()
const store = useDaemonsStore()
const { search, filters, hasActiveFilters } = storeToRefs(store)

// ── Filter groups ─────────────────────────────────────────────────────────────

const filterGroups = computed<FilterGroup[]>(() => [
  {
    label: t('daemons.filterStatus'),
    options: [
      { value: 'active',   label: t('daemons.statusActive'),   dotClass: 'bg-emerald-400' },
      { value: 'inactive', label: t('daemons.statusInactive'), dotClass: 'bg-zinc-500'    },
      { value: 'failed',   label: t('daemons.statusFailed'),   dotClass: 'bg-red-400'     },
      { value: 'unknown',  label: t('daemons.statusUnknown'),  dotClass: 'bg-amber-400'   },
    ] as FilterGroup<DaemonStatus>['options'],
    active: filters.value.status,
    onToggle: (v) => store.toggleStatusFilter(v as DaemonStatus),
  },
  {
    label: t('daemons.filterBoot'),
    options: [
      { value: 'enabled',  label: t('daemons.enabledEnabled')  },
      { value: 'disabled', label: t('daemons.enabledDisabled') },
      { value: 'static',   label: t('daemons.enabledStatic')   },
    ] as FilterGroup<DaemonEnabled>['options'],
    active: filters.value.enabled,
    onToggle: (v) => store.toggleEnabledFilter(v as DaemonEnabled),
  },
])

// ── Active chips ──────────────────────────────────────────────────────────────

const activeChips = computed<ActiveChip[]>(() => [
  ...filters.value.status.map(s => ({
    label: s,
    onRemove: () => store.toggleStatusFilter(s),
  })),
  ...filters.value.enabled.map(e => ({
    label: `boot: ${e}`,
    onRemove: () => store.toggleEnabledFilter(e),
  })),
])
</script>

<template>
  <SharedFilter
    v-model:search="search"
    :placeholder="t('daemons.searchPlaceholder')"
    :filter-groups="filterGroups"
    :active-chips="activeChips"
    :has-active-filters="hasActiveFilters"
    @reset="store.resetFilters()"
  />
</template>