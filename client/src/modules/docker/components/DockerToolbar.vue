<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Search } from '@lucide/vue'
import { useDockerStore } from '../store'
import { Input } from '@/components/ui/input'
import { SharedButton } from '@/components/shared'

const { t } = useI18n()
const store = useDockerStore()
const { activeTab, search } = storeToRefs(store)
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Tabs -->
    <div class="flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
      <SharedButton
        v-for="tab in (['containers', 'images'] as const)"
        :key="tab"
        class="rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all duration-150"
        :class="activeTab === tab
          ? 'bg-white/[0.08] text-zinc-100 shadow-sm'
          : 'text-zinc-500 hover:text-zinc-300'"
        @click="store.activeTab = tab"
      >
        {{ tab === 'containers' ? t('docker.tabContainers') : t('docker.tabImages') }}
      </SharedButton>
    </div>

    <!-- Search -->
    <div class="relative flex-1">
      <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
      <Input
        v-model="search"
        :placeholder="t('docker.filterPlaceholder')"
        class="h-8 border-white/[0.06] bg-white/[0.02] pl-8 text-xs text-zinc-300 placeholder:text-zinc-700 focus:border-white/[0.1] focus:ring-white/[0.05]"
      />
    </div>
  </div>
</template>