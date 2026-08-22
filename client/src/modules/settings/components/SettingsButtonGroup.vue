<script setup lang="ts" generic="T extends string, O extends { value: T; label: string }">
import { cn } from '@/lib/utils'
import { SharedButton } from '@/components/shared'

defineProps<{
  options: O[]
  modelValue: T
  vertical?: boolean
  /** id della label esterna (da SettingsRow) per aria-labelledby sul gruppo */
  ariaLabelledby?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: T]
}>()
</script>

<template>
  <!--
    Era un semplice mucchio di bottoni senza semantica di gruppo: per
    uno screen reader indistinguibile da bottoni indipendenti. È in
    realtà un radiogroup (scelta singola tra opzioni mutuamente
    esclusive), quindi role="radiogroup"/"radio" + aria-checked, con
    aria-labelledby che lo collega alla label visibile in SettingsRow.
  -->
  <div
    role="radiogroup"
    :aria-labelledby="ariaLabelledby"
    :class="cn('flex gap-1.5', vertical && 'flex-col')"
  >
    <SharedButton
      v-for="opt in options"
      :key="opt.value"
      variant="outline"
      role="radio"
      :aria-checked="modelValue === opt.value"
      :class="cn(
        'border px-3 py-1.5 text-left text-xs transition-colors rounded-md',
        modelValue === opt.value
          ? 'border-primary/40 bg-primary/10 text-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-ring/40 hover:text-foreground',
      )"
      @click="emit('update:modelValue', opt.value)"
    >
      <slot :option="opt">{{ opt.label }}</slot>
    </SharedButton>
  </div>
</template>