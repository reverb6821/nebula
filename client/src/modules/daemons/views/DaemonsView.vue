<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useDaemonsStore } from '../store'
import DaemonList from '../components/DaemonList.vue'
import DaemonFilters from '../components/DaemonFilters.vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SharedAlert } from '@/components/shared'
import { usePageHeader } from '@/composables/usePageHeader'

const { t } = useI18n()
const store = useDaemonsStore()
const { loading, error, stats, daemons } = storeToRefs(store)
const { setHeader, clearHeader } = usePageHeader()

const subtitle = computed(() =>
  `${t('daemons.running', { n: stats.value.active })} · ` +
  `${t('daemons.failed', { n: stats.value.failed })} · ` +
  `${t('daemons.shown', { shown: stats.value.shown, total: stats.value.total })}`
)

function syncHeader() {
  setHeader({
    title: t('daemons.title'),
    subtitle: subtitle.value,
    toolsComponent: DaemonFilters,
    onRefresh: () => store.fetch(),
    refreshLoading: loading.value,
  })
}

syncHeader()
watch([subtitle, loading], syncHeader)

onUnmounted(clearHeader)
onMounted(() => store.fetch())
</script>

<template>
  <div class="flex h-full flex-col gap-5 px-2 py-3">

    <!-- Error -->
    <SharedAlert v-if="error" variant="destructive" title="Error" :description="error" />

    <!-- List -->
    <ScrollArea class="min-h-0 flex-1">
      <div v-if="loading && daemons.length === 0" class="space-y-1 pr-3">
        <div v-for="i in 10" :key="i" class="h-14 animate-pulse rounded-xl bg-white/[0.03]" />
      </div>
      <div v-else class="pr-3">
        <DaemonList />
      </div>
    </ScrollArea>

  </div>
</template>