<script setup lang="ts" generic="T extends string, O extends { value: T; label: string }">
import { cn } from '@/lib/utils'

defineProps<{
  options: O[]
  modelValue: T
  vertical?: boolean
  ariaLabelledby?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()

function moveSelection(event: KeyboardEvent, currentValue: T, options: O[]) {
  const index = options.findIndex((option) => option.value === currentValue)
  if (index < 0 || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return

  event.preventDefault()
  const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1
  const next = options[(index + direction + options.length) % options.length]
  if (next) emit('update:modelValue', next.value)
}
</script>

<template lang="pug">
div(
  role="radiogroup"
  :aria-labelledby="ariaLabelledby"
  :class="cn('flex flex-wrap gap-0.5 rounded-[10px] bg-white/5 p-[3px]', vertical && 'flex-col flex-nowrap')"
)
  button(
    v-for="opt in options"
    :key="opt.value"
    type="button"
    role="radio"
    :aria-checked="modelValue === opt.value"
    :tabindex="modelValue === opt.value ? 0 : -1"
    :class="cn('min-h-9 rounded-[7px] px-3.5 text-13 font-semibold transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50', modelValue === opt.value ? 'bg-white/15 text-white' : 'text-group-foreground hover:bg-white/6')"
    @click="emit('update:modelValue', opt.value)"
    @keydown="moveSelection($event, modelValue, options)"
  )
    slot(:option="opt") {{ opt.label }}
</template>