<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { Button } from '@/components/ui/button'
import { FilterChips, SearchField, SharedAlert, StatusDot } from '@/components/shared'
import type { FilterChip } from '@/components/shared/FilterChips.vue'
import { usePageHeader } from '@/composables/usePageHeader'
import type { Daemon } from '@/types/daemon'
import { useDaemonsStore } from '../store'
import DaemonRow from '../components/DaemonRow.vue'

type UnitFilter = 'all' | 'running' | 'failed' | 'inactive' | 'boot'

const { t } = useI18n()
const store = useDaemonsStore()
const {
  daemons, loading, error, stats, search, filters,
  filteredFavorites, allFilteredNonFav, filteredNonFav, hasMore, pendingNames, favoritesArray,
} = storeToRefs(store)
const { setHeader, clearHeader } = usePageHeader()

const subtitle = computed(() =>
  `${t('daemons.running', { n: stats.value.active })} · ` +
  `${t('daemons.failed', { n: stats.value.failed })} · ` +
  t('services.unitsCount', { n: stats.value.total }),
)

function syncHeader() {
  setHeader({
    title: t('services.title'),
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

// ─── Filtri (chip a selezione singola, mappati sui filtri dello store) ──────

const activeFilter = computed<UnitFilter>(() => {
  const { status, enabled } = filters.value
  if (enabled.length === 1 && enabled[0] === 'enabled' && status.length === 0) return 'boot'
  if (status.length === 1 && enabled.length === 0) {
    if (status[0] === 'active') return 'running'
    if (status[0] === 'failed') return 'failed'
    if (status[0] === 'inactive') return 'inactive'
  }
  return 'all'
})

function setFilter(value: UnitFilter | UnitFilter[]) {
  const next = Array.isArray(value) ? value[0] ?? 'all' : value
  store.setFilters({
    status: next === 'running' ? ['active'] : next === 'failed' ? ['failed'] : next === 'inactive' ? ['inactive'] : [],
    enabled: next === 'boot' ? ['enabled'] : [],
  })
}

const inactiveCount = computed(() => daemons.value.filter((d) => d.status === 'inactive').length)

const chips = computed<FilterChip<UnitFilter>[]>(() => [
  { value: 'all', label: t('services.filterAll'), count: stats.value.total },
  { value: 'running', label: t('services.filterRunning'), count: stats.value.active },
  { value: 'failed', label: t('services.filterFailed'), count: stats.value.failed, tone: 'destructive' },
  { value: 'inactive', label: t('services.filterInactive'), count: inactiveCount.value },
  { value: 'boot', label: t('services.filterBoot') },
])

// ─── Sezioni ────────────────────────────────────────────────────────────────

const failedUnits = computed(() =>
  [...filteredFavorites.value, ...allFilteredNonFav.value].filter((d) => d.status === 'failed'),
)
const remaining = computed(() => allFilteredNonFav.value.length - filteredNonFav.value.length)
const isEmpty = computed(() => filteredFavorites.value.length === 0 && allFilteredNonFav.value.length === 0)

function isPending(name: string) {
  return pendingNames.value.has(name)
}

function isFavorite(daemon: Daemon) {
  return favoritesArray.value.includes(daemon.name)
}
</script>

<template lang="pug">
div(class="mx-auto flex w-full max-w-[1040px] flex-col gap-[22px] px-8 pt-2 pb-12")
  div(class="flex flex-col gap-3")
    SearchField(
      v-model="search"
      :label="t('services.searchLabel')"
      :placeholder="t('services.searchPlaceholder')"
    )
    FilterChips(
      :items="chips"
      :model-value="activeFilter"
      :label="t('services.filterLabel')"
      @update:model-value="setFilter"
    )

  SharedAlert(v-if="error" variant="destructive" :title="t('common.error')" :description="error")

  div(v-if="loading && daemons.length === 0" class="overflow-hidden rounded-lg border border-border bg-card" aria-hidden="true")
    div(v-for="i in 8" :key="i" class="h-16 animate-pulse border-t border-border first:border-t-0")

  template(v-else)
    //- Failed: emerge in alto con l'azione a portata
    section(v-if="failedUnits.length" aria-labelledby="failed-h" class="flex flex-col gap-2.5")
      h2(id="failed-h" class="pl-1 text-sm font-bold text-[#ffb3ad]") {{ t('services.failedSection') }}
      div(class="overflow-hidden rounded-lg border border-[#ff7b63]/20 bg-destructive-surface [&>*+*]:border-t [&>*+*]:border-border")
        div(
          v-for="unit in failedUnits"
          :key="unit.name"
          class="flex min-h-16 flex-wrap items-center gap-3.5 py-3 pr-3 pl-[18px]"
        )
          StatusDot(tone="failed" size="md")
          div(class="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5")
            span(class="font-mono text-sm font-semibold break-all")
              | {{ unit.name }}
              span(class="text-[#c9a9ac]") .service
            span(class="text-13 text-[#d6bfc1]") {{ t('services.enteredFailed') }}
          Button(
            variant="destructive"
            class="min-h-9"
            :disabled="isPending(unit.name)"
            :aria-label="t('services.restartUnit', { name: unit.name })"
            @click="store.restart(unit.name)"
          )
            | {{ t('common.restart') }}

    //- Pinned
    section(v-if="filteredFavorites.length" aria-labelledby="pinned-h" class="flex flex-col gap-2.5")
      h2(id="pinned-h" class="pl-1 text-sm font-bold text-group-foreground") {{ t('daemons.pinned') }}
      div(class="overflow-hidden rounded-lg border border-border bg-card [&>*+*]:border-t [&>*+*]:border-border")
        DaemonRow(
          v-for="daemon in filteredFavorites"
          :key="daemon.name"
          :daemon="daemon"
          :pending="isPending(daemon.name)"
          favorite
          @start="store.start(daemon.name)"
          @stop="store.stop(daemon.name)"
          @restart="store.restart(daemon.name)"
          @toggle-enabled="store.toggleEnabled(daemon.name)"
          @toggle-favorite="store.toggleFavorite(daemon.name)"
        )

    //- All units
    section(aria-labelledby="all-h" class="flex flex-col gap-2.5")
      div(class="flex items-center pl-1")
        h2(id="all-h" class="flex-1 text-sm font-bold text-group-foreground") {{ t('services.allUnits') }}
        span(class="text-xs text-muted-foreground") {{ t('services.sortedByName') }}
      div(v-if="isEmpty" class="rounded-lg border border-border bg-card px-[18px] py-6 text-center text-13 text-muted-foreground")
        | {{ daemons.length ? t('daemons.noMatch') : t('daemons.notFound') }}
      div(v-else class="overflow-hidden rounded-lg border border-border bg-card [&>*+*]:border-t [&>*+*]:border-border")
        DaemonRow(
          v-for="daemon in filteredNonFav"
          :key="daemon.name"
          :daemon="daemon"
          :pending="isPending(daemon.name)"
          :favorite="isFavorite(daemon)"
          @start="store.start(daemon.name)"
          @stop="store.stop(daemon.name)"
          @restart="store.restart(daemon.name)"
          @toggle-enabled="store.toggleEnabled(daemon.name)"
          @toggle-favorite="store.toggleFavorite(daemon.name)"
        )
        div(v-if="hasMore" class="flex justify-center p-2.5")
          Button(variant="ghost" class="text-primary-text hover:text-primary-text" @click="store.loadMore()")
            | {{ t('services.showMore', remaining) }}
</template>
