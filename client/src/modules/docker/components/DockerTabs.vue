<script setup lang="ts">
import { Box, Layers } from '@lucide/vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Tabs Containers / Images al posto del titolo nell'header (dumb:
// pilotato da props via usePageHeader.titleProps).
type DockerTab = 'containers' | 'images'

defineProps<{
  modelValue: DockerTab
  containersLabel: string
  imagesLabel: string
  label: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: DockerTab] }>()

function onUpdate(value: string | number) {
  if (value === 'containers' || value === 'images') emit('update:modelValue', value)
}
</script>

<template lang="pug">
Tabs(:model-value="modelValue" @update:model-value="onUpdate")
  TabsList(:aria-label="label" class="h-auto gap-1 bg-transparent p-0")
    TabsTrigger(
      value="containers"
      class="min-h-10 flex-none gap-2 rounded-[9px] border-0 px-[18px] text-sm font-semibold text-white hover:bg-white/8 data-[state=active]:bg-white/14 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-white/14 [&_svg]:size-4"
    )
      Box(aria-hidden="true")
      | {{ containersLabel }}
    TabsTrigger(
      value="images"
      class="min-h-10 flex-none gap-2 rounded-[9px] border-0 px-[18px] text-sm font-semibold text-white hover:bg-white/8 data-[state=active]:bg-white/14 data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-white/14 [&_svg]:size-4"
    )
      Layers(aria-hidden="true")
      | {{ imagesLabel }}
</template>
