<script setup lang="ts">
const props = defineProps<{ hasSelection: boolean }>()

const emit = defineEmits<{
  kill: []
  niceDown: []
  niceUp: []
  search: []
}>()

// F1/F2/F4/F5/F6/F10 sono qui solo per fedeltà visiva a htop: non fanno
// nulla finché non li agganci a funzionalità reali della tua app (help,
// setup, filtri, vista ad albero, menu ordinamento, uscita).
const KEYS: { key: string; label: string; action?: 'kill' | 'niceDown' | 'niceUp' | 'search' }[] = [
  { key: 'F1',  label: 'Help' },
  { key: 'F2',  label: 'Setup' },
  { key: 'F3',  label: 'Search', action: 'search' },
  { key: 'F4',  label: 'Filter' },
  { key: 'F5',  label: 'Tree' },
  { key: 'F6',  label: 'SortBy' },
  { key: 'F7',  label: 'Nice -', action: 'niceDown' },
  { key: 'F8',  label: 'Nice +', action: 'niceUp' },
  { key: 'F9',  label: 'Kill',   action: 'kill' },
  { key: 'F10', label: 'Quit' },
]

const NEEDS_SELECTION = new Set(['kill', 'niceDown', 'niceUp'])

function onClick(k: typeof KEYS[number]) {
  if (!k.action) return
  if (NEEDS_SELECTION.has(k.action) && !props.hasSelection) return
  emit(k.action)
}
</script>

<template>
  <div class="flex border-t border-zinc-800 bg-zinc-950 font-mono text-[11px]">
    <button
      v-for="k in KEYS"
      :key="k.key"
      type="button"
      class="flex flex-1 items-center justify-center gap-1 px-1.5 py-1 hover:bg-zinc-800 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
      :disabled="k.action ? (NEEDS_SELECTION.has(k.action) && !hasSelection) : false"
      @click="onClick(k)"
    >
      <span class="rounded-sm bg-zinc-800 px-1 text-zinc-300">{{ k.key.replace('F', '') }}</span>
      <span class="text-zinc-400">{{ k.label }}</span>
    </button>
  </div>
</template>