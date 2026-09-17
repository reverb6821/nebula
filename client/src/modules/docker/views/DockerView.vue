<script setup lang="ts">
import { onMounted, onUnmounted, onActivated, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useDockerStore } from '../store'
import DockerToolbar from '../components/DockerToolbar.vue'
import DockerList from '../components/DockerList.vue'
import LogsViewer from '../components/LogsViewer.vue'
import { SharedAlert } from '@/components/shared'
import { usePageHeader } from '@/composables/usePageHeader'

const { t } = useI18n()
const store = useDockerStore()
const {
  connected, loading,
  selectedContainerId, selectedContainer,
  selectedLogs,
  runningCount,
  images, containers,
} = storeToRefs(store)
const { setHeader, clearHeader } = usePageHeader()

const subtitle = computed(() =>
  connected.value
    ? `${t('docker.running', { n: runningCount.value })} · ` +
      `${t('docker.containers', { n: containers.value.length })} · ` +
      `${t('docker.images', { n: images.value.length })}`
    : t('docker.notConnected')
)

function syncHeader() {
  setHeader({
    title: t('docker.title'),
    subtitle: subtitle.value,
    toolsComponent: DockerToolbar,
    onRefresh: () => store.refresh(),
    refreshLoading: loading.value,
  })
}

onMounted(() => {
  syncHeader()
  store.connect()
})

onActivated(syncHeader)

watch([subtitle, loading], syncHeader)

onUnmounted(clearHeader)
</script>

<template lang="pug">
div(class="flex h-full flex-col overflow-hidden md:flex-row")

  div(class="flex flex-1 flex-col gap-5 overflow-hidden px-2 py-3")

    Transition(
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
    )
      SharedAlert(v-if="!connected && !loading" variant="warning" :title="t('docker.notReachable')" :description="t('docker.notReachableHint')")

    div(class="min-h-0 flex-1 overflow-y-auto")
      DockerList

  Transition(
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="translate-x-4 opacity-0"
    enter-to-class="translate-x-0 opacity-100"
    leave-active-class="transition-all duration-150 ease-in"
    leave-from-class="translate-x-0 opacity-100"
    leave-to-class="translate-x-4 opacity-0"
  )
    div(
      v-if="selectedContainerId && selectedContainer"
      class="w-full shrink-0 border-t border-border md:w-[420px] md:border-t-0"
    )
      LogsViewer(
        :container-name="selectedContainer.name"
        :lines="selectedLogs"
        @close="store.selectContainer(null)"
      )
</template>