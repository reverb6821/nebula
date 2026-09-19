<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SharedFilter, { type ActiveChip, type FilterGroup } from '@/components/shared/SharedFilter.vue'
import type { AlertFilters as AlertFilterState } from '@/modules/alerts/store'
import type { AlertCategory, AlertLifecycle, AlertSeverity } from '@/types/alert'

const props = withDefaults(defineProps<{
  filters: AlertFilterState
}>(), {
  filters: () => ({ states: [], categories: [], severities: [] }),
})

const emit = defineEmits<{
  'update:filters': [filters: AlertFilterState]
}>()

const { t } = useI18n()

function stateKey(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function update<K extends keyof AlertFilterState>(key: K, value: AlertFilterState[K]) {
  emit('update:filters', {
    states: [...props.filters.states],
    categories: [...props.filters.categories],
    severities: [...props.filters.severities],
    [key]: value,
  })
}

function toggle<K extends keyof AlertFilterState>(key: K, value: AlertFilterState[K][number]) {
  const current = props.filters[key] as string[]
  const next = current.includes(value as string)
    ? current.filter((item) => item !== value)
    : [...current, value as never]
  update(key, next as AlertFilterState[K])
}

const filterGroups = computed<FilterGroup<string>[]>(() => [
  {
    label: t('alerts.filterState'),
    options: [
      { value: 'triggered', label: t('alerts.stateTriggered'), dotClass: 'bg-destructive' },
      { value: 'acknowledged', label: t('alerts.stateAcknowledged'), dotClass: 'bg-warning' },
      { value: 'resolved', label: t('alerts.stateResolved'), dotClass: 'bg-success' },
    ],
    active: props.filters.states,
    onToggle: (value) => toggle('states', value as AlertLifecycle),
  },
  {
    label: t('alerts.filterCategory'),
    options: (['resources', 'storage', 'processes', 'services', 'temperatures', 'network'] as AlertCategory[])
      .map((value) => ({ value, label: t(`alerts.category.${value}`) })),
    active: props.filters.categories,
    onToggle: (value) => toggle('categories', value as AlertCategory),
  },
  {
    label: t('alerts.filterSeverity'),
    options: [
      { value: 'critical', label: t('alerts.severityCritical'), dotClass: 'bg-destructive' },
      { value: 'warning', label: t('alerts.severityWarning'), dotClass: 'bg-warning' },
      { value: 'info', label: t('alerts.severityInfo'), dotClass: 'bg-primary' },
    ],
    active: props.filters.severities,
    onToggle: (value) => toggle('severities', value as AlertSeverity),
  },
])

const activeChips = computed<ActiveChip[]>(() => [
  ...props.filters.states.map((value) => ({ label: t(`alerts.state${stateKey(value)}`), onRemove: () => toggle('states', value) })),
  ...props.filters.categories.map((value) => ({ label: t(`alerts.category.${value}`), onRemove: () => toggle('categories', value) })),
  ...props.filters.severities.map((value) => ({ label: t(`alerts.severity${stateKey(value)}`), onRemove: () => toggle('severities', value) })),
])

function reset() {
  emit('update:filters', { states: [], categories: [], severities: [] })
}
</script>

<template lang="pug">
SharedFilter(
  search=""
  :filter-groups="filterGroups"
  :active-chips="activeChips"
  :has-active-filters="activeChips.length > 0"
  :placeholder="t('alerts.filterPlaceholder')"
  @reset="reset"
)
</template>
