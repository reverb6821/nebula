<script setup lang="ts" generic="T extends string, O extends { value: T; label: string }">
import { cn } from '@/lib/utils'
import { SharedButton } from '@/components/shared'

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
  :class="cn('flex w-full flex-wrap gap-1.5 sm:w-auto', vertical && 'flex-col flex-nowrap')"
)
  SharedButton(
    v-for="opt in options"
    :key="opt.value"
    type="button"
    variant="outline"
    role="radio"
    :aria-checked="modelValue === opt.value"
    :tabindex="modelValue === opt.value ? 0 : -1"
    :class="cn('min-w-0 flex-1 border px-3 py-1.5 text-left text-xs transition-colors rounded-md active:scale-[0.98] sm:flex-none', modelValue === opt.value ? 'border-primary/40 bg-primary/10 text-foreground shadow-cyber-signal' : 'border-border bg-card text-muted-foreground hover:border-ring/40 hover:text-foreground')"
    @click="emit('update:modelValue', opt.value)"
    @keydown="moveSelection($event, modelValue, options)"
  )
    slot(:option="opt") {{ opt.label }}
</template>