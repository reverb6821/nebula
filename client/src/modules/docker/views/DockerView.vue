<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { ConfirmDialog, SearchField, SharedAlert, StatusDot } from '@/components/shared'
import { usePageHeader } from '@/composables/usePageHeader'
import type { DockerContainer, DockerImage } from '@/types/docker'
import { useDockerStore } from '../store'
import DockerTabs from '../components/DockerTabs.vue'
import ContainerCard from '../components/ContainerCard.vue'
import ImageRow from '../components/ImageRow.vue'
import LogsViewer from '../components/LogsViewer.vue'
import PullImageDialog from '../components/PullImageDialog.vue'
import { containersUsingImage, formatImageSize } from '../utils/format'

const { t } = useI18n()
const store = useDockerStore()
const {
  connected, loading, error, activeTab, search,
  selectedContainerId, selectedContainer, selectedLogs,
  runningCount, images, containers, filteredContainers, filteredImages, pendingIds,
} = storeToRefs(store)
const { setHeader, clearHeader } = usePageHeader()

function setTab(tab: 'containers' | 'images') {
  activeTab.value = tab
}

function syncHeader() {
  setHeader({
    title: t('docker.title'),
    titleComponent: DockerTabs,
    titleProps: {
      modelValue: activeTab.value,
      containersLabel: t('docker.tabContainers'),
      imagesLabel: t('docker.tabImages'),
      label: t('docker.tabsLabel'),
      'onUpdate:modelValue': setTab,
    },
    toolsComponent: null,
    onRefresh: () => (connected.value ? store.refresh() : store.connect()),
    refreshLoading: loading.value,
  })
}

onMounted(() => {
  syncHeader()
  void store.connect()
})
watch([activeTab, loading], syncHeader)
onUnmounted(clearHeader)

// ─── Stat ───────────────────────────────────────────────────────────────────

const totalImageSize = computed(() => images.value.reduce((sum, image) => sum + image.size, 0))

// ─── Logs ───────────────────────────────────────────────────────────────────

const logsOpen = computed({
  get: () => selectedContainerId.value !== null && selectedContainer.value !== null,
  set: (open: boolean) => { if (!open) void store.selectContainer(null) },
})

// ─── Conferme distruttive ───────────────────────────────────────────────────

type PendingConfirm =
  | { kind: 'container'; container: DockerContainer }
  | { kind: 'image'; image: DockerImage }

const pendingConfirm = ref<PendingConfirm | null>(null)
const confirmOpen = computed({
  get: () => pendingConfirm.value !== null,
  set: (open: boolean) => { if (!open) pendingConfirm.value = null },
})

const confirmTitle = computed(() => {
  const c = pendingConfirm.value
  if (!c) return ''
  return c.kind === 'container'
    ? t('docker.confirmRemoveTitle', { name: c.container.name })
    : t('docker.confirmDeleteTitle', { name: c.image.repoTags[0] ?? c.image.id.slice(0, 19) })
})

const confirmDescription = computed(() => {
  const c = pendingConfirm.value
  if (!c) return ''
  return c.kind === 'container'
    ? t('docker.confirmRemoveDescription')
    : t('docker.confirmDeleteDescription')
})

async function runConfirmed() {
  const c = pendingConfirm.value
  pendingConfirm.value = null
  if (!c) return
  try {
    if (c.kind === 'container') await store.remove(c.container.id)
    else await store.deleteImage(c.image.id)
  } catch (e) {
    store.setError(e instanceof Error ? e.message : String(e))
  }
}

async function runAction(action: () => Promise<void>) {
  try {
    await action()
  } catch (e) {
    store.setError(e instanceof Error ? e.message : String(e))
  }
}
</script>

<template lang="pug">
div(class="mx-auto flex w-full max-w-[1120px] flex-col gap-5 px-8 pt-2 pb-12")
  SharedAlert(
    v-if="!connected && !loading"
    variant="warning"
    :title="t('docker.notReachable')"
    :description="t('docker.notReachableHint')"
  )
  SharedAlert(v-else-if="error" variant="destructive" :title="t('common.error')" :description="error")

  //- Stato engine
  section(:aria-label="t('docker.engineLabel')" class="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3")
    div(class="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-[18px] py-4")
      span(class="text-xs font-semibold text-muted-foreground") {{ t('docker.engine') }}
      span(class="flex items-center gap-2 text-lg font-bold")
        StatusDot(:tone="connected ? 'running' : 'idle'")
        | {{ connected ? t('docker.engineActive') : t('docker.engineUnavailable') }}
    div(class="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-[18px] py-4")
      span(class="text-xs font-semibold text-muted-foreground") {{ t('docker.tabContainers') }}
      span(class="text-lg font-bold")
        | {{ containers.length }}
        |
        span(class="text-13 font-medium text-muted-foreground") · {{ t('docker.running', { n: runningCount }) }}
    div(class="flex flex-col gap-1.5 rounded-lg border border-border bg-card px-[18px] py-4")
      span(class="text-xs font-semibold text-muted-foreground") {{ t('docker.tabImages') }}
      span(class="text-lg font-bold")
        | {{ images.length }}
        |
        span(class="text-13 font-medium text-muted-foreground") · {{ formatImageSize(totalImageSize) }}

  //- Toolbar
  div(class="flex flex-wrap items-center gap-2.5")
    SearchField(
      v-model="search"
      class="min-h-10 flex-[1_1_300px] rounded-[9px] px-3"
      :shortcut="false"
      :label="t('docker.filterLabel')"
      :placeholder="t('docker.filterPlaceholder')"
    )
    PullImageDialog(v-if="activeTab === 'images'")

  //- Containers
  template(v-if="activeTab === 'containers'")
    div(v-if="filteredContainers.length === 0" class="rounded-lg border border-border bg-card px-[18px] py-6 text-center text-13 text-muted-foreground")
      | {{ t('docker.noContainers') }}
    section(v-else :aria-label="t('docker.tabContainers')" class="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-3.5")
      ContainerCard(
        v-for="container in filteredContainers"
        :key="container.id"
        :container="container"
        :pending="pendingIds.has(container.id)"
        @logs="store.selectContainer(container.id)"
        @start="runAction(() => store.start(container.id))"
        @stop="runAction(() => store.stop(container.id))"
        @restart="runAction(() => store.restart(container.id))"
        @remove="pendingConfirm = { kind: 'container', container }"
      )

  //- Images
  template(v-else)
    div(v-if="filteredImages.length === 0" class="rounded-lg border border-border bg-card px-[18px] py-6 text-center text-13 text-muted-foreground")
      | {{ t('docker.noImages') }}
    section(v-else :aria-label="t('docker.tabImages')" class="overflow-hidden rounded-lg border border-border bg-card [&>*+*]:border-t [&>*+*]:border-border")
      ImageRow(
        v-for="image in filteredImages"
        :key="image.id"
        :image="image"
        :used-by="containersUsingImage(image, containers)"
        :pending="pendingIds.has(image.id)"
        @delete="pendingConfirm = { kind: 'image', image }"
      )

  Sheet(v-model:open="logsOpen")
    SheetContent(side="right" class="w-full gap-0 border-border p-0 sm:max-w-[480px] [&>button]:hidden")
      SheetTitle(class="sr-only") {{ t('docker.logs') }}
      SheetDescription(class="sr-only") {{ selectedContainer?.name }}
      LogsViewer(
        v-if="selectedContainer"
        :container-name="selectedContainer.name"
        :lines="selectedLogs"
        @close="store.selectContainer(null)"
      )

  ConfirmDialog(
    v-model:open="confirmOpen"
    :title="confirmTitle"
    :description="confirmDescription"
    :confirm-label="pendingConfirm?.kind === 'image' ? t('docker.deleteImageConfirm') : t('docker.removeContainerConfirm')"
    :cancel-label="t('common.cancel')"
    @confirm="runConfirmed"
  )
</template>
