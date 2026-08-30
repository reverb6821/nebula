<script setup lang="ts">
import { onMounted, onUnmounted, onActivated, computed, watch } from 'vue'
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

onMounted(() => {
  syncHeader()
  store.fetch()
})

onActivated(syncHeader)

watch([subtitle, loading], syncHeader)

onUnmounted(clearHeader)
</script>

<template>
  <div class="flex flex-col gap-5 px-2 py-3">

    <!-- Titolo prima era "Error" hardcoded in inglese, incoerente con
         il resto dell'app localizzato. Se la chiave common.error non
         esiste ancora nei file di traduzione, va aggiunta. -->
    <SharedAlert v-if="error" variant="destructive" :title="t('common.error')" :description="error" />

    <ScrollArea class="min-h-0 flex-1">
      <!--
        Placeholder di caricamento: rounded-xl → rounded-lg (16px,
        "contenitore", coerente con le card che sostituisce) e
        bg-white/[0.03] → bg-muted, per restare sui token del tema
        invece di un overlay bianco traslucido hardcoded.
      -->
      <div v-if="loading && daemons.length === 0" class="space-y-1 pr-3" aria-hidden="true">
        <div v-for="i in 10" :key="i" class="h-14 animate-pulse rounded-lg bg-muted" />
      </div>
      <div v-else class="pr-3">
        <DaemonList />
      </div>
    </ScrollArea>

  </div>
</template>