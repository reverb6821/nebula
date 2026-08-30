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

// ── Label maps (riusate anche dai chip, per restare coerenti) ─────────────────

const statusLabels: Record<DaemonStatus, string> = {
  active: 'daemons.statusActive',
  inactive: 'daemons.statusInactive',
  failed: 'daemons.statusFailed',
  unknown: 'daemons.statusUnknown',
}

const enabledLabels: Record<DaemonEnabled, string> = {
  enabled: 'daemons.enabledEnabled',
  disabled: 'daemons.enabledDisabled',
  static: 'daemons.enabledStatic',
  unknown: 'daemons.enabledUnknown',
}

// ── Filter groups ─────────────────────────────────────────────────────────────

const filterGroups = computed<FilterGroup[]>(() => [
  {
    label: t('daemons.filterStatus'),
    // I pallini colore ora usano i token semantici (bg-success/…)
    // invece di emerald/red/amber hardcoded.
    options: [
      { value: 'active',   label: t('daemons.statusActive'),   dotClass: 'bg-success' },
      { value: 'inactive', label: t('daemons.statusInactive'), dotClass: 'bg-muted-foreground' },
      { value: 'failed',   label: t('daemons.statusFailed'),   dotClass: 'bg-destructive' },
      { value: 'unknown',  label: t('daemons.statusUnknown'),  dotClass: 'bg-warning' },
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
// Prima mostravano l'enum grezzo ('active', 'boot: enabled', …) invece
// della label tradotta già usata nel pannello — incoerente col resto
// dell'interfaccia, che è sempre localizzata.

const activeChips = computed<ActiveChip[]>(() => [
  ...filters.value.status.map(s => ({
    label: t(statusLabels[s]),
    onRemove: () => store.toggleStatusFilter(s),
  })),
  ...filters.value.enabled.map(e => ({
    label: t(enabledLabels[e]),
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