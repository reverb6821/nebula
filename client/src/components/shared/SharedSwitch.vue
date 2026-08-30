<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    id?: string
    disabled?: boolean
    /** Necessario per l'accessibilità quando non si passa lo slot di default (label visibile) */
    ariaLabel?: string
  }>(),
  {
    modelValue: false,
    id: () => `switch-${Math.random().toString(36).substring(2, 9)}`,
    disabled: false,
    ariaLabel: undefined,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div class="flex items-center space-x-2">
    <button
      type="button"
      role="switch"
      :id="id"
      :aria-checked="modelValue"
      :aria-label="!$slots.default ? ariaLabel : undefined"
      :disabled="disabled"
      class="relative inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full
        border border-transparent transition-colors duration-200 ease-in-out outline-none
        focus-visible:ring-2 focus-visible:ring-ring
        focus-visible:ring-offset-2 focus-visible:ring-offset-background
        disabled:cursor-not-allowed disabled:opacity-50
        before:absolute before:-inset-[13px] before:content-['']"
      :class="modelValue ? 'bg-primary' : 'bg-secondary'"
      @click="toggle"
    >
      <!--
        before:-inset-[13px] porta l'area cliccabile reale a ~44x44px
        (18.4px di traccia + 13px per lato) senza alterare l'aspetto
        visivo del pulsante — vedi ui-ux-pro-max, priorità 2: touch
        target minimo 44x44px.
      -->
      <span
        class="pointer-events-none block size-4 rounded-full bg-primary-foreground shadow ring-0 transition-transform duration-200 ease-in-out"
        :class="modelValue ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'"
      />
    </button>
    <label
      v-if="$slots.default"
      :for="id"
      class="cursor-pointer text-sm select-none text-foreground"
    >
      <slot />
    </label>
  </div>
</template>