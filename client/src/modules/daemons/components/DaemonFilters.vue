<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, X, SlidersHorizontal } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useDaemonsStore } from '../store'
import type { DaemonStatus, DaemonEnabled } from '@/types/daemon'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { SharedButton } from '@/components/shared'

const { t } = useI18n()

const store = useDaemonsStore()
const { search, filters, hasActiveFilters } = storeToRefs(store)

const open = ref(false)

const statusOptions: { value: DaemonStatus; label: string; dotClass: string }[] = [
  { value: 'active',   label: t('daemons.statusActive'),   dotClass: 'bg-emerald-400' },
  { value: 'inactive', label: t('daemons.statusInactive'), dotClass: 'bg-zinc-500'    },
  { value: 'failed',   label: t('daemons.statusFailed'),   dotClass: 'bg-red-400'     },
  { value: 'unknown',  label: t('daemons.statusUnknown'),  dotClass: 'bg-amber-400'   },
]

const enabledOptions: { value: DaemonEnabled; label: string }[] = [
  { value: 'enabled',  label: t('daemons.enabledEnabled')  },
  { value: 'disabled', label: t('daemons.enabledDisabled') },
  { value: 'static',   label: t('daemons.enabledStatic')   },
]
</script>

<template>
  <div class="flex flex-col gap-2">

    <!-- Search + filter toggle -->
    <div class="flex gap-2">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
        <Input
          v-model="search"
          :placeholder="t('daemons.searchPlaceholder')"
          class="h-8 border-white/[0.06] bg-white/[0.02] pl-8 pr-8 text-xs text-zinc-300 placeholder:text-zinc-700 focus:border-white/[0.1] focus:ring-white/[0.05]"
        />
        <SharedButton
          v-if="search.length > 0"
          variant="ghost"
          class="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 p-0 text-zinc-600 hover:bg-transparent hover:text-zinc-300"
          @click="search = ''"
        >
          <X class="h-3 w-3" />
        </SharedButton>
      </div>

      <!-- Advanced filters toggle -->
      <Collapsible v-model:open="open">
        <CollapsibleTrigger as-child>
          <SharedButton
            variant="outline"
            size="icon"
            class="h-8 w-8 shrink-0 border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:text-zinc-300"
            :class="(filters.status.length > 0 || filters.enabled.length > 0)
              ? 'border-indigo-500/40 text-indigo-400'
              : 'text-zinc-500'"
          >
            <SlidersHorizontal class="h-3.5 w-3.5" />
          </SharedButton>
        </CollapsibleTrigger>

        <!-- Filter panel -->
        <CollapsibleContent class="absolute z-10 mt-1.5 w-64 rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-4 shadow-2xl shadow-black/50">
          <div class="flex flex-col gap-4">

            <!-- Status -->
            <div>
              <p class="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                {{ t('daemons.filterStatus') }}
              </p>
              <div class="flex flex-col gap-2">
                <div
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  class="flex cursor-pointer items-center gap-2.5"
                  @click="store.toggleStatusFilter(opt.value)"
                >
                  <Checkbox
                    :id="`status-${opt.value}`"
                    :checked="filters.status.includes(opt.value)"
                  />
                  <span class="flex select-none items-center gap-1.5 text-xs text-zinc-300">
                    <span :class="['h-1.5 w-1.5 rounded-full', opt.dotClass]" />
                    {{ opt.label }}
                  </span>
                </div>
              </div>
            </div>

            <Separator class="bg-white/[0.06]" />

            <!-- Boot enabled -->
            <div>
              <p class="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                {{ t('daemons.filterBoot') }}
              </p>
              <div class="flex flex-col gap-2">
                <div
                  v-for="opt in enabledOptions"
                  :key="opt.value"
                  class="flex cursor-pointer items-center gap-2.5"
                  @click="store.toggleEnabledFilter(opt.value)"
                >
                  <Checkbox
                    :id="`enabled-${opt.value}`"
                    :checked="filters.enabled.includes(opt.value)"
                  />
                  <span class="select-none text-xs text-zinc-300">{{ opt.label }}</span>
                </div>
              </div>
            </div>

            <Separator class="bg-white/[0.06]" />

            <!-- Reset -->
            <SharedButton
              variant="ghost"
              size="sm"
              class="w-full text-xs text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300"
              :disabled="!hasActiveFilters"
              @click="store.resetFilters()"
            >
              <X class="mr-1.5 h-3 w-3" />
              {{ t('daemons.resetFilters') }}
            </SharedButton>

          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>

    <!-- Active filter chips -->
    <div v-if="filters.status.length > 0 || filters.enabled.length > 0" class="flex flex-wrap gap-1">
      <Badge
        v-for="s in filters.status"
        :key="s"
        variant="outline"
        class="gap-1 rounded-full border-white/[0.08] bg-white/[0.03] py-0 font-mono text-[10px] capitalize text-zinc-300 hover:bg-white/[0.06]"
      >
        {{ s }}
        <button class="ml-0.5 text-zinc-600 transition-colors hover:text-red-400" @click="store.toggleStatusFilter(s)">
          <X class="h-2.5 w-2.5" />
        </button>
      </Badge>

      <Badge
        v-for="e in filters.enabled"
        :key="e"
        variant="outline"
        class="gap-1 rounded-full border-white/[0.08] bg-white/[0.03] py-0 font-mono text-[10px] capitalize text-zinc-300 hover:bg-white/[0.06]"
      >
        boot: {{ e }}
        <button class="ml-0.5 text-zinc-600 transition-colors hover:text-red-400" @click="store.toggleEnabledFilter(e)">
          <X class="h-2.5 w-2.5" />
        </button>
      </Badge>
    </div>

  </div>
</template>