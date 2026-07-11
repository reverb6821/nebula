<script setup lang="ts">
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
import { SharedButton } from '@/components/shared'
import { ref } from 'vue'
import Badge from '@/components/ui/badge/Badge.vue'

const store = useDaemonsStore()
const { search, filters, hasActiveFilters } = storeToRefs(store)

const open = ref(false)

const statusOptions: { value: DaemonStatus; label: string; dotClass: string }[] = [
  { value: 'active',   label: 'Active',   dotClass: 'bg-emerald-400' },
  { value: 'inactive', label: 'Inactive', dotClass: 'bg-zinc-500'    },
  { value: 'failed',   label: 'Failed',   dotClass: 'bg-red-400'     },
  { value: 'unknown',  label: 'Unknown',  dotClass: 'bg-yellow-400'  },
]

const enabledOptions: { value: DaemonEnabled; label: string }[] = [
  { value: 'enabled',  label: 'Enabled'  },
  { value: 'disabled', label: 'Disabled' },
  { value: 'static',   label: 'Static'   },
]
</script>

<template>
  <div class="flex flex-col gap-2">

    <!-- Search + toggle filtri -->
    <div class="flex gap-2">
      <div class="relative w-full max-w-xs">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input v-model="search" placeholder="Search daemons (3+ chars)…" class="pl-9 pr-9" />
        <SharedButton
          v-if="search.length > 0"
          variant="ghost"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:bg-transparent hover:text-zinc-300"
          @click="search = ''"
        >
          <X class="h-3.5 w-3.5" />
        </SharedButton>
      </div>

      <!-- Toggle filtri avanzati -->
      <Collapsible v-model:open="open">
        <CollapsibleTrigger as-child>
          <SharedButton
            variant="outline"
            size="icon"
            class="shrink-0 bg-transparent border-zinc-700 hover:bg-transparent hover:text-zinc-300"
            :class="(filters.status.length > 0 || filters.enabled.length > 0)
              ? 'border-indigo-500/50 text-indigo-400'
              : 'text-zinc-400'"
          >
            <SlidersHorizontal class="h-4 w-4" />
          </SharedButton>
        </CollapsibleTrigger>

        <!-- Pannello filtri avanzati -->
        <CollapsibleContent class="absolute z-10 mt-1 w-72 rounded-lg border border-zinc-800 bg-zinc-950 p-4 shadow-xl">
          <div class="flex flex-col gap-4">

            <!-- Status -->
            <div>
              <p class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                Status
              </p>
              <div class="flex flex-col gap-2">
                <!-- Click sul div wrapper, non sul Checkbox, per evitare doppio firing -->
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
                  <span class="flex items-center gap-1.5 text-sm text-zinc-300 select-none">
                    <span :class="['h-1.5 w-1.5 rounded-md', opt.dotClass]" />
                    {{ opt.label }}
                  </span>
                </div>
              </div>
            </div>

            <Separator class="bg-zinc-800" />

            <!-- Boot enabled -->
            <div>
              <p class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                Boot
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
                  <span class="text-sm text-zinc-300 select-none">{{ opt.label }}</span>
                </div>
              </div>
            </div>

            <Separator class="bg-zinc-800" />

            <!-- Reset -->
            <SharedButton
              variant="ghost"
              size="sm"
              class="w-full text-zinc-500 hover:bg-transparent hover:text-zinc-300"
              :disabled="!hasActiveFilters"
              @click="store.resetFilters()"
            >
              <X class="mr-1.5 h-3.5 w-3.5" />
              Reset all filters
            </SharedButton>

          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>

    <!-- Chip filtri attivi -->
    <div v-if="filters.status.length > 0 || filters.enabled.length > 0" class="flex flex-wrap gap-1.5">
      <Badge
        v-for="s in filters.status"
        :key="s"
        variant="secondary"
        class="gap-1 rounded-md font-normal capitalize py-0 border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-100"
      >
        {{ s }}
        <SharedButton
          variant="ghost"
          class="text-muted-foreground hover:text-foreground transition-colors ml-0.5 p-0 hover:bg-transparent hover:text-red-600"
          @click="store.toggleStatusFilter(s)"
        >
          <X class="h-2 w-2" />
        </SharedButton>
      </Badge>

      <Badge
        v-for="e in filters.enabled"
        :key="e"
        variant="secondary"
        class="gap-1 rounded-md font-normal capitalize py-0 border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-100"
      >
        boot: {{ e }}
        <SharedButton
          variant="ghost"
          class="text-muted-foreground hover:text-foreground transition-colors ml-0.5 p-0 hover:bg-transparent hover:text-red-600"
          @click="store.toggleEnabledFilter(e)"
        >
          <X class="h-2 w-2" />
        </SharedButton>
      </Badge>
    </div>

  </div>
</template>