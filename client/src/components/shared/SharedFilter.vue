<script setup lang="ts" generic="TTab extends string = string, TFilter extends string = string">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, X, SlidersHorizontal } from '@lucide/vue'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SharedButton } from '@/components/shared'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterOption<T extends string = string> {
  value: T
  label: string
  /** Optional colored dot class (e.g. 'bg-emerald-400') */
  dotClass?: string
}

export interface FilterGroup<T extends string = string> {
  /** Section heading shown in the panel */
  label: string
  options: FilterOption<T>[]
  /** Currently active values in this group */
  active: T[]
  /** Called when the user toggles an option */
  onToggle: (value: T) => void
}

export interface ActiveChip {
  label: string
  onRemove: () => void
}

export interface TabOption<T extends string = string> {
  value: T
  label: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

const props = withDefaults(defineProps<{
  /** v-model for the search string */
  search: string
  /** Search input placeholder */
  placeholder?: string

  /**
   * Optional tabs rendered to the left of the search bar.
   * Pair with `activeTab` + `onUpdate:activeTab`.
   */
  tabs?: TabOption<TTab>[]
  /** Currently active tab value */
  activeTab?: TTab

  /**
   * Optional advanced-filter groups rendered in the collapsible panel.
   * If omitted, the filter toggle button is hidden.
   */
  filterGroups?: FilterGroup<TFilter>[]

  /**
   * Active filter chips shown at the bottom of the panel.
   * Build this array from whichever filters are currently on.
   */
  activeChips?: ActiveChip[]

  /** Controls whether the "Reset filters" button is enabled */
  hasActiveFilters?: boolean
}>(), {
  placeholder: 'Search…',
  tabs: undefined,
  activeTab: undefined,
  filterGroups: undefined,
  activeChips: () => [],
  hasActiveFilters: false,
})

// ─── Emits ────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  'update:search': [value: string]
  'update:activeTab': [value: TTab]
  'reset': []
}>()

// ─── Local state ─────────────────────────────────────────────────────────────

const open = ref(false)
const searchInput = ref<InstanceType<typeof Input> | null>(null)

const hasFilters = computed(
  () => props.filterGroups && props.filterGroups.length > 0
)

const anyFilterActive = computed(
  () => props.filterGroups?.some(g => g.active.length > 0) ?? false
)

// ─── Ctrl+F shortcut ─────────────────────────────────────────────────────────

function onKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault()
    // Input is wrapped by shadcn — grab the real <input> element
    const el = (searchInput.value?.$el as HTMLElement | undefined)
      ?.querySelector?.('input') as HTMLInputElement | null
      ?? (searchInput.value?.$el as HTMLInputElement | null)
    el?.focus()
    el?.select()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex items-center gap-2">

    <!-- ── Optional tabs ──────────────────────────────────────────────────── -->
    <div
      v-if="tabs && tabs.length"
      class="flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-0.5"
    >
      <SharedButton
        v-for="tab in tabs"
        :key="tab.value"
        variant="outline"
        class="rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all duration-150"
        :class="activeTab === tab.value
          ? 'bg-white/[0.08] text-zinc-100 shadow-sm'
          : 'text-zinc-500 hover:text-zinc-300'"
        @click="emit('update:activeTab', tab.value)"
      >
        {{ tab.label }}
      </SharedButton>
    </div>

    <!-- ── Search input ───────────────────────────────────────────────────── -->
    <div class="relative flex-1">
      <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />

      <Input
        ref="searchInput"
        :model-value="search"
        :placeholder="placeholder"
        class="h-8 rounded-xl border-white/[0.06] bg-white/[0.02] pl-8 text-xs text-zinc-300 placeholder:text-zinc-700 transition-all duration-150 focus:border-white/[0.1] focus:ring-white/[0.05]"
        :class="search.length > 0 ? 'pr-8' : 'pr-16'"
        @update:model-value="emit('update:search', $event as string)"
      />

      <!-- Clear button -->
      <SharedButton
        v-if="search.length > 0"
        variant="ghost"
        class="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 p-0 text-zinc-600 hover:bg-transparent hover:text-zinc-300"
        @click="emit('update:search', '')"
      >
        <X class="h-3 w-3" />
      </SharedButton>

      <!-- Ctrl+F hint (hidden when there's text or filters panel is open) -->
      <template v-else-if="!open">
        <TooltipProvider :delay-duration="300">
          <Tooltip>
            <TooltipTrigger as-child>
              <KbdGroup class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-40">
                <Kbd class="h-4 px-1 text-[9px] leading-none">Ctrl</Kbd>
                <Kbd class="h-4 px-1 text-[9px] leading-none">F</Kbd>
              </KbdGroup>
            </TooltipTrigger>
            <TooltipContent side="bottom" class="text-xs">
              Focus search
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </template>
    </div>

    <!-- ── Advanced filters toggle ────────────────────────────────────────── -->
    <Collapsible v-if="hasFilters" v-model:open="open" class="relative">
      <CollapsibleTrigger as-child>
        <SharedButton
          variant="outline"
          size="icon"
          class="h-8 w-8 shrink-0 rounded-xl border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:text-zinc-300"
          :class="anyFilterActive
            ? 'border-indigo-500/40 text-indigo-400'
            : 'text-zinc-500'"
        >
          <SlidersHorizontal class="h-3.5 w-3.5" />
        </SharedButton>
      </CollapsibleTrigger>

      <!-- ── Filter panel ──────────────────────────────────────────────────── -->
      <CollapsibleContent
        class="absolute right-0 z-10 mt-1.5 w-64 rounded-xl border border-white/[0.08] bg-[#0c0c0e] p-4 shadow-2xl shadow-black/50"
      >
        <div class="flex flex-col gap-4">

          <template v-for="(group, gi) in filterGroups" :key="group.label">
            <!-- Separator between groups -->
            <Separator v-if="gi > 0" class="bg-white/[0.06]" />

            <!-- Group -->
            <div>
              <p class="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                {{ group.label }}
              </p>
              <div class="flex flex-col gap-2">
                <div
                  v-for="opt in group.options"
                  :key="opt.value"
                  class="flex cursor-pointer items-center gap-2.5"
                  @click="group.onToggle(opt.value)"
                >
                  <Checkbox
                    :id="`filter-${group.label}-${opt.value}`"
                    :checked="group.active.includes(opt.value)"
                  />
                  <span class="flex select-none items-center gap-1.5 text-xs text-zinc-300">
                    <span
                      v-if="opt.dotClass"
                      :class="['h-1.5 w-1.5 rounded-full', opt.dotClass]"
                    />
                    {{ opt.label }}
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- Active chips -->
          <template v-if="activeChips && activeChips.length > 0">
            <Separator class="bg-white/[0.06]" />
            <div class="flex flex-wrap gap-1">
              <Badge
                v-for="(chip, ci) in activeChips"
                :key="ci"
                variant="outline"
                class="gap-1 rounded-full border-white/[0.08] bg-white/[0.03] py-0 font-mono text-[10px] capitalize text-zinc-300 hover:bg-white/[0.06]"
              >
                {{ chip.label }}
                <button
                  class="ml-0.5 text-zinc-600 transition-colors hover:text-red-400"
                  @click.stop="chip.onRemove()"
                >
                  <X class="h-2.5 w-2.5" />
                </button>
              </Badge>
            </div>
          </template>

          <!-- Reset button -->
          <Separator class="bg-white/[0.06]" />
          <SharedButton
            variant="ghost"
            size="sm"
            class="w-full text-xs text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300"
            :disabled="!hasActiveFilters"
            @click="emit('reset')"
          >
            <X class="mr-1.5 h-3 w-3" />
            Reset filters
          </SharedButton>

        </div>
      </CollapsibleContent>
    </Collapsible>

  </div>
</template>