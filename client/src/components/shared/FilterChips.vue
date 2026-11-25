<script setup lang="ts" generic="T extends string">
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

export interface FilterChip<V extends string = string> {
  value: V
  label: string
  count?: number
  tone?: 'default' | 'destructive'
}

// Chip a pillola (36px, raggio 18px). type="single" restituisce un valore,
// type="multiple" un array: il componente resta dumb (props in, eventi out).
const props = withDefaults(defineProps<{
  items: FilterChip<T>[]
  modelValue: T | T[]
  type?: 'single' | 'multiple'
  label: string
}>(), { type: 'single' })

const emit = defineEmits<{ 'update:modelValue': [value: T | T[]] }>()

function onUpdate(value: unknown) {
  if (props.type === 'single') {
    // ToggleGroup single permette di deselezionare: in quel caso si
    // mantiene il valore corrente (un chip e' sempre selezionato).
    if (typeof value === 'string' && value) emit('update:modelValue', value as T)
    return
  }
  emit('update:modelValue', (Array.isArray(value) ? value : []) as T[])
}
</script>

<template lang="pug">
ToggleGroup(
  :type="type"
  :model-value="modelValue"
  :aria-label="label"
  class="flex flex-wrap gap-2"
  @update:model-value="onUpdate"
)
  ToggleGroupItem(
    v-for="item in items"
    :key="item.value"
    :value="item.value"
    :class="cn('min-h-9 rounded-[18px]! bg-white/7 px-3.5 text-13 font-medium text-[#e4e4e7] hover:bg-white/12 hover:text-[#e4e4e7] data-[state=on]:bg-primary-soft data-[state=on]:text-white', item.tone === 'destructive' && 'text-[#ffb3ad] hover:text-[#ffb3ad]')"
  )
    | {{ item.label }}
    span(
      v-if="item.count !== undefined"
      class="font-mono text-muted-foreground in-data-[state=on]:text-[#dcdce0]"
    ) {{ item.count }}
</template>
