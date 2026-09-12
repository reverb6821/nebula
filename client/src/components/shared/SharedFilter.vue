<script setup lang="ts" generic="TTab extends string = string, TFilter extends string = string">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, X, SlidersHorizontal } from '@lucide/vue'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
  /** Optional colored dot class (e.g. 'bg-success') */
  dotClass?: string
}

export interface FilterGroup<T extends string = string> {
  label: string
  options: FilterOption<T>[]
  active: T[]
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
  search: string
  placeholder?: string
  tabs?: TabOption<TTab>[]
  activeTab?: TTab
  filterGroups?: FilterGroup<TFilter>[]
  activeChips?: ActiveChip[]
  hasActiveFilters?: boolean
}>(), {
  placeholder: 'Cerca…',
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

<template lang="pug">
div(class="flex items-center gap-2")

  //- ── Optional tabs ──────────────────────────────────────────────────────
  div(
    v-if="tabs && tabs.length"
    class="flex rounded-md border border-border bg-card p-0.5"
  )
    SharedButton(
      v-for="tab in tabs"
      :key="tab.value"
      variant="outline"
      class="rounded-sm px-3 py-1.5 text-xs font-medium capitalize transition-all duration-150 border-transparent"
      :class="activeTab === tab.value ? 'bg-primary/15 text-foreground border-primary/40' : 'text-muted-foreground hover:text-foreground'"
      @click="emit('update:activeTab', tab.value)"
    ) {{ tab.label }}

  //- ── Search input ───────────────────────────────────────────────────────
  div(class="relative flex-1")
    Search(
      class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60"
      aria-hidden="true"
    )

    Input(
      ref="searchInput"
      :model-value="search"
      :placeholder="placeholder"
      aria-label="Cerca"
      class="h-8 rounded-md border-border bg-card pl-8 text-xs text-foreground placeholder:text-muted-foreground/60 transition-all duration-150 focus:border-primary/40 focus:ring-ring"
      :class="search.length > 0 ? 'pr-8' : 'pr-16'"
      @update:model-value="emit('update:search', $event as string)"
    )

    //- Clear button
    SharedButton(
      v-if="search.length > 0"
      variant="ghost"
      aria-label="Cancella ricerca"
      class="absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 p-0 text-muted-foreground/60 hover:bg-transparent hover:text-foreground before:absolute before:-inset-[13px] before:content-['']"
      @click="emit('update:search', '')"
    )
      X(class="h-3 w-3" aria-hidden="true")

    //- Ctrl+F hint (hidden when there's text or filters panel is open)
    template(v-else-if="!open")
      TooltipProvider(:delay-duration="300")
        Tooltip
          TooltipTrigger(as-child)
            KbdGroup(class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-40")
              Kbd(class="h-4 px-1 text-[9px] leading-none") Ctrl
              Kbd(class="h-4 px-1 text-[9px] leading-none") F
          TooltipContent(side="bottom" class="text-xs") Vai alla ricerca

  //-
    ── Advanced filters toggle ──────────────────────────────────────────
    Popover invece di Collapsible: PopoverContent viene teleportato (Portal)
    dentro <body>, uscendo completamente da qualsiasi ancestor con
    overflow-hidden (come SidebarProvider/SidebarInset in AppLayout).
    Collapsible invece renderizza inline nel DOM — se un ancestor ha
    overflow-hidden, il pannello si "apre" ma resta invisibile perché
    clippato, senza alcun errore in console.
  Popover(v-if="hasFilters" v-model:open="open")
    PopoverTrigger(
      aria-label="Filtri avanzati"
      class="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background before:absolute before:-inset-[6px] before:content-['']"
      :class="anyFilterActive ? 'border-primary/40 text-primary' : 'text-muted-foreground hover:text-foreground'"
    )
      SlidersHorizontal(class="h-3.5 w-3.5" aria-hidden="true")

    //- ── Filter panel (contenitore → rounded.lg 16px) ─────────────────────
    PopoverContent(
      align="end"
      :side-offset="6"
      class="w-64 rounded-lg border border-border bg-popover p-4 shadow-2xl shadow-black/50"
    )
      div(class="flex flex-col gap-4")

        template(v-for="(group, gi) in filterGroups" :key="group.label")
          Separator(v-if="gi > 0" class="bg-border")

          div
            p(class="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70") {{ group.label }}
            div(class="flex flex-col gap-2")
              label(
                v-for="opt in group.options"
                :key="opt.value"
                class="flex cursor-pointer items-center gap-2.5"
              )
                Checkbox(
                  :id="`filter-${group.label}-${opt.value}`"
                  :model-value="group.active.includes(opt.value)"
                  @update:model-value="group.onToggle(opt.value)"
                )
                span(class="flex select-none items-center gap-1.5 text-xs text-foreground")
                  span(
                    v-if="opt.dotClass"
                    :class="['h-1.5 w-1.5 rounded-full', opt.dotClass]"
                    aria-hidden="true"
                  )
                  | {{ opt.label }}

        //- Active chips
        template(v-if="activeChips && activeChips.length > 0")
          Separator(class="bg-border")
          div(class="flex flex-wrap gap-1")
            Badge(
              v-for="(chip, ci) in activeChips"
              :key="ci"
              variant="outline"
              class="gap-1 rounded-full border-border bg-accent py-0 font-mono text-[10px] capitalize text-foreground hover:bg-secondary"
            )
              | {{ chip.label }}
              button(
                type="button"
                class="relative ml-0.5 text-muted-foreground/70 transition-colors hover:text-destructive before:absolute before:-inset-2 before:content-['']"
                :aria-label="`Rimuovi filtro ${chip.label}`"
                @click.stop="chip.onRemove()"
              )
                X(class="h-2.5 w-2.5" aria-hidden="true")

        //- Reset button
        Separator(class="bg-border")
        SharedButton(
          variant="ghost"
          size="sm"
          class="w-full text-xs text-muted-foreground/70 hover:bg-accent hover:text-foreground"
          :disabled="!hasActiveFilters"
          @click="emit('reset')"
        )
          X(class="mr-1.5 h-3 w-3" aria-hidden="true")
          | Azzera filtri
</template>