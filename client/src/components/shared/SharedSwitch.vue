<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    id?: string
    disabled?: boolean
  }>(),
  {
    modelValue: false,
    id: () => `switch-${Math.random().toString(36).substring(2, 9)}`,
    disabled: false,
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
      :disabled="disabled"
      class="relative inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
      :class="modelValue ? 'bg-zinc-800' : 'bg-zinc-600'"
      @click="toggle"
    >
      <span
        class="pointer-events-none block size-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
        :class="modelValue ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'"
      />
    </button>
    <label
      v-if="$slots.default"
      :for="id"
      class="cursor-pointer text-sm select-none"
    >
      <slot />
    </label>
  </div>
</template>