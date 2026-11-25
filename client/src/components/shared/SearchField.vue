<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ref } from 'vue'
import { cn } from '@/lib/utils'
import { onKeyStroke } from '@vueuse/core'
import { Search } from '@lucide/vue'
import { Kbd } from '@/components/ui/kbd'

// Campo di ricerca GNOME: 44px, raggio 10px, icona a sinistra, hint
// "Ctrl F" a destra. Con `shortcut` attivo Ctrl+F porta il focus qui.
const props = withDefaults(defineProps<{
  label: string
  placeholder?: string
  shortcut?: boolean
  class?: HTMLAttributes['class']
}>(), { shortcut: true })

const model = defineModel<string>({ required: true })
const input = ref<HTMLInputElement | null>(null)

onKeyStroke('f', (event) => {
  if (!props.shortcut || !(event.ctrlKey || event.metaKey)) return
  event.preventDefault()
  input.value?.focus()
  input.value?.select()
})

defineExpose({ focus: () => input.value?.focus() })
</script>

<template lang="pug">
label(:class="cn('flex min-h-11 items-center gap-2.5 rounded-[10px] bg-white/7 px-3.5 focus-within:ring-3 focus-within:ring-ring/50', props.class)")
  Search(class="size-4 shrink-0 text-muted-foreground" aria-hidden="true")
  span(class="sr-only") {{ label }}
  input(
    ref="input"
    v-model="model"
    type="search"
    :placeholder="placeholder"
    class="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
  )
  Kbd(v-if="shortcut" class="rounded-[5px] border border-white/14 bg-transparent px-1.5 font-mono text-2xs text-muted-foreground") Ctrl F
</template>
