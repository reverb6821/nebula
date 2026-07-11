<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

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
</script>

<template>
  <div class="flex items-center space-x-2">
    <Switch
      :id="id"
      :checked="modelValue"
      :disabled="disabled"
      class="
        data-[state=unchecked]:bg-zinc-700
        data-[state=checked]:bg-indigo-500
        data-[disabled]:opacity-40
        data-[disabled]:cursor-not-allowed
      "
      @update:checked="emit('update:modelValue', $event)"
    />
    <Label :for="id" class="cursor-pointer">
      <slot />
    </Label>
  </div>
</template>