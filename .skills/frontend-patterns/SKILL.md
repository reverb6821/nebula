---
name: frontend-patterns
description: Frontend development patterns for Vue 3 (Composition API + Pug templates), Pinia, Pinia Colada, Shadcn Vue, and Tailwind CSS in the Nebula Dock client — component composition, Neutralino IPC data fetching, module-scoped state, the shared page header/filter pattern, performance, forms, error handling, accessibility, and testing scope.
---

# Vue 3 Frontend Development Patterns (Nebula Dock)

Modern frontend patterns for Vue 3 using Composition API, Pinia, Pinia Colada, Shadcn Vue, and Tailwind CSS — adapted to this client's conventions. See `client/CLAUDE.md` for the full ruleset; the highlights that shape every example below:

- All templates use **Pug** (`<template lang="pug">`), never plain HTML.
- Native/OS access never touches `@neutralinojs/lib` directly — it goes through the `useNeutralinoCmd` composable (`runCmd` / `spawnStream`), guarded by `window.NL_PORT`.
- Code that is generic/reusable lives in `src/{components,composables,stores}`; code specific to one flow lives in `src/modules/<flow>/{components,composables,utils,views,store.ts}`.
- Pinia stores use the **setup store** syntax and are read with `storeToRefs`.
- No emojis, no stray `console.log` (use `console.debug` for mocks only), no direct mutation of nested reactive state.

## Component Patterns

### Composition & Slots (Shadcn Vue Approach)

```vue
<!-- Card.vue -->
<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template lang="pug">
div(:class="cn('rounded-xl border bg-card text-card-foreground shadow-sm', props.class)")
  slot
</template>
```

```pug
//- Usage
Card(class="max-w-md p-4")
  CardHeader
    CardTitle Market Overview
  CardContent
    p(class="text-sm text-muted-foreground") Market details here...
```

### Compound Components with Provide / Inject

```vue
<!-- Tabs.vue -->
<script setup lang="ts">
import { ref, provide, readonly } from 'vue'

const props = defineProps<{ defaultValue: string }>()
const activeTab = ref(props.defaultValue)

const selectTab = (tab: string) => {
  activeTab.value = tab
}

provide('tabsContext', {
  activeTab: readonly(activeTab),
  selectTab
})
</script>

<template lang="pug">
div(class="w-full")
  slot
</template>
```

```vue
<!-- Tab.vue -->
<script setup lang="ts">
import { inject } from 'vue'

const props = defineProps<{ id: string }>()
const context = inject<{ activeTab: any; selectTab: (id: string) => void }>('tabsContext')

if (!context) throw new Error('Tab must be used within Tabs')
</script>

<template lang="pug">
button(
  :class="[context.activeTab.value === id ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground', 'px-4 py-2 text-sm font-medium transition-colors']"
  @click="context.selectTab(id)"
)
  slot
</template>
```

Compound components like this are generic UI primitives — they belong in `src/components/shared`, not inside a `modules/<flow>/components` folder, unless a flow needs a one-off variant nobody else will reuse.

## Composables Patterns

Generic, flow-agnostic composables (like the two below) live in `src/composables`. A composable that only makes sense for one flow (e.g. parsing `docker ps` output) belongs in `modules/<flow>/composables` instead.

### State Toggle Composable

```typescript
// composables/useToggle.ts
import { ref } from 'vue'

export function useToggle(initialValue = false) {
  const value = ref(initialValue)
  const toggle = () => {
    value.value = !value.value
  }

  return [value, toggle] as const
}
```

### Debounce Value Composable

```typescript
// composables/useDebouncedRef.ts
import { ref, watch, type Ref } from 'vue'

export function useDebouncedRef<T>(source: Ref<T>, delay = 300) {
  const debouncedValue = ref(source.value) as Ref<T>
  let timeout: ReturnType<typeof setTimeout>

  watch(source, (newValue) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  })

  return debouncedValue
}
```

Prefer `refDebounced` from `@vueuse/core` for search/filter inputs where available (per `client/CLAUDE.md`) — write a custom debounce composable like the one above only when you need behavior VueUse doesn't offer.

## Data Fetching with Pinia Colada + Neutralino IPC

This client has no REST backend — "server state" here means data read from the OS/Docker through Neutralino. Wrap `useNeutralinoCmd` calls in Pinia Colada queries/mutations instead of `fetch`, so you still get caching, staleness, and invalidation for data that's expensive to re-read (e.g. shelling out to `docker`).

### Query Pattern over `runCmd`

```typescript
// modules/docker/composables/useContainersQuery.ts
import { useQuery } from '@pinia/colada'
import { runCmd } from '@/composables/useNeutralinoCmd'

export interface Container {
  id: string
  name: string
  status: string
}

export function useContainersQuery() {
  return useQuery({
    key: ['docker', 'containers'],
    query: async () => {
      const result = await runCmd('docker ps -a --format "{{json .}}"')
      if (result.exitCode !== 0) throw new Error(result.stderr || 'Failed to list containers')
      return result.stdout
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Container)
    },
    staleTime: 1000 * 10, // 10s: cheap enough to refresh often, still avoids refetch storms
  })
}
```

### Mutation Pattern with Cache Invalidation

```typescript
// modules/docker/composables/useStopContainerMutation.ts
import { useMutation, useQueryCache } from '@pinia/colada'
import { runCmd } from '@/composables/useNeutralinoCmd'

export function useStopContainerMutation() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (containerId: string) => {
      const result = await runCmd(`docker stop ${containerId}`)
      if (result.exitCode !== 0) throw new Error(result.stderr || 'Failed to stop container')
      return result
    },
    onSuccess: () => {
      queryCache.invalidateQueries({ key: ['docker', 'containers'] })
    },
  })
}
```

For truly continuous/live data (e.g. a resource monitor that must stream, not poll), prefer `spawnStream` inside a module composable over a Colada query — see `client/CLAUDE.md` § IPC Execution.

## Client State Management with Pinia

### Setup Store Pattern

```typescript
// modules/docker/store.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Market {
  id: string
  name: string
  volume: number
}

export const useMarketStore = defineStore('market', () => {
  // State
  const selectedMarket = ref<Market | null>(null)
  const filterQuery = ref('')

  // Getters
  const isSelected = computed(() => (id: string) => selectedMarket.value?.id === id)

  // Actions
  function selectMarket(market: Market) {
    selectedMarket.value = market
  }

  function clearSelection() {
    selectedMarket.value = null
  }

  return {
    selectedMarket,
    filterQuery,
    isSelected,
    selectMarket,
    clearSelection
  }
})
```

Read it in components with `storeToRefs`, never by destructuring the store directly:

```typescript
import { storeToRefs } from 'pinia'

const store = useMarketStore()
const { selectedMarket, filterQuery } = storeToRefs(store)
```

### Search Filters in the Page Header (`usePageHeader`)

A flow's filter control renders inside the shared app header, not inline in the view body. The view owns `setHeader`/`clearHeader`; the filter component itself stays a dumb props-in/events-out component so it also works inline elsewhere.

```typescript
// modules/docker/views/DockerView.vue (script setup, excerpt)
import { storeToRefs } from 'pinia'
import { usePageHeader } from '@/composables/usePageHeader'
import { useMarketStore } from '../store'
import DockerFilters from '../components/DockerFilters.vue'

const store = useMarketStore()
const { filterQuery } = storeToRefs(store)
const { setHeader, clearHeader } = usePageHeader()

function syncHeader() {
  setHeader({
    title: 'Docker',
    toolsComponent: DockerFilters,
    toolsProps: {
      modelValue: filterQuery.value,
      'onUpdate:modelValue': (value: string) => { filterQuery.value = value },
    },
  })
}

onMounted(syncHeader)
onUnmounted(clearHeader)
watch(filterQuery, syncHeader)
```

`toolsProps` is spread with `v-bind` in the header, so `onUpdate:xxx` keys work as real event listeners — no need to make the filter component read the store directly.

## Performance Optimization

### Computed Properties & Virtualization

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'

const props = defineProps<{ markets: Market[] }>()

// Computazione memoizzata automatica con computed
const sortedMarkets = computed(() => {
  return [...props.markets].sort((a, b) => b.volume - a.volume)
})

const parentRef = ref<HTMLElement | null>(null)

const rowVirtualizer = useVirtualizer({
  count: sortedMarkets.value.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 64,
  overscan: 5,
})
</script>

<template lang="pug">
div(ref="parentRef" class="h-[500px] overflow-auto border rounded-md")
  div(:style="{ height: `${rowVirtualizer.getTotalSize()}px` }" class="w-full relative")
    div(
      v-for="virtualRow in rowVirtualizer.getVirtualItems()"
      :key="virtualRow.key"
      :style="{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }"
      class="p-3 border-b flex justify-between items-center"
    )
      span {{ sortedMarkets[virtualRow.index].name }}
      span(class="font-mono text-sm") {{ sortedMarkets[virtualRow.index].volume }}
</template>
```

For long lists inside a panel, prefer this over a plain `v-for` + `ScrollArea` once the list regularly holds hundreds of rows (e.g. process lists, container logs); for typical alert/container counts, `ScrollArea` alone (see `client/CLAUDE.md`) is enough and simpler.

### Async Components & Suspense

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// Lazy loading componenti pesanti
const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))
</script>

<template lang="pug">
div(class="space-y-4")
  Suspense
    template(#default)
      HeavyChart
    template(#fallback)
      div(class="h-64 w-full animate-pulse bg-muted rounded-lg")
</template>
```

## Form Handling & Validation

### Vee-Validate + Zod + Shadcn Vue

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const formSchema = toTypedSchema(
  z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(200),
    endDate: z.string().nonempty('End date is required')
  })
)

const form = useForm({
  validationSchema: formSchema,
})

const onSubmit = form.handleSubmit((values) => {
  console.debug('Form submitted:', values)
})
</script>

<template lang="pug">
form(@submit="onSubmit" class="space-y-4")
  FormField(name="name" v-slot="{ componentField }")
    FormItem
      FormLabel Market Name
      FormControl
        Input(placeholder="Enter market name" type="text" v-bind="componentField")
      FormMessage

  Button(type="submit") Create Market
</template>
```

## Error Handling

### Error Boundary Component

```vue
<!-- ErrorBoundary.vue -->
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err as Error
  return false // Intercetta l'errore ed evita che si propaghi oltre
})

const reset = () => {
  error.value = null
}
</script>

<template lang="pug">
div(v-if="error" class="p-4 rounded-lg bg-destructive/10 text-destructive space-y-2")
  h3(class="font-semibold text-lg") Something went wrong
  p(class="text-sm") {{ error.message }}
  button(
    @click="reset"
    class="px-3 py-1 bg-destructive text-destructive-foreground rounded-md text-sm"
  ) Try again
slot(v-else)
</template>
```

For IPC-triggered failures (a `runCmd`/`spawnStream` call rejecting), prefer surfacing the error through the flow's store (`error` ref) and a `SharedAlert`, as in `AlertList`/`AlertsView`, rather than an `onErrorCaptured` boundary — the boundary is for unexpected render-time exceptions, not expected IPC failures.

## Accessibility & Keyboard Navigation

```vue
<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ options: string[] }>()
const emit = defineEmits<{(e: 'select', value: string): void}>()

const isOpen = ref(false)
const activeIndex = ref(0)

const handleKeyDown = (e: KeyboardEvent) => {
  if (!isOpen.value) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeIndex.value = Math.min(activeIndex.value + 1, props.options.length - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      activeIndex.value = Math.max(activeIndex.value - 1, 0)
      break
    case 'Enter':
      e.preventDefault()
      emit('select', props.options[activeIndex.value])
      isOpen.value = false
      break
    case 'Escape':
      isOpen.value = false
      break
  }
}
</script>

<template lang="pug">
div(
  role="combobox"
  :aria-expanded="isOpen"
  aria-haspopup="listbox"
  tabindex="0"
  @keydown="handleKeyDown"
  class="relative outline-none"
)
  button(@click="isOpen = !isOpen" class="w-full border rounded-md p-2 text-left") Select Option

  ul(
    v-if="isOpen"
    role="listbox"
    class="absolute left-0 mt-1 w-full border bg-popover rounded-md shadow-md z-10"
  )
    li(
      v-for="(option, index) in options"
      :key="option"
      role="option"
      :aria-selected="activeIndex === index"
      :class="[activeIndex === index ? 'bg-accent text-accent-foreground' : '', 'p-2 cursor-pointer text-sm']"
      @click="emit('select', option)"
    ) {{ option }}
</template>
```

## Testing Scope

Not every pattern above needs a test. Per `client/CLAUDE.md`:

- **Skip tests** for pure composition/slot wrappers (e.g. `Card`, `Tabs`/`Tab` as shown above) — no branching logic to break.
- **Unit test (Vitest)** anything with real logic: keyboard-navigation state machines, Colada query/mutation composables that parse IPC output (e.g. the `docker ps` JSON parsing above), store getters/actions with non-trivial logic, virtualization index math.
- **E2E test (Playwright)** critical flows end-to-end (e.g. stopping a container, acknowledging an alert), not every form or dialog.
- Place unit tests next to the flow they belong to (`modules/<flow>/__tests__`) or in `src/__tests__` for global code.

**Remember**: Modern Vue 3 patterns in this client lean on Script Setup + Pug templates, Pinia/Pinia Colada wrapping `useNeutralinoCmd` for state and IPC, Tailwind for utility-first styling, Shadcn Vue for accessible primitives, and `usePageHeader` for surfacing per-flow filters in the shared header.