<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template lang="pug">
//-
  Prima l'header aveva una ChevronDown senza alcun @click/toggle:
  un'icona che promette "clicca per espandere" e non fa nulla è
  un'affordance ingannevole. Tolta, sostituita con lo stesso stile
  di intestazione di sezione già usato in SettingsSection.vue
  (uppercase, tracking-widest) — coerenza invece di reinventare un
  terzo stile di header.
  bg-zinc-900/30 → bg-card: DESIGN.md non prevede traslucenze/vetro,
  solo superfici piene distinte per contrasto di luminosità.
div(class="rounded-lg border border-border bg-card p-4")
  header(class="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground") {{ title }}
  slot
</template>