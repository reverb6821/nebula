<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useDockerStore } from '../store'
import SharedFilter, {
  type TabOption,
} from '@/components/shared/SharedFilter.vue'

const { t } = useI18n()
const store = useDockerStore()
const { search } = storeToRefs(store)

// Prima `tabs` era una const calcolata una sola volta al setup: le
// label ("Containers"/"Images") restavano quelle della lingua attiva
// al primo render e non si aggiornavano più cambiando lingua a runtime
// (se l'app ha un selettore lingua nelle impostazioni, come suggerisce
// il resto dell'interfaccia). Un computed() richiama t() ogni volta
// che la lingua cambia, come già fatto per i filterGroups in
// DaemonFilters.vue e ProcessToolbar.vue.
const tabs = computed<TabOption<'containers' | 'images'>[]>(() => [
  { value: 'containers', label: t('docker.tabContainers') },
  { value: 'images', label: t('docker.tabImages') },
])
</script>

<template lang="pug">
  SharedFilter(
    v-model:search="search"
    v-model:active-tab="store.activeTab"
    :placeholder="t('docker.filterPlaceholder')"
    :tabs="tabs"
  )
</template>
