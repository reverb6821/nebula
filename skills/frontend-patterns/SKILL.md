---
name: frontend-patterns
description: Frontend development patterns for Vue 3, Pinia, Pinia Colada, Shadcn Vue, Tailwind CSS, and performance optimization.
---

# Vue 3 Frontend Development Patterns

Modern frontend patterns for Vue 3 using Composition API, Pinia, Pinia Colada, Shadcn Vue, and Tailwind CSS.

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

<template>
  <div :class="cn('rounded-xl border bg-card text-card-foreground shadow-sm', props.class)">
    <slot />
  </div>
</template>

<!-- Usage -->
<template>
  <Card class="max-w-md p-4">
    <CardHeader>
      <CardTitle>Market Overview</CardTitle>
    </CardHeader>
    <CardContent>
      <p class="text-sm text-muted-foreground">Market details here...</p>
    </CardContent>
  </Card>
</template>
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

<template>
  <div class="w-full">
    <slot />
  </div>
</template>

<!-- Tab.vue -->
<script setup lang="ts">
import { inject } from 'vue'

const props = defineProps<{ id: string }>()
const context = inject<{ activeTab: any; selectTab: (id: string) => void }>('tabsContext')

if (!context) throw new Error('Tab must be used within Tabs')
</script>

<template>
  <button
    :class="[
      'px-4 py-2 text-sm font-medium transition-colors',
      context.activeTab.value === id 
        ? 'border-b-2 border-primary text-primary' 
        : 'text-muted-foreground hover:text-foreground'
    ]"
    @click="context.selectTab(id)"
  >
    <slot />
  </button>
</template>
```

## Composables Patterns

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

## Data Fetching with Pinia Colada

### Query Pattern for Server State

```typescript
// composables/useMarketQuery.ts
import { useQuery } from '@pinia/colada'

export interface Market {
  id: string
  name: string
  volume: number
}

export function useMarketsQuery() {
  return useQuery({
    key: ['markets'],
    query: async () => {
      const res = await fetch('/api/markets')
      if (!res.ok) throw new Error('Failed to fetch markets')
      return res.json() as Promise<Market[]>
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
```

### Mutation Pattern with Cache Invalidation

```typescript
// composables/useCreateMarketMutation.ts
import { useMutation, useQueryCache } from '@pinia/colada'

export function useCreateMarketMutation() {
  const queryCache = useQueryCache()

  return useMutation({
    mutation: async (newMarket: { name: string; volume: number }) => {
      const res = await fetch('/api/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMarket)
      })
      return res.json()
    },
    onSuccess: () => {
      // Invalida e rifetch delle query correlate
      queryCache.invalidateQueries({ key: ['markets'] })
    }
  })
}
```

## Client State Management with Pinia

### Setup Store Pattern

```typescript
// stores/useMarketStore.ts
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

<template>
  <div ref="parentRef" class="h-[500px] overflow-auto border rounded-md">
    <div
      :style="{ height: `${rowVirtualizer.getTotalSize()}px` }"
      class="w-full relative"
    >
      <div
        v-for="virtualRow in rowVirtualizer.getVirtualItems()"
        :key="virtualRow.key"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`
        }"
        class="p-3 border-b flex justify-between items-center"
      >
        <span>{{ sortedMarkets[virtualRow.index].name }}</span>
        <span class="font-mono text-sm">{{ sortedMarkets[virtualRow.index].volume }}</span>
      </div>
    </div>
  </div>
</template>
```

### Async Components & Suspense

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// Lazy loading componenti pesanti
const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))
</script>

<template>
  <div class="space-y-4">
    <Suspense>
      <template #default>
        <HeavyChart />
      </template>
      <template #fallback>
        <div class="h-64 w-full animate-pulse bg-muted rounded-lg" />
      </template>
    </Suspense>
  </div>
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
  console.log('Form submitted:', values)
})
</script>

<template>
  <form @submit="onSubmit" class="space-y-4">
    <FormField name="name" v-slot="{ componentField }">
      <FormItem>
        <FormLabel>Market Name</FormLabel>
        <FormControl>
          <Input placeholder="Enter market name" type="text" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <Button type="submit">Create Market</Button>
  </form>
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

<template>
  <div v-if="error" class="p-4 rounded-lg bg-destructive/10 text-destructive space-y-2">
    <h3 class="font-semibold text-lg">Something went wrong</h3>
    <p class="text-sm">{{ error.message }}</p>
    <button 
      @click="reset" 
      class="px-3 py-1 bg-destructive text-destructive-foreground rounded-md text-sm"
    >
      Try again
    </button>
  </div>
  <slot v-else />
</template>
```

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

<template>
  <div
    role="combobox"
    :aria-expanded="isOpen"
    aria-haspopup="listbox"
    tabindex="0"
    @keydown="handleKeyDown"
    class="relative outline-none"
  >
    <button @click="isOpen = !isOpen" class="w-full border rounded-md p-2 text-left">
      Select Option
    </button>

    <ul 
      v-if="isOpen" 
      role="listbox" 
      class="absolute left-0 mt-1 w-full border bg-popover rounded-md shadow-md z-10"
    >
      <li
        v-for="(option, index) in options"
        :key="option"
        role="option"
        :aria-selected="activeIndex === index"
        :class="[
          'p-2 cursor-pointer text-sm',
          activeIndex === index ? 'bg-accent text-accent-foreground' : ''
        ]"
        @click="emit('select', option)"
      >
        {{ option }}
      </li>
    </ul>
  </div>
</template>
```

**Remember**: Modern Vue 3 patterns lean heavily on Script Setup, Pinia/Pinia Colada for robust client & async state management, Tailwind for utility-first styling, and Shadcn Vue for accessible component primitives.
