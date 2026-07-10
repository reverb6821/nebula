<script setup lang="ts">
import { computed } from 'vue'
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

const checked = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<template>
  <div class="flex items-center space-x-2">
    <Switch
      :id="id"
      v-model:checked="checked"
      :disabled="disabled"
    />
    <Label :for="id" class="cursor-pointer">
      <!-- Slot per permettere sia testo semplice che HTML personalizzato -->
      <slot />
    </Label>
  </div>
</template>