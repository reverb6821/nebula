<script setup lang="ts" generic="T extends string, O extends { value: T; label: string }">
import { cn } from '@/lib/utils'
import { SharedButton } from '@/components/shared'

defineProps<{
  options: O[]
  modelValue: T
  vertical?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<template>
  <div :class="cn('flex gap-1.5', vertical && 'flex-col')">
    <SharedButton
    variant="outline"
      v-for="opt in options"
      :key="opt.value"
      :class="cn(
        'border px-3 py-1.5 text-left text-xs transition-colors',
        modelValue === opt.value
          ? 'border-zinc-500/50 bg-zinc-500/10 text-zinc-300'
          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
      )"
      @click="emit('update:modelValue', opt.value)"
    >
      <slot :option="opt">{{ opt.label }}</slot>
    </SharedButton>
  </div>
</template>